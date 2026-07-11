import {Component, Inject, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatDialogModule, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {FormsModule} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {TranslatePipe} from '@ngx-translate/core';
import {ExpirationAlertStore} from '../../application/expiration-alert.store';
import {MitigationActionType} from '../../domain/model/expiration-alert.entity';

export interface RegisterMitigationActionDialogData {
  alertId: string;
  productName: string;
  batchLabel: string;
  batchQuantity: number;
}

/**
 * Outcome of the dialog, consumed by the caller to decide how to refresh/notify.
 */
export type RegisterMitigationActionResult = 'RESOLVED' | 'ALREADY_RESOLVED';

@Component({
  selector: 'app-register-mitigation-action-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  templateUrl: './register-mitigation-action-dialog.html',
  styleUrls: ['./register-mitigation-action-dialog.css']
})
export class RegisterMitigationActionDialogComponent {
  private readonly store = inject(ExpirationAlertStore);
  private readonly dialogRef = inject(MatDialogRef<RegisterMitigationActionDialogComponent, RegisterMitigationActionResult>);

  actionType = signal<MitigationActionType | ''>('');
  quantity = signal<number | null>(null);
  submitting = signal(false);
  serverError = signal<string | null>(null);

  /** Validation message key for the quantity field, or null when valid. */
  readonly quantityErrorKey = computed<string | null>(() => {
    const value = this.quantity();
    if (value === null) return null; // empty is allowed → full batch
    if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
      return 'inventory.expirationAlerts.dialog.quantityPositive';
    }
    if (value > this.data.batchQuantity) {
      return 'inventory.expirationAlerts.dialog.quantityExceedsBatch';
    }
    return null;
  });

  readonly canConfirm = computed(() =>
    this.actionType() !== '' && this.quantityErrorKey() === null && !this.submitting()
  );

  constructor(@Inject(MAT_DIALOG_DATA) public data: RegisterMitigationActionDialogData) {}

  onQuantityChange(value: string): void {
    const trimmed = (value ?? '').toString().trim();
    if (trimmed === '') {
      this.quantity.set(null);
      return;
    }
    this.quantity.set(Number(trimmed));
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.canConfirm()) return;

    const quantity = this.quantity();
    const request = {
      actionType: this.actionType() as MitigationActionType,
      ...(quantity !== null ? {quantity} : {})
    };

    this.submitting.set(true);
    this.serverError.set(null);

    this.store.registerAction(this.data.alertId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.dialogRef.close('RESOLVED');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 409 || err.status === 404) {
          // Already resolved (or no longer exists): let the list refresh and inform the user.
          this.dialogRef.close('ALREADY_RESOLVED');
          return;
        }
        if (err.status === 400) {
          this.serverError.set('inventory.expirationAlerts.dialog.invalidQuantityError');
          return;
        }
        this.serverError.set('inventory.expirationAlerts.dialog.genericError');
      }
    });
  }
}
