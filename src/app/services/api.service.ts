import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Game {
  id: string;
  title: string;
  genre: string;
  description: string;
  rating: number;
  playCount: number;
  activePlayers: number;
  color: string;
  gradient: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  gameId: string;
  date: string;
}

export interface GamerProfile {
  gamerTag: string;
  avatar: string;
  level: number;
  xp: number;
  xpNextLevel: number;
  theme: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface Lobby {
  id: string;
  gameId: string;
  name: string;
  creator: string;
  players: string[];
  maxPlayers: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.baseUrl}/games`).pipe(
      catchError(err => {
        console.error('Failed to fetch games, using fallback data', err);
        return of([
          {
            id: 'space-dodge',
            title: 'Neon Space Dodge',
            genre: 'Retro Arcade',
            description: 'Navigate your neon spaceship through a dangerous field of falling asteroids. Dodge, survive, and compete for the highest score!',
            rating: 4.8,
            playCount: 1240,
            activePlayers: 14,
            color: '#e0aaff',
            gradient: 'linear-gradient(135deg, #7b2cbf, #5a189a)'
          }
        ]);
      })
    );
  }

  getLobbies(): Observable<Lobby[]> {
    return this.http.get<Lobby[]>(`${this.baseUrl}/lobbies`).pipe(
      catchError(() => of([]))
    );
  }

  createLobby(gameId: string, name: string, creator: string): Observable<Lobby> {
    return this.http.post<Lobby>(`${this.baseUrl}/lobbies`, { gameId, name, creator });
  }

  joinLobby(lobbyId: string, player: string): Observable<Lobby> {
    return this.http.post<Lobby>(`${this.baseUrl}/lobbies/${lobbyId}/join`, { player });
  }

  leaveLobby(lobbyId: string, player: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/lobbies/${lobbyId}/leave`, { player });
  }

  getLeaderboard(gameId?: string): Observable<LeaderboardEntry[]> {
    const url = gameId ? `${this.baseUrl}/leaderboard?gameId=${gameId}` : `${this.baseUrl}/leaderboard`;
    return this.http.get<LeaderboardEntry[]>(url).pipe(
      catchError(() => of([]))
    );
  }

  submitScore(name: string, score: number, gameId: string): Observable<LeaderboardEntry[]> {
    return this.http.post<LeaderboardEntry[]>(`${this.baseUrl}/leaderboard`, { name, score, gameId }).pipe(
      catchError(err => {
        console.error('Failed to submit score to backend', err);
        return of([]);
      })
    );
  }

  private createDefaultProfile(): GamerProfile {
    const randId = Math.floor(1000 + Math.random() * 9000);
    return {
      gamerTag: `Người chơi #${randId}`,
      avatar: 'avatar_neon_bot',
      level: 1,
      xp: 0,
      xpNextLevel: 1000,
      theme: 'dark-neon',
      soundEnabled: true,
      notificationsEnabled: false
    };
  }

  private readLocalProfile(): GamerProfile | null {
    const local = localStorage.getItem('gamer_profile');
    if (!local) return null;
    try {
      return JSON.parse(local);
    } catch {
      return null;
    }
  }

  private saveLocalProfile(profile: GamerProfile): GamerProfile {
    localStorage.setItem('gamer_profile', JSON.stringify(profile));
    return profile;
  }

  // Profile is stored per device in localStorage (not shared globally on server)
  getProfile(): Observable<GamerProfile> {
    const existing = this.readLocalProfile();
    if (existing) {
      return of(existing);
    }
    return of(this.saveLocalProfile(this.createDefaultProfile()));
  }

  updateProfile(profile: Partial<GamerProfile>): Observable<GamerProfile> {
    const current = this.readLocalProfile() ?? this.createDefaultProfile();
    return of(this.saveLocalProfile({ ...current, ...profile }));
  }
}
