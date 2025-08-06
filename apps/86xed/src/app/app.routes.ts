import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { SupabaseService } from './services/api/supabase.service';
import { map } from 'rxjs/operators';

// Modern route guards using functional approach
export const authGuard: CanActivateFn = () => {
  const supabaseService = inject(SupabaseService);
  return supabaseService.user$.pipe(map((user) => !!user));
};

export const guestOnlyGuard: CanActivateFn = () => {
  const supabaseService = inject(SupabaseService);
  return supabaseService.user$.pipe(map((user) => !user));
};

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: '86xed - Create Viral Bingo Grids',
  },
  {
    path: 'grid-builder',
    loadComponent: () =>
      import('./pages/grid-builder/grid-builder.component').then(
        (m) => m.GridBuilderComponent
      ),
    title: 'Grid Builder - 86xed',
  },
  {
    path: 'gallery',
    loadComponent: () =>
      import('./pages/gallery/gallery.component').then(
        (m) => m.GalleryComponent
      ),
    title: 'Gallery - 86xed',
  },
  {
    path: 'social-feed',
    loadComponent: () =>
      import('./pages/social-feed/social-feed.component').then(
        (m) => m.SocialFeedComponent
      ),
    title: 'Social Feed - 86xed',
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    title: 'Profile - 86xed',
    canActivate: [authGuard],
  },
  {
    path: 'auth',
    canActivate: [guestOnlyGuard],
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
        title: 'Sign In - 86xed',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/auth/register/register.component').then(
            (m) => m.RegisterComponent
          ),
        title: 'Create Account - 86xed',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
