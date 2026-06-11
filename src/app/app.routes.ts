import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/splash/splash.component').then(m => m.SplashComponent)
  },
  {
    path: 'menu',
    loadComponent: () => import('./components/menu/menu.component').then(m => m.MenuComponent)
  },
  {
    path: 'selector',
    loadComponent: () => import('./components/selector/selector.component').then(m => m.SelectorComponent)
  },
  {
    path: 'play',
    loadComponent: () => import('./components/play/play.component').then(m => m.PlayComponent)
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./components/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'lobby',
    loadComponent: () => import('./components/lobby/lobby.component').then(m => m.LobbyComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
