import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, LeaderboardEntry } from '../../services/api.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="leaderboard-container scanline">
      <!-- Back Button -->
      <button class="back-btn label-mono" routerLink="/menu">← MENU CHÍNH</button>

      <div class="leaderboard-panel glass-panel">
        <h2 class="panel-title">BẢNG XẾP HẠNG CAO THỦ</h2>

        <!-- Rule filter Tabs -->
        <div class="tabs-bar label-mono">
          <button 
            class="tab-btn" 
            [class.active]="selectedTab === 'sequence'"
            (click)="selectTab('sequence')"
          >
            1 - 100
          </button>
          <button 
            class="tab-btn" 
            [class.active]="selectedTab === 'even-odd'"
            (click)="selectTab('even-odd')"
          >
            CHẴN LẺ
          </button>
          <button 
            class="tab-btn" 
            [class.active]="selectedTab === 'assigned'"
            (click)="selectTab('assigned')"
          >
            SỐ CHO TRƯỚC
          </button>
        </div>

        <!-- Leaderboard Table -->
        <div class="table-wrapper">
          <table class="scores-table">
            <thead>
              <tr class="label-mono opacity-60">
                <th class="col-rank">HẠNG</th>
                <th class="col-name">GAMER</th>
                <th class="col-score text-right">ĐIỂM SỐ</th>
                <th class="col-date text-right">NGÀY THI ĐẤU</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of scores; let idx = index" class="score-row animate-row" [style.animation-delay.ms]="idx * 40">
                <td class="col-rank font-mono">
                  <span class="rank-badge" [ngClass]="'rank-' + (idx + 1)" *ngIf="idx < 3">
                    {{ idx + 1 }}
                  </span>
                  <span class="rank-text" *ngIf="idx >= 3">
                    #{{ idx + 1 }}
                  </span>
                </td>
                <td class="col-name font-sans font-bold">
                  {{ entry.name }}
                </td>
                <td class="col-score font-mono font-bold text-right score-val">
                  {{ entry.score }}
                </td>
                <td class="col-date font-mono text-right date-val">
                  {{ formatDate(entry.date) }}
                </td>
              </tr>
              <tr *ngIf="scores.length === 0">
                <td colspan="4" class="no-data label-mono">CHƯA CÓ DỮ LIỆU ĐIỂM SỐ THI ĐẤU</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .leaderboard-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 100vh;
      background: radial-gradient(circle at center, #10131a 0%, #06080e 100%);
      padding: 60px 24px 24px 24px;
      position: relative;
    }
    .back-btn {
      position: absolute;
      top: 24px;
      left: 24px;
      background: transparent;
      border: none;
      color: var(--on-surface-variant);
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      transition: color 0.2s ease;
    }
    .back-btn:hover {
      color: var(--primary);
    }
    .leaderboard-panel {
      width: 100%;
      max-width: 750px;
      padding: 32px;
    }
    .panel-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-align: center;
      margin-bottom: 24px;
      color: var(--primary);
      text-shadow: 0 0 10px var(--primary-glow);
    }

    /* Tabs */
    .tabs-bar {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      padding-bottom: 16px;
    }
    .tab-btn {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 4px;
      color: var(--on-surface-variant);
      padding: 10px 20px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      transition: all 0.2s ease;
    }
    .tab-btn:hover {
      background: rgba(255,255,255,0.06);
      color: var(--on-surface);
    }
    .tab-btn.active {
      background: rgba(173, 198, 255, 0.1);
      border-color: var(--primary);
      color: var(--primary);
      box-shadow: 0 0 10px var(--primary-glow);
    }

    /* Table styles */
    .table-wrapper {
      background: rgba(11, 14, 21, 0.7);
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.03);
    }
    .scores-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .scores-table th, .scores-table td {
      padding: 14px 20px;
    }
    .scores-table th {
      font-size: 11px;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .score-row {
      border-bottom: 1px solid rgba(255,255,255,0.02);
      transition: background 0.15s ease;
    }
    .score-row:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    .score-row:last-child {
      border-bottom: none;
    }

    .col-rank { width: 80px; }
    .col-name { width: 40%; }
    .col-score { width: 20%; }
    .col-date { width: 30%; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }

    /* Rank badges */
    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 12px;
      color: #020617;
    }
    .rank-1 {
      background-color: #ffd700; /* Gold */
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }
    .rank-2 {
      background-color: #c0c0c0; /* Silver */
      box-shadow: 0 0 10px rgba(192, 192, 192, 0.5);
    }
    .rank-3 {
      background-color: #cd7f32; /* Bronze */
      box-shadow: 0 0 10px rgba(205, 127, 50, 0.5);
    }
    .rank-text {
      color: var(--on-surface-variant);
      padding-left: 4px;
    }
    .score-val {
      color: var(--tertiary);
      text-shadow: 0 0 8px var(--tertiary-glow);
    }
    .date-val {
      color: var(--on-surface-variant);
      opacity: 0.8;
      font-size: 13px;
    }
    .no-data {
      text-align: center;
      color: var(--outline);
      padding: 40px;
      font-size: 12px;
    }

    /* Row entry animations */
    .animate-row {
      opacity: 0;
      transform: translateY(8px);
      animation: rowFadeIn 0.3s forwards ease-out;
    }
    @keyframes rowFadeIn {
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LeaderboardComponent implements OnInit {
  selectedTab = 'sequence'; // sequence, even-odd, assigned
  scores: LeaderboardEntry[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.fetchScores();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.fetchScores();
  }

  private fetchScores() {
    this.api.getLeaderboard(this.selectedTab).subscribe(scores => {
      this.scores = scores;
    });
  }

  formatDate(isoString: string): string {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hour = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hour}:${min}`;
  }
}
