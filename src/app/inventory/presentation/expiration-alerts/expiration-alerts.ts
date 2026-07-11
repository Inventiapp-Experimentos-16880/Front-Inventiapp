import {Component, OnInit, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import {MatChipsModule} from '@angular/material/chips';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {ExpirationAlertStore} from '../../application/expiration-alert.store';
import {ExpirationAlertStatus} from '../../domain/model/expiration-alert.entity';
import {
  RegisterMitigationActionDialogComponent,
  RegisterMitigationActionDialogData,
  RegisterMitigationActionResult
} from '../register-mitigation-action-dialog/register-mitigation-action-dialog';

interface AlertRow {
  id: string;
  productId: string;
  batchId: string;
  productName: string;
  batchLabel: string;
  batchQuantity: number;
  expirationDate: string;
  triggeredAt: string;
  status: ExpirationAlertStatus;
  actionType: 'LIQUIDATION' | 'RETURN' | null;
  resolvedAt: string | null;
}

@Component({
  selector: 'app-expiration-alerts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './expiration-alerts.html',
  styleUrls: ['./expiration-alerts.css']
})
export class ExpirationAlertsComponent implements OnInit {
  protected readonly store = inject(ExpirationAlertStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly displayedColumns = ['product', 'lot', 'expiration', 'triggeredAt', 'status', 'action'];

  statusFilter = signal<ExpirationAlertStatus | 'ALL'>('ALL');
  searchTerm = signal<string>('');

  /** All alerts enriched with product/batch data, PENDING first. */
  readonly rows = computed<AlertRow[]>(() => {
    const productNameById = new Map(this.store.products().map(p => [p.id, p.name]));
    const batchById = new Map(this.store.batches().map(b => [b.id, b]));

    return this.store.alerts()
      .map(alert => {
        const batch = batchById.get(alert.batchId);
        return {
          id: alert.id,
          productId: alert.productId,
          batchId: alert.batchId,
          productName: productNameById.get(alert.productId) ?? this.t('inventory.expirationAlerts.unknownProduct'),
          batchLabel: this.batchLabel(alert.batchId),
          batchQuantity: batch?.quantity ?? 0,
          expirationDate: alert.expirationDate,
          triggeredAt: alert.triggeredAt,
          status: alert.status,
          actionType: alert.actionType,
          resolvedAt: alert.resolvedAt
        } as AlertRow;
      })
      .sort((a, b) => {
        // PENDING (require action) first, then RESOLVED history.
        if (a.status !== b.status) return a.status === 'PENDING' ? -1 : 1;
        // Within PENDING: soonest expiration first. Within RESOLVED: most recent first.
        if (a.status === 'PENDING') {
          return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        }
        return new Date(b.resolvedAt ?? b.triggeredAt).getTime() - new Date(a.resolvedAt ?? a.triggeredAt).getTime();
      });
  });

  readonly filteredRows = computed<AlertRow[]>(() => {
    const status = this.statusFilter();
    const term = this.searchTerm().trim().toLowerCase();

    return this.rows().filter(row => {
      if (status !== 'ALL' && row.status !== status) return false;
      if (term) {
        const haystack = `${row.productName} ${row.batchLabel}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  });

  readonly pendingCount = computed(() => this.rows().filter(r => r.status === 'PENDING').length);

  readonly hasActiveFilters = computed(() =>
    this.statusFilter() !== 'ALL' || this.searchTerm().trim() !== ''
  );

  ngOnInit(): void {
    this.store.refresh();
  }

  scanNow(): void {
    this.store.scan().subscribe({
      next: ({created}) => {
        const message = created > 0
          ? this.translate.instant('inventory.expirationAlerts.scanCreated', {count: created})
          : this.t('inventory.expirationAlerts.scanNoNew');
        this.notifyMessage(message);
      },
      error: () => {
        this.notify('inventory.expirationAlerts.scanError');
      }
    });
  }

  batchLabel(batchId: string): string {
    return `L-${batchId}`;
  }

  clearFilters(): void {
    this.statusFilter.set('ALL');
    this.searchTerm.set('');
  }

  openRegisterActionDialog(row: AlertRow): void {
    const data: RegisterMitigationActionDialogData = {
      alertId: row.id,
      productName: row.productName,
      batchLabel: row.batchLabel,
      batchQuantity: row.batchQuantity
    };

    const dialogRef = this.dialog.open(RegisterMitigationActionDialogComponent, {
      width: '460px',
      maxWidth: '92vw',
      data
    });

    dialogRef.afterClosed().subscribe((result?: RegisterMitigationActionResult) => {
      if (!result) return;

      if (result === 'RESOLVED') {
        this.notify('inventory.expirationAlerts.actionRegistered');
      } else if (result === 'ALREADY_RESOLVED') {
        this.notify('inventory.expirationAlerts.alreadyResolved');
      }
      this.store.refresh();
    });
  }

  private notify(key: string): void {
    this.notifyMessage(this.t(key));
  }

  private notifyMessage(message: string): void {
    this.snackBar.open(message, this.t('global.exit'), {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  protected t(key: string): string {
    return this.translate.instant(key);
  }

  trackByAlertId(_: number, row: AlertRow): string {
    return row.id;
  }
}
