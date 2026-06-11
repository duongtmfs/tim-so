import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, GamerProfile } from '../../services/api.service';
import { SoundService } from '../../services/sound.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="profile-container scanline" *ngIf="profile">
      <!-- Back Button -->
      <button class="back-btn label-mono" routerLink="/menu">← MENU CHÍNH</button>

      <div class="profile-panel glass-panel">
        <h2 class="panel-title">THÔNG TIN GAMER</h2>

        <div class="profile-header">
          <div class="avatar-box" [ngClass]="profile.avatar">
            <svg *ngIf="profile.avatar === 'avatar_neon_bot'" viewBox="0 0 100 100" class="avatar-svg">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#adc6ff" stroke-width="4"/>
              <circle cx="35" cy="45" r="5" fill="#adc6ff"/>
              <circle cx="65" cy="45" r="5" fill="#adc6ff"/>
              <path d="M 30 65 Q 50 80 70 65" fill="none" stroke="#adc6ff" stroke-width="4" stroke-linecap="round"/>
            </svg>
            <svg *ngIf="profile.avatar === 'avatar_cyber_ninja'" viewBox="0 0 100 100" class="avatar-svg">
              <polygon points="50,5 95,50 50,95 5,50" fill="none" stroke="#ffb2b7" stroke-width="4"/>
              <rect x="25" y="40" width="50" height="8" rx="4" fill="#ffb2b7"/>
              <polygon points="35,44 42,40 37,36" fill="#10131a"/>
              <polygon points="65,44 58,40 63,36" fill="#10131a"/>
            </svg>
            <svg *ngIf="profile.avatar === 'avatar_grid_runner'" viewBox="0 0 100 100" class="avatar-svg">
              <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="none" stroke="#4ae176" stroke-width="4"/>
              <polyline points="25,45 50,20 75,45" fill="none" stroke="#4ae176" stroke-width="3"/>
              <line x1="50" y1="20" x2="50" y2="80" stroke="#4ae176" stroke-width="3"/>
            </svg>
            <svg *ngIf="profile.avatar === 'avatar_space_pilot'" viewBox="0 0 100 100" class="avatar-svg">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e0aaff" stroke-width="4"/>
              <path d="M 20 50 A 30 30 0 0 1 80 50 Z" fill="none" stroke="#e0aaff" stroke-width="4"/>
              <rect x="30" y="55" width="40" height="20" rx="3" fill="#e0aaff"/>
            </svg>
          </div>
          
          <div class="user-info">
            <div class="name-title">{{ profile.gamerTag }}</div>
            <div class="level-badge label-mono">CẤP ĐỘ {{ profile.level }}</div>
          </div>
        </div>

        <div class="xp-section">
          <div class="xp-labels label-mono">
            <span>Tiến trình cấp độ:</span>
            <span>{{ profile.xp }} / {{ profile.xpNextLevel }} XP</span>
          </div>
          <div class="xp-bar-container">
            <div class="xp-bar-fill" [style.width.%]="getXpPercentage()"></div>
          </div>
        </div>

        <div class="doodle-line my-6"></div>

        <h3 class="section-subtitle font-marker">THIẾT LẬP HỆ THỐNG</h3>
        
        <div class="settings-form">
          <div class="setting-row">
            <span class="label-mono">ÂM THANH HIỆU ỨNG</span>
            <label class="switch-container">
              <input type="checkbox" [(ngModel)]="profile.soundEnabled" (change)="toggleSound()"/>
              <span class="switch-slider"></span>
            </label>
          </div>

          <div class="setting-row">
            <span class="label-mono">NHẬN THÔNG BÁO</span>
            <label class="switch-container">
              <input type="checkbox" [(ngModel)]="profile.notificationsEnabled" (change)="saveSettings()"/>
              <span class="switch-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 100vh;
      background: radial-gradient(circle at center, #fdfbf7 0%, #f1f5f9 100%);
      padding: 60px 24px 24px 24px;
      position: relative;
    }
    .back-btn {
      position: absolute;
      top: 24px;
      left: 24px;
      background: transparent;
      border: none;
      color: var(--ink-light);
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      transition: color 0.2s ease;
    }
    .back-btn:hover {
      color: var(--primary);
    }
    .profile-panel {
      width: 100%;
      max-width: 500px;
      padding: 32px;
    }
    .panel-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-align: center;
      margin-bottom: 32px;
      color: var(--ink-dark);
    }
    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
    }
    .avatar-box {
      width: 72px;
      height: 72px;
      background: rgba(0,0,0,0.02);
      border: 2px solid var(--ink-dark);
      border-radius: 4px;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar-svg {
      width: 100%;
      height: 100%;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .name-title {
      font-size: 22px;
      font-weight: 700;
    }
    .level-badge {
      font-size: 10px;
      background: var(--primary-highlighter);
      color: #1d4ed8;
      border: 1px solid var(--primary);
      padding: 3px 8px;
      border-radius: 2px;
      width: fit-content;
    }
    .xp-section {
      margin-bottom: 20px;
    }
    .xp-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--ink-light);
      margin-bottom: 8px;
    }
    .xp-bar-container {
      height: 8px;
      background: rgba(0,0,0,0.05);
      border-radius: 4px;
      overflow: hidden;
      border: 1.5px solid var(--ink-dark);
    }
    .xp-bar-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 4px;
    }
    .my-6 {
      margin-top: 24px;
      margin-bottom: 24px;
    }
    .section-subtitle {
      font-size: 20px;
      margin-bottom: 16px;
      color: var(--ink-dark);
    }
    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: rgba(0,0,0,0.01);
      border: 1.5px solid var(--ink-dark);
      border-radius: 255px 15px 225px 15px/15px 225px 15px 255px;
    }
    
    /* Toggle switch styles */
    .switch-container {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .switch-container input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .switch-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #e2e8f0;
      transition: .3s;
      border-radius: 24px;
      border: 2px solid var(--ink-dark);
    }
    .switch-slider:before {
      position: absolute;
      content: "";
      height: 12px;
      width: 12px;
      left: 4px;
      bottom: 4px;
      background-color: var(--ink-dark);
      transition: .3s;
      border-radius: 50%;
    }
    input:checked + .switch-slider {
      background-color: var(--primary);
    }
    input:checked + .switch-slider:before {
      transform: translateX(20px);
    }
  `]
})
export class ProfileComponent implements OnInit {
  profile: GamerProfile | null = null;

  constructor(private api: ApiService, private soundService: SoundService) {}

  ngOnInit() {
    this.api.getProfile().subscribe(profile => {
      this.profile = profile;
    });
  }

  getXpPercentage(): number {
    if (!this.profile) return 0;
    return (this.profile.xp / this.profile.xpNextLevel) * 100;
  }

  toggleSound() {
    if (this.profile) {
      this.soundService.setSoundEnabled(this.profile.soundEnabled);
      this.saveSettings();
    }
  }

  saveSettings() {
    if (this.profile) {
      this.api.updateProfile({
        soundEnabled: this.profile.soundEnabled,
        notificationsEnabled: this.profile.notificationsEnabled
      }).subscribe();
    }
  }
}
