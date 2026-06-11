import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-container scanline">
      <div class="logo-box">
        <h1 class="logo-text">GAME TÌM SỐ</h1>
        <div class="subtitle">GAME TÌM SỐ • COMPETITIVE ARCADE</div>
      </div>
      
      <div class="loader-box">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progress"></div>
        </div>
        <div class="status-text">{{ statusText }}</div>
      </div>
      
      <div class="version">v1.2 // PVP UPDATE</div>
    </div>
  `,
  styles: [`
    .splash-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100vw;
      background: radial-gradient(circle at center, #111420 0%, #06080e 100%);
      color: #e1e2ec;
      position: relative;
    }
    .logo-box {
      text-align: center;
      margin-bottom: 50px;
      animation: logoFadeIn 1.5s ease-out;
    }
    .logo-text {
      font-size: 56px;
      font-weight: 800;
      font-family: 'Geist', sans-serif;
      letter-spacing: 0.1em;
      color: #adc6ff;
      text-shadow: 0 0 10px rgba(173, 198, 255, 0.5),
                   0 0 30px rgba(173, 198, 255, 0.3),
                   0 0 50px rgba(173, 198, 255, 0.15);
      animation: logoPulse 2.5s infinite alternate ease-in-out;
    }
    .subtitle {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 500;
      color: #ffb2b7;
      letter-spacing: 0.3em;
      margin-top: 10px;
      text-shadow: 0 0 8px rgba(255, 178, 183, 0.4);
    }
    .loader-box {
      width: 300px;
      text-align: center;
    }
    .progress-bar {
      height: 4px;
      width: 100%;
      background: rgba(173, 198, 255, 0.15);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .progress-fill {
      height: 100%;
      background: #adc6ff;
      box-shadow: 0 0 10px #adc6ff;
      transition: width 0.1s linear;
    }
    .status-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #c2c6d6;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .version {
      position: absolute;
      bottom: 24px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: rgba(255,255,255,0.25);
      letter-spacing: 0.2em;
    }
    
    @keyframes logoFadeIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    @keyframes logoPulse {
      from {
        text-shadow: 0 0 10px rgba(173, 198, 255, 0.5), 0 0 20px rgba(173, 198, 255, 0.2);
      }
      to {
        text-shadow: 0 0 20px rgba(173, 198, 255, 0.8), 0 0 40px rgba(173, 198, 255, 0.4), 0 0 60px rgba(173, 198, 255, 0.2);
      }
    }
  `]
})
export class SplashComponent implements OnInit, OnDestroy {
  progress = 0;
  statusText = 'Khởi động hệ thống...';
  private timer: any;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    let elapsed = 0;
    const totalDuration = 5000; // 5 seconds
    const interval = 50; // Update every 50ms

    this.timer = setInterval(() => {
      elapsed += interval;
      this.progress = Math.min((elapsed / totalDuration) * 100, 100);

      // Loading stage texts
      if (elapsed < 1500) {
        this.statusText = 'Đang đồng bộ cơ sở dữ liệu...';
      } else if (elapsed < 3000) {
        this.statusText = 'Đang kiểm tra thông tin định danh...';
      } else if (elapsed < 4200) {
        this.statusText = 'Đăng nhập Guest...';
      } else {
        this.statusText = 'Hoàn tất! Đang kết nối giao diện...';
      }

      if (elapsed >= totalDuration) {
        clearInterval(this.timer);
        this.authenticateAndRedirect();
      }
    }, interval);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private authenticateAndRedirect() {
    this.api.getProfile().subscribe({
      next: () => {
        this.router.navigate(['/menu']);
      },
      error: () => {
        // Safe fallback is handled by the api service itself
        this.router.navigate(['/menu']);
      }
    });
  }
}
