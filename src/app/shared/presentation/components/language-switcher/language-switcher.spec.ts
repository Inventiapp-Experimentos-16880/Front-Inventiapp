import { signal } from '@angular/core';

import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import {
  provideTranslateService
} from '@ngx-translate/core';

import {
  LocalizationStore
} from '../../../../localization/application/localization.store';

import {
  LanguageCode
} from '../../../../localization/domain/model/language-code';

import {
  LanguageMode
} from '../../../../localization/domain/model/language-mode';

import {
  LanguageSwitcher
} from './language-switcher';

describe('LanguageSwitcher', () => {

  let component: LanguageSwitcher;
  let fixture:
    ComponentFixture<LanguageSwitcher>;

  const activeLanguage =
    signal<LanguageCode>('es');

  const manualLanguage =
    signal<LanguageCode>('es');

  const languageMode =
    signal<LanguageMode>('manual');

  const locationLanguage =
    signal<LanguageCode | null>('de');

  const countryCode =
    signal<string | null>('DE');

  const loading =
    signal(false);

  const hasLocationRecommendation =
    signal(true);

  const localizationStoreMock = {
    activeLanguage:
      activeLanguage.asReadonly(),

    manualLanguage:
      manualLanguage.asReadonly(),

    languageMode:
      languageMode.asReadonly(),

    locationLanguage:
      locationLanguage.asReadonly(),

    countryCode:
      countryCode.asReadonly(),

    loading:
      loading.asReadonly(),

    hasLocationRecommendation:
      hasLocationRecommendation.asReadonly(),

    useManualLanguage:
      jasmine.createSpy(
        'useManualLanguage'
      ),

    selectManualLanguage:
      jasmine.createSpy(
        'selectManualLanguage'
      ),

    useLocationLanguage:
      jasmine.createSpy(
        'useLocationLanguage'
      ),

    refreshLocationRecommendation:
      jasmine.createSpy(
        'refreshLocationRecommendation'
      )
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher],
      providers: [
        provideTranslateService(),
        {
          provide: LocalizationStore,
          useValue: localizationStoreMock
        }
      ]
    }).compileComponents();

    fixture =
      TestBed.createComponent(
        LanguageSwitcher
      );

    component =
      fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    localizationStoreMock
      .useManualLanguage
      .calls.reset();

    localizationStoreMock
      .selectManualLanguage
      .calls.reset();

    localizationStoreMock
      .useLocationLanguage
      .calls.reset();

    localizationStoreMock
      .refreshLocationRecommendation
      .calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it(
    'should select the location language',
    () => {
      const locationButton =
        fixture.nativeElement
          .querySelector(
            '.location-option'
          ) as HTMLButtonElement;

      locationButton.click();

      expect(
        localizationStoreMock
          .useLocationLanguage
      ).toHaveBeenCalledTimes(1);
    }
  );

  it(
    'should select a manual language',
    () => {
      const languageButtons =
        Array.from(
          fixture.nativeElement
            .querySelectorAll(
              '.manual-language-button'
            )
        ) as HTMLButtonElement[];

      languageButtons[1].click();

      expect(
        localizationStoreMock
          .selectManualLanguage
      ).toHaveBeenCalledWith('en');
    }
  );
});
