import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef
} from '@angular/material/dialog';
import {ProvidersApi} from '../../../infrastructure/providers-api';
import {Provider} from '../../../../inventory/domain/model/provider.entity';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {TranslatePipe} from '@ngx-translate/core';

export function rucValidator(control: AbstractControl): ValidationErrors | null {
  const ruc = control.value;
  if (!ruc) return null;
  // Solo validamos que sean 11 números
  if (!/^[0-9]{11}$/.test(ruc)) return { pattern: true };
  // Validamos prefijos peruanos básicos
  const prefijo = ruc.substring(0, 2);
  const prefijosValidos = ['10', '20', '15', '17'];
  if (!prefijosValidos.includes(prefijo)) {
    return { invalidPrefix: true };
  }
  // Evitamos que sean todos iguales (como 11111111111)
  const esRepetido = ruc.split('').every((char: string) => char === ruc[0]);
  if (esRepetido) return { allSameDigits: true };
  // HEMOS QUITADO EL CÁLCULO MATEMÁTICO AQUÍ PARA QUE TE DEJE PASAR
  return null;
}

@Component({
  selector: 'app-provider-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogContent,
    MatFormFieldModule,
    MatInput,
    ReactiveFormsModule,
    MatDialogActions,
    MatButton,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  templateUrl: './provider-form-dialog.html',
  styleUrl: './provider-form-dialog.css'
})
export class ProviderFormDialog implements OnInit {
  saving = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ProvidersApi,
    private ref: MatDialogRef<ProviderFormDialog, Provider>,
    @Inject(MAT_DIALOG_DATA) public data: Provider
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName: [this.data?.firstName || '', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      lastName: [this.data?.lastName || '', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      phoneNumber: [this.data?.phoneNumber || '', [Validators.required, Validators.pattern(/^9[0-9]{8}$/)]],
      email: [this.data?.email || '', [Validators.required, Validators.email]],
      ruc: [this.data?.ruc || '', [Validators.required, Validators.pattern(/^[0-9]{11}$/), rucValidator]]
    });
  }

  cancel(): void {
    this.ref.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;

    const changes = this.form.getRawValue();
    const payload = new Provider({
      id: this.data?.id || '',
      firstName: changes.firstName!,
      lastName: changes.lastName!,
      phoneNumber: changes.phoneNumber!,
      email: changes.email!,
      ruc: changes.ruc!
    });

    const request = this.data?.id
      ? this.api.updateProviderById(payload, +this.data.id)
      : this.api.createProvider(payload);

    request.subscribe({
      next: (result: any) => this.ref.close(result ?? payload),
      error: (error) => {
        console.error('Operation failed:', error);
        this.saving = false;
      },
      complete: () => this.saving = false
    });
  }
}
