import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private url = 'http://localhost:3000';

  private roomCreatedSource = new Subject<any>();
  private roomUpdatedSource = new Subject<any>();
  private gameStartedSource = new Subject<any>();
  private roomSyncedSource = new Subject<any>();
  private numberLockedSource = new Subject<any>();
  private clickErrorSource = new Subject<any>();
  private timeSyncSource = new Subject<any>();
  private opponentLeftSource = new Subject<any>();
  private gameOverSource = new Subject<any>();
  private joinErrorSource = new Subject<string>();

  roomCreated$ = this.roomCreatedSource.asObservable();
  roomUpdated$ = this.roomUpdatedSource.asObservable();
  gameStarted$ = this.gameStartedSource.asObservable();
  roomSynced$ = this.roomSyncedSource.asObservable();
  numberLocked$ = this.numberLockedSource.asObservable();
  clickError$ = this.clickErrorSource.asObservable();
  timeSync$ = this.timeSyncSource.asObservable();
  opponentLeft$ = this.opponentLeftSource.asObservable();
  gameOver$ = this.gameOverSource.asObservable();
  joinError$ = this.joinErrorSource.asObservable();

  constructor() {}

  connect() {
    if (this.socket && this.socket.connected) return;

    this.socket = io(this.url);

    this.socket.on('connect', () => {
      console.log('🔌 Connected to real-time game server.');
    });

    this.socket.on('roomCreated', (room) => this.roomCreatedSource.next(room));
    this.socket.on('roomUpdated', (room) => this.roomUpdatedSource.next(room));
    this.socket.on('gameStarted', (room) => this.gameStartedSource.next(room));
    this.socket.on('roomSynced', (room) => this.roomSyncedSource.next(room));
    this.socket.on('numberLocked', (data) => this.numberLockedSource.next(data));
    this.socket.on('clickError', (data) => this.clickErrorSource.next(data));
    this.socket.on('timeSync', (data) => this.timeSyncSource.next(data));
    this.socket.on('opponentLeft', (data) => this.opponentLeftSource.next(data));
    this.socket.on('gameOver', (data) => this.gameOverSource.next(data));
    this.socket.on('joinError', (err) => this.joinErrorSource.next(err));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  createRoom(hostName: string, rules: string, difficulty: string) {
    this.connect();
    this.socket?.emit('createRoom', { hostName, rules, difficulty });
  }

  joinRoom(roomId: string, guestName: string) {
    this.connect();
    this.socket?.emit('joinRoom', { roomId, guestName });
  }

  syncRoom(roomId: string, playerName: string) {
    this.connect();
    const payload = { roomId, playerName };
    if (this.socket?.connected) {
      this.socket.emit('syncRoom', payload);
    } else {
      this.socket?.once('connect', () => {
        this.socket?.emit('syncRoom', payload);
      });
    }
  }

  startGame() {
    this.socket?.emit('startGame');
  }

  clickNumber(value: number) {
    this.socket?.emit('clickNumber', { value });
  }

  leaveRoom() {
    this.socket?.emit('leaveRoom');
    this.disconnect();
  }
}
