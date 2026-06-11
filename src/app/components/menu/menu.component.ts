import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, GamerProfile } from '../../services/api.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="menu-container scanline">
      <!-- Top Profile Card -->
      <div class="profile-card glass-panel" *ngIf="profile">
        <div class="profile-main" (click)="openEditModal()">
          <div class="avatar-container" [ngClass]="profile.avatar">
            <!-- Custom Vector SVG Avatars -->
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
          <div class="profile-details">
            <div class="gamer-tag">
              {{ profile.gamerTag }}
              <span class="edit-icon">✍️</span>
            </div>
            <div class="level-info label-mono">LVL {{ profile.level }} // XP {{ profile.xp }}/{{ profile.xpNextLevel }}</div>
            <div class="xp-bar-container">
              <div class="xp-bar-fill" [style.width.%]="getXpPercentage()"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Navigation Menu -->
      <div class="navigation-panel glass-panel">
        <h2 class="menu-title">MENU CHÍNH</h2>
        <div class="menu-buttons">
          <button class="btn btn-primary menu-btn" routerLink="/selector">
            <span>🎮 BẮT ĐẦU CHƠI</span>
          </button>
          
          <button class="btn btn-ghost-primary menu-btn" routerLink="/leaderboard">
            <span>🏆 BẢNG XẾP HẠNG</span>
          </button>
          
          <button class="btn btn-ghost-secondary menu-btn" (click)="exitGame()">
            <span>🚪 THOÁT</span>
          </button>
        </div>
      </div>

      <!-- Modal Popup for Profile Edit -->
      <div class="modal-overlay" *ngIf="showEditModal">
        <div class="modal-content glass-panel glow-primary">
          <h3 class="modal-title">CẤU HÌNH GAMER ID</h3>
          
          <div class="form-group">
            <label class="label-mono">TÊN ĐĂNG NHẬP (2 - 16 ký tự)</label>
            <input type="text" class="input-text" [(ngModel)]="editGamerTag" maxlength="16"/>
            <div class="error-msg" *ngIf="nameError">{{ nameError }}</div>
          </div>

          <div class="form-group">
            <label class="label-mono">CHỌN HÌNH ĐẠI DIỆN</label>
            <div class="avatar-selection-grid">
              <div 
                class="avatar-option" 
                [class.selected]="editAvatar === 'avatar_neon_bot'"
                (click)="editAvatar = 'avatar_neon_bot'"
              >
                <svg viewBox="0 0 100 100" class="avatar-svg neon_bot">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#adc6ff" stroke-width="4"/>
                  <circle cx="35" cy="45" r="5" fill="#adc6ff"/>
                  <circle cx="65" cy="45" r="5" fill="#adc6ff"/>
                  <path d="M 30 65 Q 50 80 70 65" fill="none" stroke="#adc6ff" stroke-width="4" stroke-linecap="round"/>
                </svg>
              </div>
              <div 
                class="avatar-option" 
                [class.selected]="editAvatar === 'avatar_cyber_ninja'"
                (click)="editAvatar = 'avatar_cyber_ninja'"
              >
                <svg viewBox="0 0 100 100" class="avatar-svg cyber_ninja">
                  <polygon points="50,5 95,50 50,95 5,50" fill="none" stroke="#ffb2b7" stroke-width="4"/>
                  <rect x="25" y="40" width="50" height="8" rx="4" fill="#ffb2b7"/>
                  <polygon points="35,44 42,40 37,36" fill="#10131a"/>
                  <polygon points="65,44 58,40 63,36" fill="#10131a"/>
                </svg>
              </div>
              <div 
                class="avatar-option" 
                [class.selected]="editAvatar === 'avatar_grid_runner'"
                (click)="editAvatar = 'avatar_grid_runner'"
              >
                <svg viewBox="0 0 100 100" class="avatar-svg grid_runner">
                  <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="none" stroke="#4ae176" stroke-width="4"/>
                  <polyline points="25,45 50,20 75,45" fill="none" stroke="#4ae176" stroke-width="3"/>
                  <line x1="50" y1="20" x2="50" y2="80" stroke="#4ae176" stroke-width="3"/>
                </svg>
              </div>
              <div 
                class="avatar-option" 
                [class.selected]="editAvatar === 'avatar_space_pilot'"
                (click)="editAvatar = 'avatar_space_pilot'"
              >
                <svg viewBox="0 0 100 100" class="avatar-svg space_pilot">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e0aaff" stroke-width="4"/>
                  <path d="M 20 50 A 30 30 0 0 1 80 50 Z" fill="none" stroke="#e0aaff" stroke-width="4"/>
                  <rect x="30" y="55" width="40" height="20" rx="3" fill="#e0aaff"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-ghost-secondary" (click)="closeEditModal()">HỦY</button>
            <button class="btn btn-primary" (click)="saveProfile()">LƯU</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .menu-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at center, #10131a 0%, #06080e 100%);
      padding: 24px;
    }

    /* Top Profile Card */
    .profile-card {
      width: 100%;
      max-width: 450px;
      margin-bottom: 24px;
      padding: 16px;
      cursor: pointer;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .profile-card:hover {
      border-color: rgba(173, 198, 255, 0.4);
      box-shadow: 0 0 15px var(--primary-glow);
    }
    .profile-main {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .avatar-container {
      width: 64px;
      height: 64px;
      border-radius: 4px;
      background: rgba(255,255,255,0.03);
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .avatar-svg {
      width: 100%;
      height: 100%;
    }
    .profile-details {
      flex: 1;
    }
    .gamer-tag {
      font-size: 20px;
      font-weight: 700;
      color: var(--on-surface);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .edit-icon {
      font-size: 14px;
      opacity: 0.6;
    }
    .level-info {
      font-size: 11px;
      color: var(--on-surface-variant);
      margin-top: 4px;
    }
    .xp-bar-container {
      height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
      margin-top: 8px;
      overflow: hidden;
    }
    .xp-bar-fill {
      height: 100%;
      background: var(--primary);
      box-shadow: 0 0 8px var(--primary);
      border-radius: 3px;
    }

    /* Navigation Menu */
    .navigation-panel {
      width: 100%;
      max-width: 450px;
      padding: 32px 24px;
      text-align: center;
    }
    .menu-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.15em;
      margin-bottom: 24px;
      color: var(--primary);
      text-shadow: 0 0 10px var(--primary-glow);
    }
    .menu-buttons {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .menu-btn {
      width: 100%;
      height: 50px;
      font-size: 15px;
      font-weight: 700;
    }

    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(5, 7, 12, 0.85);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
    }
    .modal-content {
      width: 90%;
      max-width: 400px;
      padding: 24px;
    }
    .modal-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: 0.1em;
      margin-bottom: 24px;
      text-align: center;
      text-shadow: 0 0 10px var(--primary-glow);
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 11px;
      color: var(--on-surface-variant);
    }
    .error-msg {
      color: var(--error);
      font-size: 12px;
      margin-top: 6px;
    }
    .avatar-selection-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 8px;
    }
    .avatar-option {
      background: rgba(255,255,255,0.02);
      border: 2px solid transparent;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .avatar-option:hover {
      background: rgba(255,255,255,0.06);
    }
    .avatar-option.selected {
      background: rgba(173, 198, 255, 0.1);
      border-color: var(--primary);
      box-shadow: 0 0 12px var(--primary-glow);
    }
    
    .neon_bot { stroke: #adc6ff; }
    .cyber_ninja { stroke: #ffb2b7; }
    .grid_runner { stroke: #4ae176; }
    .space_pilot { stroke: #e0aaff; }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 28px;
    }
  `]
})
export class MenuComponent implements OnInit {
  profile: GamerProfile | null = null;

  showEditModal = false;
  editGamerTag = '';
  editAvatar = '';
  nameError = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getProfile().subscribe(profile => {
      this.profile = profile;
    });
  }

  getXpPercentage(): number {
    if (!this.profile) return 0;
    return (this.profile.xp / this.profile.xpNextLevel) * 100;
  }

  openEditModal() {
    if (!this.profile) return;
    this.editGamerTag = this.profile.gamerTag;
    this.editAvatar = this.profile.avatar;
    this.nameError = '';
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  saveProfile() {
    // Validation
    const trimmed = this.editGamerTag.trim();
    if (trimmed.length < 2 || trimmed.length > 16) {
      this.nameError = 'Độ dài tên phải từ 2 đến 16 ký tự.';
      return;
    }

    const regex = /^[a-zA-Z0-9\s#_-àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễđìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]+$/u;
    if (!regex.test(trimmed)) {
      this.nameError = 'Tên không được chứa ký tự đặc biệt.';
      return;
    }

    this.api.updateProfile({ gamerTag: trimmed, avatar: this.editAvatar }).subscribe(updated => {
      this.profile = updated;
      this.showEditModal = false;
    });
  }

  exitGame() {
    if (confirm('Bạn có chắc chắn muốn thoát game?')) {
      // Clear access tokens / reset state, then redirect to splash
      localStorage.removeItem('gamer_profile');
      window.location.href = 'about:blank'; // Or close the window/tab
    }
  }
}
