/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicAudio: HTMLAudioElement | null = null;
  private isMusicPlaying: boolean = false;
  private musicVolume: number = 0.25;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * GTA V Menu Navigation: A crisp, short, medium-high electronic tick sound.
   */
  playHover() {
    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      return;
    }
    setTimeout(() => {
      try {
        this.initCtx();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now); // classic clean menu bleep (A5)
        osc.frequency.exponentialRampToValueAtTime(1046, now + 0.03); // minor upward bend
        
        gain.gain.setValueAtTime(0.04, now); // perfect volume level
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.04);
      } catch (e) {
        console.warn('Audio context hover failed:', e);
      }
    }, 0);
  }

  /**
   * GTA V Menu Confirmation: Crisp, high-energy dual chimes played in rapid succession.
   */
  playSelect() {
    setTimeout(() => {
      try {
        this.initCtx();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Beep 1
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1200, now);
        gain1.gain.setValueAtTime(0.07, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.06);

        // Beep 2 (Staggered classic double punch)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1500, now + 0.04);
        gain2.gain.setValueAtTime(0.07, now + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.04);
        osc2.stop(now + 0.12);
      } catch (e) {
        console.warn('Audio context select failed:', e);
      }
    }, 0);
  }

  /**
   * GTA V Menu Back / Decline: A lower-pitched digital feedback sound.
   */
  playCancel() {
    setTimeout(() => {
      try {
        this.initCtx();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.1);
      } catch (e) {
        console.warn('Audio context cancel failed:', e);
      }
    }, 0);
  }

  /**
   * PlayFest achievement or successful form registration sound (Ascending retro synth arpeggio).
   */
  playSuccess() {
    setTimeout(() => {
      try {
        this.initCtx();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major Arpeggio (C5 - E5 - G5 - C6)
        
        notes.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.05, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.15);
        });
      } catch (e) {
        console.warn('Audio context success failed:', e);
      }
    }, 0);
  }

  initMusic() {
    if (!this.musicAudio) {
      // High-quality, loopable retro synthesizer instrumental groove 
      this.musicAudio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3');
      this.musicAudio.loop = true;
      this.musicAudio.volume = this.musicVolume;
    }
  }

  toggleMusic(): boolean {
    this.initMusic();
    if (!this.musicAudio) return false;
    
    if (this.isMusicPlaying) {
      this.musicAudio.pause();
      this.isMusicPlaying = false;
    } else {
      this.initCtx();
      const playPromise = this.musicAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isMusicPlaying = true;
        }).catch(err => {
          console.warn("Auto-play blocked by browser. User interaction required:", err);
        });
      }
      this.isMusicPlaying = true;
    }
    return this.isMusicPlaying;
  }

  setVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicAudio) {
      this.musicAudio.volume = this.musicVolume;
    }
  }

  getMusicState() {
    return {
      isPlaying: this.isMusicPlaying,
      volume: this.musicVolume
    };
  }
}

export const sounds = new SoundManager();
