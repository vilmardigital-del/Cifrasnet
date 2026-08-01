import { SoundType } from '../types';

export class MetronomeEngine {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private bpm = 120;
  private beatsPerMeasure = 4;
  private currentBeat = 0;
  private nextNoteTime = 0.0;
  private timerID: number | null = null;
  private lookahead = 25.0; // ms
  private scheduleAheadTime = 0.1; // seconds
  private soundType: SoundType = 'click';
  private accentFirstBeat = true;
  private volume = 0.8;
  private onBeatCallback?: (beatIndex: number, totalBeats: number) => void;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(30, Math.min(280, bpm));
  }

  public setTimeSignature(timeSig: string) {
    const num = parseInt(timeSig.split('/')[0], 10) || 4;
    this.beatsPerMeasure = num;
  }

  public setSoundType(type: SoundType) {
    this.soundType = type;
  }

  public setAccentFirstBeat(accent: boolean) {
    this.accentFirstBeat = accent;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setOnBeatCallback(cb: (beatIndex: number, totalBeats: number) => void) {
    this.onBeatCallback = cb;
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += secondsPerBeat;
    this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
  }

  private playSound(time: number, isAccent: boolean) {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    const masterVol = this.volume;

    if (this.soundType === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isAccent && this.accentFirstBeat ? 1200 : 800, time);
      gainNode.gain.setValueAtTime(masterVol * (isAccent ? 1.0 : 0.6), time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.start(time);
      osc.stop(time + 0.05);
    } else if (this.soundType === 'beep') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(isAccent && this.accentFirstBeat ? 1760 : 880, time);
      gainNode.gain.setValueAtTime(masterVol * 0.3, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.start(time);
      osc.stop(time + 0.08);
    } else if (this.soundType === 'woodblock') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isAccent && this.accentFirstBeat ? 800 : 500, time);
      gainNode.gain.setValueAtTime(masterVol * 0.9, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      osc.start(time);
      osc.stop(time + 0.04);
    } else if (this.soundType === 'cowbell') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isAccent && this.accentFirstBeat ? 1000 : 600, time);
      gainNode.gain.setValueAtTime(masterVol * 0.5, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.start(time);
      osc.stop(time + 0.12);
    }
  }

  private scheduler() {
    if (!this.audioCtx) return;
    while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      const isAccent = this.currentBeat === 0;
      this.playSound(this.nextNoteTime, isAccent);

      if (this.onBeatCallback) {
        // Schedule UI beat notification
        const beatNum = this.currentBeat;
        const beatsTotal = this.beatsPerMeasure;
        const timeDelay = Math.max(0, (this.nextNoteTime - this.audioCtx.currentTime) * 1000);
        setTimeout(() => {
          if (this.isPlaying && this.onBeatCallback) {
            this.onBeatCallback(beatNum, beatsTotal);
          }
        }, timeDelay);
      }

      this.nextNote();
    }
  }

  public start() {
    this.initAudio();
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentBeat = 0;
    if (this.audioCtx) {
      this.nextNoteTime = this.audioCtx.currentTime + 0.05;
    }

    const runLoop = () => {
      if (!this.isPlaying) return;
      this.scheduler();
      this.timerID = window.setTimeout(runLoop, this.lookahead);
    };

    runLoop();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
