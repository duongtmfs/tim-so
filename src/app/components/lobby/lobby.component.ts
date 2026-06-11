import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="lobby-container scanline" *ngIf="room">
      <!-- Back Button -->
      <button class="back-btn label-mono" (click)="leaveLobby()">← RỜI PHÒNG</button>

      <div class="lobby-panel glass-panel glow-primary">
        <h2 class="lobby-title">SẢNH CHỜ TRẬN ĐẤU</h2>
        
        <!-- Room Code -->
        <div class="room-code-box">
          <div class="room-label label-mono">MÃ PHÒNG CHƠI</div>
          <div class="room-code font-mono">{{ room.id }}</div>
          <div class="room-invite-desc">Hãy gửi mã này cho bạn của bạn để tham gia cùng một trận đấu.</div>
        </div>

        <div class="match-info glass-panel">
          <div class="info-row">
            <span class="label-mono opacity-60">QUY TẮC:</span>
            <span class="info-value font-mono">{{ getRulesLabel() }}</span>
          </div>
          <div class="info-row">
            <span class="label-mono opacity-60">THỜI GIAN ĐẤU:</span>
            <span class="info-value font-mono">4 PHÚT (240s)</span>
          </div>
        </div>

        <!-- Players List -->
        <div class="players-section">
          <div class="player-box glass-panel" [class.connected]="room.host">
            <div class="player-role label-mono">CHỦ PHÒNG (HOST)</div>
            <div class="player-name">{{ room.host.name }}</div>
            <div class="player-status connected label-mono">SẴN SÀNG</div>
          </div>

          <div class="vs-divider label-mono">VS</div>

          <div class="player-box glass-panel" [class.connected]="room.guest" [class.waiting]="!room.guest">
            <div class="player-role label-mono">ĐỐI THỦ (GUEST)</div>
            <div class="player-name">{{ room.guest ? room.guest.name : 'ĐANG CHỜ ĐỐI THỦ...' }}</div>
            <div class="player-status label-mono" [class.connected]="room.guest">
              {{ room.guest ? 'SẴN SÀNG' : 'CONNECTING...' }}
            </div>
          </div>
        </div>

        <!-- Control Action Footer -->
        <div class="lobby-footer">
          <!-- Host Controls -->
          <div *ngIf="role === 'host'" class="footer-control-box">
            <button 
              class="btn btn-primary start-btn" 
              [disabled]="!room.guest"
              (click)="startGame()"
            >
              🚀 BẮT ĐẦU TRẬN ĐẤU
            </button>
            <p class="footer-hint" *ngIf="!room.guest">Cần có đối thủ tham gia để bắt đầu trận đấu.</p>
          </div>

          <!-- Guest Controls -->
          <div *ngIf="role === 'guest'" class="footer-control-box">
            <div class="waiting-indicator">
              <div class="pulse-dot"></div>
              <span class="label-mono">ĐANG CHỜ CHỦ PHÒNG BẮT ĐẦU TRẬN ĐẤU...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lobby-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at center, #10131a 0%, #06080e 100%);
      padding: 24px;
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
      color: var(--secondary);
    }
    .lobby-panel {
      width: 100%;
      max-width: 550px;
      padding: 32px;
      text-align: center;
    }
    .lobby-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.15em;
      margin-bottom: 28px;
      color: var(--primary);
      text-shadow: 0 0 10px var(--primary-glow);
    }
    .room-code-box {
      background: rgba(11, 14, 21, 0.7);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 4px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .room-label {
      font-size: 11px;
      color: var(--on-surface-variant);
      margin-bottom: 8px;
    }
    .room-code {
      font-size: 44px;
      font-weight: 800;
      color: var(--secondary);
      letter-spacing: 0.2em;
      text-shadow: 0 0 15px var(--secondary-glow);
      padding-left: 0.2em; /* Centers letter-spacing */
    }
    .room-invite-desc {
      font-size: 11px;
      color: var(--on-surface-variant);
      margin-top: 12px;
    }
    .match-info {
      padding: 12px 18px;
      display: flex;
      justify-content: space-around;
      margin-bottom: 24px;
    }
    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }
    .opacity-60 { opacity: 0.6; }
    .info-value {
      font-weight: 700;
      color: var(--primary);
    }

    /* Players list */
    .players-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }
    .player-box {
      flex: 1;
      padding: 16px;
      text-align: center;
      border-color: rgba(255,255,255,0.04);
      background: rgba(255,255,255,0.01);
    }
    .player-box.connected {
      border-color: var(--primary);
      box-shadow: inset 0 0 10px var(--primary-glow);
    }
    .player-box.waiting {
      border-color: var(--outline-variant);
      opacity: 0.5;
    }
    .player-role {
      font-size: 10px;
      color: var(--on-surface-variant);
      margin-bottom: 8px;
    }
    .player-name {
      font-size: 16px;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .player-status {
      font-size: 10px;
      margin-top: 8px;
      color: var(--outline);
    }
    .player-status.connected {
      color: var(--tertiary);
    }
    .vs-divider {
      font-size: 14px;
      font-weight: 700;
      color: var(--secondary);
    }

    .lobby-footer {
      margin-top: 24px;
    }
    .footer-control-box {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .start-btn {
      width: 100%;
      height: 52px;
      font-size: 16px;
      font-weight: 700;
    }
    .footer-hint {
      font-size: 11px;
      color: var(--on-surface-variant);
      margin-top: 8px;
    }

    /* Waiting indicator */
    .waiting-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 14px;
      background: rgba(173, 198, 255, 0.05);
      border-radius: 4px;
      border: 1px dashed var(--primary);
      width: 100%;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: var(--primary);
      border-radius: 50%;
      animation: pulseIndicator 1.5s infinite ease-in-out;
      box-shadow: 0 0 8px var(--primary);
    }
    @keyframes pulseIndicator {
      0%, 100% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.3); opacity: 1; }
    }
  `]
})
export class LobbyComponent implements OnInit, OnDestroy {
  room: any = null;
  role: 'host' | 'guest' | null = null;

  private subs: Subscription[] = [];

  constructor(private socketService: SocketService, private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.room = navigation.extras.state['room'];
      this.role = navigation.extras.state['role'];
    }
  }

  ngOnInit() {
    if (!this.room || !this.role) {
      this.router.navigate(['/selector']);
      return;
    }

    // Connect to listeners
    this.subs.push(
      this.socketService.roomUpdated$.subscribe(room => {
        this.room = room;
      })
    );

    this.subs.push(
      this.socketService.opponentLeft$.subscribe(data => {
        alert(data.message);
        if (this.role === 'guest') {
          // Redirect back to selector if host closed room
          this.router.navigate(['/selector']);
        } else {
          // Opponent left, host stays and awaits another player
          this.room.guest = null;
          this.room.status = 'waiting';
        }
      })
    );

    this.subs.push(
      this.socketService.gameStarted$.subscribe(room => {
        this.router.navigate(['/play'], {
          queryParams: {
            mode: 'pvp',
            roomId: room.id,
            role: this.role,
            rules: room.rules
          },
          state: { room }
        });
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  getRulesLabel(): string {
    if (!this.room) return '';
    switch (this.room.rules) {
      case 'sequence': return 'TÌM SỐ 1 - 100';
      case 'even-odd': return 'CHẴN LẺ';
      case 'assigned': return 'SỐ CHO TRƯỚC';
      default: return 'TIÊU CHUẨN';
    }
  }

  leaveLobby() {
    this.socketService.leaveRoom();
    this.router.navigate(['/selector']);
  }

  startGame() {
    if (this.role === 'host' && this.room.guest) {
      this.socketService.startGame();
    }
  }
}
