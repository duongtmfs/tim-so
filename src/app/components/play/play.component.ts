import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService, GamerProfile } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { SoundService } from '../../services/sound.service';

interface CanvasNumber {
  value: number;
  col: number;
  row: number;
  offsetX: number;
  offsetY: number;
  x?: number; // Calculated pixel X
  y?: number; // Calculated pixel Y
  lockedBy: 'host' | 'guest' | null;
}

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="play-container scanline">
      <!-- HUD Top Bar -->
      <div class="hud-bar glass-panel">
        <div class="hud-section">
          <span class="label-mono opacity-60">QUY TẮC:</span>
          <span class="hud-value">{{ getRulesLabel() }}</span>
        </div>
        
        <div class="hud-section timer-section" [class.warning]="timeRemaining < 30">
          <span class="label-mono opacity-60">THỜI GIAN:</span>
          <span class="hud-value font-mono stats-xl">{{ formatTime(timeRemaining) }}</span>
        </div>

        <div class="hud-section">
          <span class="label-mono opacity-60">HÌNH THỨC:</span>
          <span class="hud-value">{{ isPvP ? 'ĐỐI KHÁNG (PVP)' : 'CHƠI ĐƠN' }}</span>
        </div>
      </div>

      <!-- Main Game Arena -->
      <div class="arena-layout">
        <!-- Sidebar stats / targets -->
        <div class="side-panel">
          <div class="target-card sticky-note">
            <div class="label-mono opacity-60 text-center">MỤC TIÊU HIỆN TẠI</div>
            <div class="target-display font-marker" *ngIf="rules === 'sequence'">
              Tìm số: <span class="highlight-target text-5xl">{{ nextTarget }}</span>
            </div>
            <div class="target-display font-marker" *ngIf="rules === 'assigned'">
              Tìm số: <span class="highlight-target text-5xl">{{ targetNumber }}</span>
            </div>
            <div class="target-display font-marker" *ngIf="rules === 'even-odd'">
              Tìm số: <span class="highlight-target text-4xl">{{ targetIsEven ? 'CHẴN' : 'LẺ' }}</span>
            </div>
          </div>

          <div class="score-card glass-panel">
            <div class="label-mono opacity-60 mb-2">ĐIỂM SỐ</div>
            <div class="scores-box font-mono">
              <div class="score-row-display" [class.user-score]="isPvP">
                <span class="player-tag">{{ isPvP ? (role === 'host' ? 'Ta (Host)' : 'Ta (Guest)') : 'Điểm' }}:</span>
                <span class="score-num text-3xl">{{ player1Score }}</span>
              </div>
              <div class="score-row-display opponent-score" *ngIf="isPvP">
                <span class="player-tag">{{ role === 'host' ? 'Guest' : 'Host' }}:</span>
                <span class="score-num text-3xl">{{ player2Score }}</span>
              </div>
            </div>
          </div>

          <button class="btn btn-ghost-primary w-full mb-3" (click)="triggerHint()" [disabled]="isPvP || hintsLeft <= 0">
            💡 GỢI Ý (CÒN {{ hintsLeft }})
          </button>

          <button class="btn btn-ghost-secondary w-full" (click)="quitGame()">
            🚪 THOÁT TRẬN
          </button>
        </div>

        <!-- Canvas Area -->
        <div class="canvas-wrapper" [class.pvp-frozen]="freezeClicks">
          <canvas 
            #gameCanvas 
            width="650" 
            height="650" 
            (mousedown)="handleCanvasClick($event)"
          ></canvas>

          <!-- Input Freeze Overlay (PvP Penalty) -->
          <div class="freeze-overlay" *ngIf="freezeClicks">
            <div class="freeze-box glass-panel glow-secondary scribble-anim">
              <div class="freeze-icon">🚨</div>
              <div class="font-marker text-3xl text-red-600 font-bold mb-2">PHẠT PHÒNG BỊ KHÓA!</div>
              <div class="label-mono text-slate-500">Đóng băng tương tác 2 giây</div>
            </div>
          </div>
        </div>
      </div>

      <!-- End Game Modal Overlay -->
      <div class="modal-overlay" *ngIf="showEndGameModal">
        <div class="modal-content glass-panel" [class.glow-primary]="gameResult === 'win' || gameResult === 'draw'" [class.glow-secondary]="gameResult === 'lose'">
          <h2 class="modal-title font-marker text-5xl tracking-widest text-center mb-6">
            {{ getEndGameTitle() }}
          </h2>
          
          <div class="results-card glass-panel p-4 mb-6 text-center">
            <div class="font-marker text-2xl mb-4">THỐNG KÊ CHI TIẾT</div>
            
            <div class="result-details space-y-2">
              <div class="detail-row flex justify-between border-b border-dashed border-slate-300 pb-2">
                <span>Số ô chiếm đóng:</span>
                <span class="font-mono font-bold">{{ player1Score / 10 }} / 100</span>
              </div>
              <div class="detail-row flex justify-between border-b border-dashed border-slate-300 pb-2" *ngIf="isPvP">
                <span>Điểm đối thủ:</span>
                <span class="font-mono font-bold">{{ player2Score }}</span>
              </div>
              <div class="detail-row flex justify-between border-b border-dashed border-slate-300 pb-2" *ngIf="!isPvP && gameResult === 'win'">
                <span>Thưởng thời gian:</span>
                <span class="font-mono font-bold text-green-600">+{{ timeRemaining }}đ</span>
              </div>
              <div class="detail-row flex justify-between border-b border-dashed border-slate-300 pb-2" *ngIf="!isPvP">
                <span>Điểm phạt độ khó:</span>
                <span class="font-mono font-bold text-red-600">-{{ getDifficultyPenalty() }}đ</span>
              </div>
              <div class="detail-row flex justify-between text-2xl font-bold pt-2">
                <span>TỔNG ĐIỂM:</span>
                <span class="font-marker underline decoration-2">{{ finalScore }}</span>
              </div>
            </div>
            
            <!-- Stamp doodle for victory -->
            <div class="victory-stamp" *ngIf="gameResult === 'win'">
              ĐỈNH CHÓP
            </div>
          </div>

          <div class="modal-footer flex gap-3 w-full">
            <button class="btn btn-ghost-primary flex-1" (click)="goToMenu()">MENU CHÍNH</button>
            <button class="btn btn-primary flex-1" (click)="restartMatch()">CHƠI LẠI</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .play-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 100vh;
      background: radial-gradient(circle at center, #fdfbf7 0%, #f1f5f9 100%);
      padding: 24px;
    }

    /* HUD Bar */
    .hud-bar {
      width: 100%;
      max-width: 900px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 12px 24px;
      margin-bottom: 24px;
      z-index: 10;
    }
    .hud-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hud-value {
      font-weight: 700;
      color: var(--ink-dark);
      font-size: 16px;
    }
    .timer-section.warning .hud-value {
      color: #be123c;
      text-shadow: 0 0 10px rgba(251, 113, 133, 0.4);
      animation: alertBlink 1s infinite alternate;
    }
    @keyframes alertBlink {
      from { opacity: 0.6; }
      to { opacity: 1; }
    }

    /* Arena Layout */
    .arena-layout {
      width: 100%;
      max-width: 900px;
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 24px;
      align-items: start;
    }

    /* Sidebar stats */
    .side-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .target-card {
      padding: 20px 16px;
      text-align: center;
    }
    .target-display {
      font-size: 22px;
      font-weight: 700;
      margin-top: 10px;
      color: var(--ink-dark);
    }
    .highlight-target {
      color: #1d4ed8;
      text-decoration: underline;
      display: inline-block;
    }
    .score-card {
      padding: 16px;
    }
    .scores-box {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .score-row-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 15px;
    }
    .user-score {
      color: #1d4ed8;
    }
    .opponent-score {
      color: #be123c;
    }
    .w-full { width: 100%; }

    /* Canvas Area */
    .canvas-wrapper {
      padding: 0;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      max-width: 650px;
      margin: 0 auto;
      aspect-ratio: 1/1;
      border: none;
      box-shadow: none;
    }
    canvas {
      width: 100%;
      height: 100%;
      cursor: crosshair;
      background-color: transparent;
    }

    /* PvP Click Freeze Overlay */
    .freeze-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(253, 251, 247, 0.7);
      backdrop-filter: blur(4px);
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .freeze-box {
      padding: 24px;
      text-align: center;
      background: white;
      max-width: 320px;
    }
    .freeze-icon {
      font-size: 44px;
      margin-bottom: 12px;
      animation: freezeBounce 0.5s infinite alternate ease-in-out;
    }
    @keyframes freezeBounce {
      from { transform: translateY(-4px); }
      to { transform: translateY(4px); }
    }

    /* End Game Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(5, 7, 12, 0.75);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
    }
    .modal-content {
      width: 90%;
      max-width: 420px;
      padding: 32px 24px;
      background: white;
      position: relative;
    }
    .modal-title {
      font-size: 36px;
      font-weight: 800;
      color: var(--ink-dark);
    }
    .results-card {
      position: relative;
    }
    .victory-stamp {
      position: absolute;
      right: -8px;
      bottom: -8px;
      width: 90px;
      height: 90px;
      border: 4px solid #dc2626;
      border-radius: 50%;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-marker);
      font-weight: 700;
      font-size: 18px;
      transform: rotate(12deg);
      opacity: 0.8;
      pointer-events: none;
      animation: stampAppear 0.5s ease-out;
    }
    @keyframes stampAppear {
      from { transform: scale(1.8) rotate(30deg); opacity: 0; }
      to { transform: scale(1) rotate(12deg); opacity: 0.8; }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .arena-layout {
        grid-template-columns: 1fr;
      }
      .side-panel {
        order: 2;
        margin-top: 16px;
      }
    }
  `]
})
export class PlayComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  profile: GamerProfile | null = null;

  // Setup params
  rules = 'sequence'; // sequence, even-odd, assigned
  isPvP = false;
  role: 'host' | 'guest' | null = null;
  roomId = '';

  // Gameplay State
  timeRemaining = 240; // Default countdown
  player1Score = 0; // Host or Solo user score
  player2Score = 0; // Guest score
  nextTarget = 1; // target for sequence
  targetNumber = 0; // target for assigned
  targetIsEven = true; // target for odd/even
  numbers: CanvasNumber[] = [];
  hintsLeft = 3;
  hintingValue: number | null = null;
  hintTimer: any = null;

  // PvP Click Freeze
  freezeClicks = false;
  freezeTimer: any = null;

  // Game over state
  showEndGameModal = false;
  gameResult: 'win' | 'lose' | 'draw' = 'win';
  finalScore = 0;

  // Visual options
  private cellRadius = 18;
  private canvasSize = 650;

  private timerInterval: any = null;
  private subs: Subscription[] = [];
  private initialRoom: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private socketService: SocketService,
    private soundService: SoundService
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.initialRoom = navigation?.extras?.state?.['room'] ?? null;
  }

  ngOnInit() {
    // Query parameters setup
    const query = this.route.snapshot.queryParams;
    this.rules = query['rules'] || 'sequence';
    this.isPvP = query['mode'] === 'pvp';
    
    if (this.isPvP) {
      this.role = query['role'] as 'host' | 'guest';
      this.roomId = query['roomId'];

      this.socketService.connect();
      this.setupSocketListeners();

      if (this.initialRoom) {
        this.roomStateSync(this.initialRoom);
      }
      this.requestRoomSync();
    } else {
      // Solo Mode Game Initialization
      this.setupSoloGame(query['difficulty'] || 'medium');
    }

    // Read local gamer profile and trigger sync if PvP
    this.api.getProfile().subscribe(profile => {
      this.profile = profile;
      if (this.isPvP) {
        this.socketService.syncRoom(this.roomId, profile.gamerTag);
      }
    });
  }

  ngAfterViewInit() {
    this.drawBoard();
  }

  ngOnDestroy() {
    this.cleanupTimers();
    this.subs.forEach(s => s.unsubscribe());
    if (this.isPvP) {
      this.socketService.disconnect();
    }
  }

  private setupSocketListeners() {
    // Initial request for current room state if needed, or wait for startGame/sync events
    this.subs.push(
      this.socketService.gameStarted$.subscribe(room => {
        this.roomStateSync(room);
      })
    );

    this.subs.push(
      this.socketService.roomSynced$.subscribe(room => {
        this.roomStateSync(room);
      })
    );

    this.subs.push(
      this.socketService.timeSync$.subscribe(data => {
        this.timeRemaining = data.timeRemaining;
        this.drawBoard();
      })
    );

    this.subs.push(
      this.socketService.numberLocked$.subscribe(data => {
        // Find number and lock it
        const num = this.numbers.find(n => n.value === data.value);
        if (num) {
          num.lockedBy = data.lockedBy;
          
          // Play sound
          if (data.lockedBy === this.role) {
            this.soundService.playSuccess();
          }
        }
        
        // Sync targets
        this.nextTarget = data.nextTarget;
        this.targetNumber = data.targetNumber;
        this.targetIsEven = data.targetIsEven;
        
        // Sync scores
        if (this.role === 'host') {
          this.player1Score = data.hostScore;
          this.player2Score = data.guestScore;
        } else {
          this.player1Score = data.guestScore;
          this.player2Score = data.hostScore;
        }
        
        this.drawBoard();
      })
    );

    this.subs.push(
      this.socketService.clickError$.subscribe(() => {
        // Player clicked wrong target, apply 2s freeze penalty
        this.soundService.playError();
        this.applyPvPClickFreeze();
      })
    );

    this.subs.push(
      this.socketService.opponentLeft$.subscribe(data => {
        alert(data.message);
        this.goToMenu();
      })
    );

    this.subs.push(
      this.socketService.gameOver$.subscribe(data => {
        this.cleanupTimers();
        
        // Calculate final score
        this.player1Score = this.role === 'host' ? data.hostScore : data.guestScore;
        this.player2Score = this.role === 'host' ? data.guestScore : data.hostScore;
        this.finalScore = this.player1Score * 10;
        
        if (data.winner === 'draw') {
          this.gameResult = 'draw';
        } else if (data.winner === this.role) {
          this.gameResult = 'win';
        } else {
          this.gameResult = 'lose';
        }
        
        this.showEndGameModal = true;
      })
    );

  }

  private getLocalGamerTag(): string {
    try {
      const stored = localStorage.getItem('gamer_profile');
      return stored ? JSON.parse(stored).gamerTag : '';
    } catch {
      return '';
    }
  }

  private requestRoomSync() {
    if (!this.isPvP || !this.roomId) return;
    const playerName = this.profile?.gamerTag || this.getLocalGamerTag();
    this.socketService.syncRoom(this.roomId, playerName);
  }

  private mapRoomNumbers(numbers: any[]): CanvasNumber[] {
    const cellWidth = this.canvasSize / 10;
    const cellHeight = this.canvasSize / 10;

    return numbers.map((n: any, index: number) => {
      const col = n.col ?? index % 10;
      const row = n.row ?? Math.floor(index / 10);
      const offsetX = n.offsetX ?? 0;
      const offsetY = n.offsetY ?? 0;

      return {
        ...n,
        col,
        row,
        offsetX,
        offsetY,
        x: (col + 0.5) * cellWidth + offsetX * cellWidth,
        y: (row + 0.5) * cellHeight + offsetY * cellHeight
      };
    });
  }

  private scheduleDrawBoard() {
    setTimeout(() => this.drawBoard(), 0);
  }

  private roomStateSync(room: any) {
    if (!room) return;

    this.rules = room.rules ?? this.rules;
    this.nextTarget = room.nextTarget ?? this.nextTarget;
    this.targetNumber = room.targetNumber ?? this.targetNumber;
    this.targetIsEven = room.targetIsEven ?? this.targetIsEven;
    this.timeRemaining = room.timeRemaining ?? this.timeRemaining;

    if (!Array.isArray(room.numbers) || room.numbers.length === 0) {
      this.requestRoomSync();
      return;
    }

    this.numbers = this.mapRoomNumbers(room.numbers);

    if (room.host) {
      if (this.role === 'host') {
        this.player1Score = room.host.score ?? 0;
        this.player2Score = room.guest?.score ?? 0;
      } else {
        this.player1Score = room.guest?.score ?? 0;
        this.player2Score = room.host.score ?? 0;
      }
    }

    this.scheduleDrawBoard();
  }

  private setupSoloGame(difficulty: string) {
    this.isPvP = false;
    this.player1Score = 0;
    this.hintsLeft = 3;
    this.nextTarget = 1;

    // Set countdown timer
    switch (difficulty) {
      case 'easy':
        this.timeRemaining = 300; // 5 mins
        break;
      case 'hard':
        this.timeRemaining = 180; // 3 mins
        break;
      case 'medium':
      default:
        this.timeRemaining = 240; // 4 mins
        break;
    }

    // Generate local numbers grid
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    // Shuffle values
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    const cellWidth = this.canvasSize / 10;
    const cellHeight = this.canvasSize / 10;

    this.numbers = [];
    for (let i = 0; i < 100; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const offsetX = Math.random() * 0.4 - 0.2; // +/- 20%
      const offsetY = Math.random() * 0.4 - 0.2;
      
      const x = (col + 0.5) * cellWidth + offsetX * cellWidth;
      const y = (row + 0.5) * cellHeight + offsetY * cellHeight;

      this.numbers.push({
        value: values[i],
        col,
        row,
        offsetX,
        offsetY,
        x,
        y,
        lockedBy: null
      });
    }

    // Set rule targets
    if (this.rules === 'assigned') {
      this.targetNumber = this.numbers[Math.floor(Math.random() * 100)].value;
    } else if (this.rules === 'even-odd') {
      this.targetIsEven = Math.random() < 0.5;
    }

    // Start local timer loop
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.drawBoard();
      
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.endSoloGame(false); // Game Over Lose
      }
    }, 1000);
  }

  private applyPvPClickFreeze() {
    this.freezeClicks = true;
    if (this.freezeTimer) clearTimeout(this.freezeTimer);
    
    this.freezeTimer = setTimeout(() => {
      this.freezeClicks = false;
      this.drawBoard();
    }, 2000);
  }

  // Canvas Drawing Engine
  private drawBoard() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pass 1: hints + number text
    this.numbers.forEach((num) => {
      const x = num.x || 0;
      const y = num.y || 0;

      if (!this.isPvP && num.value === this.hintingValue) {
        ctx.save();
        const pulseRatio = 1 + Math.sin(Date.now() / 150) * 0.15;
        ctx.fillStyle = 'rgba(253, 224, 71, 0.75)';
        ctx.beginPath();
        ctx.arc(x, y - 4, (this.cellRadius + 3) * pulseRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.font = '700 20px "Architects Daughter", cursive';
      ctx.fillStyle = num.lockedBy ? '#94a3b8' : '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.value.toString(), x, y);
      ctx.restore();
    });

    // Pass 2: lock circles on top so later numbers don't cover them
    this.numbers.forEach((num) => {
      if (!num.lockedBy) return;
      this.drawLockCircle(ctx, num.x || 0, num.y || 0, num.value, num.lockedBy);
    });
  }

  private drawLockCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    value: number,
    lockedBy: 'host' | 'guest'
  ) {
    ctx.save();
    ctx.strokeStyle = lockedBy === 'guest' ? '#dc2626' : '#2563eb';
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    const rx = this.cellRadius + 3;
    const ry = this.cellRadius + 1;
    const angle = -0.15 + (value % 10) * 0.03;

    for (let t = 0; t < Math.PI * 2.15; t += 0.1) {
      const dx = Math.cos(t) * rx;
      const dy = Math.sin(t) * ry;
      const rx_rot = dx * Math.cos(angle) - dy * Math.sin(angle);
      const ry_rot = dx * Math.sin(angle) + dy * Math.cos(angle);
      const px = x + rx_rot + Math.sin(t * 4) * 0.4;
      const py = y + ry_rot + Math.cos(t * 4) * 0.4 - 4;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    const rx2 = rx - 1;
    const ry2 = ry - 1;
    for (let t = 0; t < Math.PI * 2.25; t += 0.1) {
      const dx = Math.cos(t) * rx2;
      const dy = Math.sin(t) * ry2;
      const rx_rot = dx * Math.cos(angle + 0.1) - dy * Math.sin(angle + 0.1);
      const ry_rot = dx * Math.sin(angle + 0.1) + dy * Math.cos(angle + 0.1);
      const px = x + rx_rot + 0.6 + Math.sin(t * 3) * 0.3;
      const py = y + ry_rot + 0.3 + Math.cos(t * 3) * 0.3 - 4;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Canvas Click Coordinate Mapping & Handler
  handleCanvasClick(event: MouseEvent) {
    if (this.freezeClicks || this.showEndGameModal) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // Convert screen coordinates to canvas coordinate space
    const clickX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((event.clientY - rect.top) / rect.height) * canvas.height;

    // Check hit index
    const hit = this.numbers.find(num => {
      const dx = (num.x || 0) - clickX;
      const dy = (num.y || 0) - clickY;
      return Math.hypot(dx, dy) <= this.cellRadius + 6;
    });

    if (!hit || hit.lockedBy) return;

    if (this.isPvP) {
      // PvP Event delegation to Socket.io Server
      this.socketService.clickNumber(hit.value);
    } else {
      // Solo Mode Game Logic
      this.handleSoloClick(hit);
    }
  }

  private handleSoloClick(num: CanvasNumber) {
    let correct = false;

    if (this.rules === 'sequence') {
      if (num.value === this.nextTarget) {
        correct = true;
        num.lockedBy = 'host'; // Circle with host color (Blue)
        this.nextTarget++;
        this.player1Score += 10;
        
        if (this.nextTarget > 100) {
          this.endSoloGame(true); // Game Win
        }
      }
    } else if (this.rules === 'assigned') {
      if (num.value === this.targetNumber) {
        correct = true;
        num.lockedBy = 'host';
        this.player1Score += 10;

        // Pick new target number
        const unlocked = this.numbers.filter(n => !n.lockedBy);
        if (unlocked.length > 0) {
          this.targetNumber = unlocked[Math.floor(Math.random() * unlocked.length)].value;
        } else {
          this.endSoloGame(true); // All finished
        }
      }
    } else if (this.rules === 'even-odd') {
      const isEven = num.value % 2 === 0;
      if (isEven === this.targetIsEven) {
        correct = true;
        num.lockedBy = 'host';
        this.player1Score += 10;
        
        // Toggle target prompt
        this.targetIsEven = !this.targetIsEven;
        
        // Check if all of that type are checked, or all 100
        const allLocked = this.numbers.every(n => n.lockedBy !== null);
        if (allLocked) {
          this.endSoloGame(true);
        }
      }
    }

    if (correct) {
      this.soundService.playSuccess();
      this.clearHint();
    } else {
      this.soundService.playError();
      // Penalty: Subtract 5 seconds in Solo
      this.timeRemaining = Math.max(0, this.timeRemaining - 5);
      if (this.timeRemaining === 0) {
        this.endSoloGame(false);
      }
    }
    
    this.drawBoard();
  }

  // Hint highlight helper
  triggerHint() {
    if (this.isPvP || this.hintsLeft <= 0) return;

    this.hintsLeft--;
    this.clearHint();

    let targetVal = 0;
    if (this.rules === 'sequence') targetVal = this.nextTarget;
    else if (this.rules === 'assigned') targetVal = this.targetNumber;
    else if (this.rules === 'even-odd') {
      // Find the first unlocked even/odd number
      const match = this.numbers.find(n => !n.lockedBy && (n.value % 2 === 0) === this.targetIsEven);
      if (match) targetVal = match.value;
    }

    this.hintingValue = targetVal;
    this.drawBoard();

    // Redraw board dynamically to simulate pulsing
    let ticks = 0;
    this.hintTimer = setInterval(() => {
      this.drawBoard();
      ticks++;
      if (ticks >= 40) { // Keep flashing for 2 seconds (40 * 50ms)
        this.clearHint();
        this.drawBoard();
      }
    }, 50);
  }

  private clearHint() {
    this.hintingValue = null;
    if (this.hintTimer) {
      clearInterval(this.hintTimer);
      this.hintTimer = null;
    }
  }

  private endSoloGame(won: boolean) {
    this.cleanupTimers();
    this.gameResult = won ? 'win' : 'lose';
    
    // Calculate final score
    if (won) {
      const difficultyPenalty = this.getDifficultyPenalty();
      this.finalScore = Math.max(0, this.player1Score + this.timeRemaining - difficultyPenalty);
      
      // Submit score to Leaderboard
      if (this.profile) {
        this.api.submitScore(this.profile.gamerTag, this.finalScore, this.rules).subscribe({
          next: () => {
            // Trigger profile XP awards reload
            this.api.getProfile().subscribe(profile => {
              this.profile = profile;
            });
          }
        });
      }
    } else {
      this.finalScore = this.player1Score;
    }

    this.showEndGameModal = true;
    this.drawBoard();
  }

  // Button HUD commands
  quitGame() {
    if (confirm('Bạn có chắc muốn rời trận đấu? Điểm số hiện tại sẽ không được ghi nhận.')) {
      if (this.isPvP) {
        this.socketService.leaveRoom();
      }
      this.goToMenu();
    }
  }

  goToMenu() {
    this.router.navigate(['/menu']);
  }

  restartMatch() {
    this.showEndGameModal = false;
    this.cleanupTimers();

    if (this.isPvP) {
      // Return to Lobby so Host can start again
      this.router.navigate(['/lobby'], { state: { room: { id: this.roomId, host: { name: this.profile?.gamerTag } }, role: this.role } });
    } else {
      const query = this.route.snapshot.queryParams;
      this.setupSoloGame(query['difficulty'] || 'medium');
      setTimeout(() => this.drawBoard(), 50);
    }
  }

  // Helpers
  formatTime(totalSeconds: number): string {
    const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const sec = (totalSeconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  getRulesLabel(): string {
    switch (this.rules) {
      case 'sequence': return 'TÌM SỐ 1 - 100';
      case 'even-odd': return 'CHẴN LẺ';
      case 'assigned': return 'SỐ CHO TRƯỚC';
      default: return 'BÀI TẬP';
    }
  }

  getEndGameTitle(): string {
    if (this.isPvP) {
      if (this.gameResult === 'win') return 'CHIẾN THẮNG!';
      if (this.gameResult === 'lose') return 'BẠN ĐÃ THUA!';
      return 'TRẬN HÒA!';
    } else {
      return this.gameResult === 'win' ? 'CHIẾN THẮNG!' : 'BẠN ĐÃ THUA!';
    }
  }

  getDifficultyPenalty(): number {
    const diff = this.route.snapshot.queryParams['difficulty'] || 'medium';
    if (diff === 'easy') return 120;
    if (diff === 'medium') return 60;
    return 0; // Hard
  }

  private cleanupTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.clearHint();
    if (this.freezeTimer) {
      clearTimeout(this.freezeTimer);
      this.freezeTimer = null;
    }
  }

  // Handle browser back button or page unload during play
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.isPvP && !this.showEndGameModal) {
      $event.returnValue = true;
    }
  }
}
