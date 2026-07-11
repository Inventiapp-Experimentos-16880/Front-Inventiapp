import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LocalizationStore } from './localization/application/localization.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('StockTrack-frontend');

  private readonly localizationStore =
    inject(LocalizationStore);

  constructor() {
    this.localizationStore.initialize();
  }
}
