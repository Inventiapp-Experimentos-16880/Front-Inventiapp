import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar';
import { MobileNavComponent } from '../mobile-nav/mobile-nav';
import { TopbarComponent } from '../topbar/topbar';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    SidebarComponent,
    MobileNavComponent,
    TopbarComponent,
    CommonModule
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit, OnDestroy {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  isMobile = false;
  isOnboarding = false;

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
      });

    // Detect onboarding query parameter to hide sidebar/topbar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.checkOnboarding();
    });

    this.checkOnboarding();
  }

  private checkOnboarding(): void {
    const urlTree = this.router.parseUrl(this.router.url);
    this.isOnboarding = urlTree.queryParams['onboarding'] === 'true';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
