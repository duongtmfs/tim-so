import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService, GamerProfile } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-selector',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="selector-container scanline">
      <!-- Back Button -->
      <button class="back-btn label-mono" routerLink="/menu">← TRỞ LẠI</button>

      <div class="panel glass-panel">
        <h2 class="panel-title">CẤU HÌNH TRẬN ĐẤU</h2>

        <!-- Tier 1: Rules -->
        <div class="step-section">
          <div class="step-num label-mono">BƯỚC 1 // CHỌN QUY TẮC SỐ</div>
          <div class="btn-grid">
            <button 
              class="choice-btn" 
              [class.selected]="selectedRules === 'sequence'"
              (click)="selectedRules = 'sequence'"
            >
              <span class="btn-title">1 - 100</span>
              <span class="btn-desc">Click các số từ 1 đến 100 theo thứ tự tăng dần</span>
            </button>
            
            <button 
              class="choice-btn" 
              [class.selected]="selectedRules === 'even-odd'"
              (click)="selectedRules = 'even-odd'"
            >
              <span class="btn-title">CHẴN LẺ</span>
              <span class="btn-desc">Click các số Chẵn hoặc Lẻ theo yêu cầu hệ thống</span>
            </button>
            
            <button 
              class="choice-btn" 
              [class.selected]="selectedRules === 'assigned'"
              (click)="selectedRules = 'assigned'"
            >
              <span class="btn-title">SỐ CHO TRƯỚC</span>
              <span class="btn-desc">Click chính xác con số mục tiêu được chỉ định</span>
            </button>
          </div>
        </div>

        <!-- Tier 2: Mode -->
        <div class="step-section" *ngIf="selectedRules">
          <div class="step-num label-mono">BƯỚC 2 // CHỌN CHẾ ĐỘ THAM GIA</div>
          <div class="btn-grid mode-grid">
            <button 
              class="choice-btn mode-btn" 
              [class.selected]="selectedMode === 'solo'"
              (click)="selectMode('solo')"
            >
              <span class="btn-title">CHƠI ĐƠN (SOLO)</span>
              <span class="btn-desc font-mono">Tập luyện cá nhân chống lại thời gian</span>
            </button>
            
            <button 
              class="choice-btn mode-btn" 
              [class.selected]="selectedMode === 'pvp'"
              (click)="selectMode('pvp')"
            >
              <span class="btn-title">ĐỐI KHÁNG (PVP)</span>
              <span class="btn-desc font-mono">Chơi cùng bạn bè, so tài thời gian thực</span>
            </button>
          </div>
        </div>

        <!-- Tier 3: Difficulty (Solo only) -->
        <div class="step-section" *ngIf="selectedMode === 'solo'">
          <div class="step-num label-mono">BƯỚC 3 // THIẾT LẬP ĐỘ KHÓ</div>
          <div class="btn-grid difficulty-grid">
            <button 
              class="choice-btn diff-btn" 
              [class.selected]="selectedDifficulty === 'easy'"
              (click)="selectedDifficulty = 'easy'"
            >
              <span class="btn-title text-green">DỄ</span>
              <span class="btn-desc font-mono">Giới hạn: 5 phút // Phạt: -120đ</span>
            </button>
            
            <button 
              class="choice-btn diff-btn" 
              [class.selected]="selectedDifficulty === 'medium'"
              (click)="selectedDifficulty = 'medium'"
            >
              <span class="btn-title text-blue">TRUNG BÌNH</span>
              <span class="btn-desc font-mono">Giới hạn: 4 phút // Phạt: -60đ</span>
            </button>
            
            <button 
              class="choice-btn diff-btn" 
              [class.selected]="selectedDifficulty === 'hard'"
              (click)="selectedDifficulty = 'hard'"
            >
              <span class="btn-title text-pink">KHÓ</span>
              <span class="btn-desc font-mono">Giới hạn: 3 phút // Phạt: -0đ</span>
            </button>
          </div>
        </div>

        <!-- Tier 3: Room Setup (PvP only) -->
        <div class="step-section" *ngIf="selectedMode === 'pvp'">
          <div class="step-num label-mono">BƯỚC 3 // KẾT NỐI PHÒNG CHƠI</div>
          <div class="pvp-actions">
            <!-- Host Panel -->
            <div class="pvp-panel-box glass-panel">
              <div class="pvp-box-title label-mono">TẠO TRẬN ĐẤU MỚI</div>
              <p class="pvp-box-desc">Nhận mã phòng 6 chữ số và gửi lời mời đến đối thủ của bạn.</p>
              <button class="btn btn-primary w-full" (click)="createPvpRoom()" [disabled]="isLoading">
                {{ isLoading ? 'ĐANG KHỞI TẠO...' : 'TẠO PHÒNG MỚI' }}
              </button>
            </div>
            
            <!-- Guest Panel -->
            <div class="pvp-panel-box glass-panel">
              <div class="pvp-box-title label-mono">THAM GIA PHÒNG CHƠI</div>
              <p class="pvp-box-desc">Nhập mã phòng được cung cấp để kết nối trực tiếp vào sảnh chờ.</p>
              <div class="join-input-group">
                <input 
                  type="text" 
                  class="input-text font-mono text-center text-lg" 
                  placeholder="MÃ PHÒNG (6 SỐ)" 
                  [(ngModel)]="joinRoomId"
                  maxlength="6"
                />
                <button class="btn btn-ghost-primary" (click)="joinPvpRoom()" [disabled]="isLoading || joinRoomId.length < 6">
                  THAM GIA
                </button>
              </div>
              <div class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</div>
            </div>
          </div>
        </div>

        <!-- Start Button for Solo -->
        <div class="action-footer" *ngIf="selectedMode === 'solo' && selectedDifficulty">
          <button class="btn btn-primary start-match-btn" (click)="startSoloGame()">
            🚀 BẮT ĐẦU TRẬN ĐẤU
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .selector-container {
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
    .panel {
      width: 100%;
      max-width: 650px;
      padding: 32px;
    }
    .panel-title {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-align: center;
      margin-bottom: 32px;
      color: var(--primary);
      text-shadow: 0 0 10px var(--primary-glow);
    }
    .step-section {
      margin-bottom: 28px;
      animation: sectionFadeIn 0.4s ease-out;
    }
    .step-num {
      font-size: 11px;
      color: var(--outline);
      margin-bottom: 12px;
    }
    .btn-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .mode-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .choice-btn {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      padding: 16px 12px;
      text-align: left;
      cursor: pointer;
      color: var(--on-surface-variant);
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .choice-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.15);
      color: var(--on-surface);
    }
    .choice-btn.selected {
      background: rgba(173, 198, 255, 0.08);
      border-color: var(--primary);
      color: var(--primary);
      box-shadow: 0 0 12px var(--primary-glow);
    }
    .btn-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .btn-desc {
      font-size: 11px;
      line-height: 1.4;
      opacity: 0.7;
    }
    .text-green { color: var(--tertiary); }
    .text-blue { color: var(--primary); }
    .text-pink { color: var(--secondary); }

    /* PvP Section */
    .pvp-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .pvp-panel-box {
      padding: 20px;
      display: flex;
      flex-direction: column;
    }
    .pvp-box-title {
      font-size: 12px;
      color: var(--on-surface);
      margin-bottom: 8px;
    }
    .pvp-box-desc {
      font-size: 11px;
      color: var(--on-surface-variant);
      line-height: 1.4;
      margin-bottom: 20px;
      flex: 1;
    }
    .join-input-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .text-center { text-align: center; }
    .text-lg { font-size: 18px; letter-spacing: 0.1em; }
    .w-full { width: 100%; }
    .error-msg {
      color: var(--error);
      font-size: 11px;
      margin-top: 8px;
      text-align: center;
    }

    .action-footer {
      display: flex;
      justify-content: center;
      margin-top: 32px;
    }
    .start-match-btn {
      padding: 16px 40px;
      font-size: 16px;
      font-weight: 700;
    }

    @keyframes sectionFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class SelectorComponent implements OnInit, OnDestroy {
  profile: GamerProfile | null = null;

  selectedRules = 'sequence'; // sequence, even-odd, assigned
  selectedMode = ''; // solo, pvp
  selectedDifficulty = 'medium'; // easy, medium, hard
  joinRoomId = '';
  isLoading = false;
  errorMessage = '';

  private subs: Subscription[] = [];

  constructor(
    private api: ApiService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit() {
    this.api.getProfile().subscribe(profile => {
      this.profile = profile;
    });

    // Listen to Socket connections
    this.socketService.connect();

    this.subs.push(
      this.socketService.roomCreated$.subscribe(room => {
        this.isLoading = false;
        // Navigate to lobby as Host
        this.router.navigate(['/lobby'], { state: { room, role: 'host' } });
      })
    );

    this.subs.push(
      this.socketService.roomUpdated$.subscribe(room => {
        this.isLoading = false;
        // Navigate to lobby as Guest
        this.router.navigate(['/lobby'], { state: { room, role: 'guest' } });
      })
    );

    this.subs.push(
      this.socketService.joinError$.subscribe(error => {
        this.isLoading = false;
        this.errorMessage = error;
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  selectMode(mode: string) {
    this.selectedMode = mode;
    this.errorMessage = '';
    this.joinRoomId = '';
  }

  startSoloGame() {
    this.router.navigate(['/play'], {
      queryParams: {
        rules: this.selectedRules,
        mode: 'solo',
        difficulty: this.selectedDifficulty
      }
    });
  }

  createPvpRoom() {
    if (!this.profile) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.socketService.createRoom(this.profile.gamerTag, this.selectedRules, 'medium');
  }

  joinPvpRoom() {
    if (!this.profile || !this.joinRoomId) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.socketService.joinRoom(this.joinRoomId.trim(), this.profile.gamerTag);
  }
}
