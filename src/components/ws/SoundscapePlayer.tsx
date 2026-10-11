"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause, Trees, Waves, CloudRain, Moon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type SoundPreset = "forest" | "brook" | "rain" | "dusk";

interface PresetConfig {
  id: SoundPreset;
  name: string;
  subtitle: string;
  icon: typeof Trees;
  color: string;
}

export const PRESETS: PresetConfig[] = [
  { id: "forest", name: "Canopy Wind & Birds", subtitle: "Swaying pines and distant morning warblers", icon: Trees, color: "text-moss" },
  { id: "brook", name: "Meadow Brook", subtitle: "Cool mountain stream tumbling over mossy stones", icon: Waves, color: "text-sage" },
  { id: "rain", name: "Gentle Rain", subtitle: "Soft droplets pattering on broad leaves", icon: CloudRain, color: "text-earth" },
  { id: "dusk", name: "Twilight Crickets", subtitle: "Warm dusk breeze with gentle rhythmic pulses", icon: Moon, color: "text-terracotta" },
];

/**
 * Pure offline Web Audio synthesizer for ambient nature soundscapes.
 * Operates without network dependencies or external audio files.
 */
class NatureAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isRunning = false;
  private activePreset: SoundPreset = "forest";
  private birdTimer: number | null = null;
  private cricketTimer: number | null = null;
  private activeSources: (AudioNode | { stop?: () => void })[] = [];

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.05);
    }
  }

  private stopAll() {
    if (this.birdTimer) {
      window.clearInterval(this.birdTimer);
      this.birdTimer = null;
    }
    if (this.cricketTimer) {
      window.clearInterval(this.cricketTimer);
      this.cricketTimer = null;
    }
    for (const s of this.activeSources) {
      try {
        if ("stop" in s && typeof s.stop === "function") s.stop();
        if ("disconnect" in s && typeof s.disconnect === "function") s.disconnect();
      } catch {
        // already disconnected
      }
    }
    this.activeSources = [];
  }

  // Generate pink/brown noise buffer
  private createNoiseBuffer(type: "pink" | "brown" | "white", durationSeconds = 5): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === "white") {
        output[i] = white * 0.15;
      } else if (type === "pink") {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      } else {
        // brown
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.5;
      }
    }
    return buffer;
  }

  // Play a realistic gentle bird chirping sound
  private playBirdChirp() {
    if (!this.ctx || !this.isRunning || this.activePreset !== "forest") return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const startFreq = 2200 + Math.random() * 800;
      const endFreq = startFreq + (Math.random() > 0.5 ? 900 : -500);

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(startFreq + 200, now + 0.22);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Audio node scheduling safe guard
    }
  }

  // Play a cricket pulse
  private playCricketPulse() {
    if (!this.ctx || !this.isRunning || this.activePreset !== "dusk") return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(4500, now);
      filter.Q.setValueAtTime(8, now);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(4600 + Math.random() * 200, now);

      gain.gain.setValueAtTime(0.001, now);
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.04;
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.setValueAtTime(0.001, t + 0.025);
      }

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // ignore
    }
  }

  start(preset: SoundPreset = "forest") {
    this.stopAll();
    const ctx = this.getContext();
    this.activePreset = preset;
    this.isRunning = true;

    if (preset === "forest") {
      // Wind through trees: Brown noise + resonant low-pass filter modulated by LFO
      const noiseBuffer = this.createNoiseBuffer("brown", 6);
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.Q.setValueAtTime(2, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(140, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.65, ctx.currentTime);

      source.connect(filter);
      filter.connect(windGain);
      windGain.connect(this.masterGain!);

      source.start();
      lfo.start();
      this.activeSources.push(source, lfo, filter, windGain, lfoGain);

      // Periodic bird chirps every 3 to 7 seconds
      const scheduleNextChirp = () => {
        if (!this.isRunning || this.activePreset !== "forest") return;
        this.playBirdChirp();
        const nextDelay = 3000 + Math.random() * 4500;
        this.birdTimer = window.setTimeout(scheduleNextChirp, nextDelay);
      };
      this.birdTimer = window.setTimeout(scheduleNextChirp, 1500);
    } else if (preset === "brook") {
      // Babbling brook: Pink noise modulated with mid-band filters
      const noiseBuffer = this.createNoiseBuffer("pink", 5);
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(650, ctx.currentTime);
      bandpass.Q.setValueAtTime(1.8, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.4, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(220, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(bandpass.frequency);

      const brookGain = ctx.createGain();
      brookGain.gain.setValueAtTime(0.8, ctx.currentTime);

      source.connect(bandpass);
      bandpass.connect(brookGain);
      brookGain.connect(this.masterGain!);

      source.start();
      lfo.start();
      this.activeSources.push(source, lfo, bandpass, brookGain, lfoGain);
    } else if (preset === "rain") {
      // Gentle Rain: Pink & white noise mix with gentle high-cut
      const noiseBuffer = this.createNoiseBuffer("pink", 4);
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      const rainGain = ctx.createGain();
      rainGain.gain.setValueAtTime(0.7, ctx.currentTime);

      source.connect(filter);
      filter.connect(rainGain);
      rainGain.connect(this.masterGain!);

      source.start();
      this.activeSources.push(source, filter, rainGain);
    } else if (preset === "dusk") {
      // Dusk breeze with crickets
      const noiseBuffer = this.createNoiseBuffer("brown", 5);
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(220, ctx.currentTime);

      const breezeGain = ctx.createGain();
      breezeGain.gain.setValueAtTime(0.4, ctx.currentTime);

      source.connect(filter);
      filter.connect(breezeGain);
      breezeGain.connect(this.masterGain!);

      source.start();
      this.activeSources.push(source, filter, breezeGain);

      // Crickets cadence
      const scheduleNextCricket = () => {
        if (!this.isRunning || this.activePreset !== "dusk") return;
        this.playCricketPulse();
        const nextDelay = 1100 + Math.random() * 800;
        this.cricketTimer = window.setTimeout(scheduleNextCricket, nextDelay);
      };
      this.cricketTimer = window.setTimeout(scheduleNextCricket, 800);
    }
  }

  stop() {
    this.isRunning = false;
    this.stopAll();
  }
}

// Global singleton instance so soundscape can persist or be accessed from active mission
export const globalSoundEngine = typeof window !== "undefined" ? new NatureAudioEngine() : null;

export function SoundscapePlayer({
  className,
  compact = false,
  autoPlay = false,
  preset: initialPreset = "forest",
}: {
  className?: string;
  compact?: boolean;
  autoPlay?: boolean;
  preset?: SoundPreset;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<SoundPreset>(initialPreset);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    if (autoPlay && globalSoundEngine) {
      globalSoundEngine.start(currentPreset);
      setIsPlaying(true);
    }
    return () => {
      // stop on unmount if requested
    };
  }, [autoPlay, currentPreset]);

  const togglePlay = () => {
    if (!globalSoundEngine) return;
    if (isPlaying) {
      globalSoundEngine.stop();
      setIsPlaying(false);
    } else {
      globalSoundEngine.start(currentPreset);
      globalSoundEngine.setVolume(isMuted ? 0 : volume);
      setIsPlaying(true);
    }
  };

  const handlePresetSelect = (p: SoundPreset) => {
    setCurrentPreset(p);
    setShowPresets(false);
    if (globalSoundEngine && isPlaying) {
      globalSoundEngine.start(p);
    }
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (isMuted) setIsMuted(false);
    if (globalSoundEngine) {
      globalSoundEngine.setVolume(v);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (globalSoundEngine) {
      globalSoundEngine.setVolume(next ? 0 : volume);
    }
  };

  const activeMeta = PRESETS.find((p) => p.id === currentPreset) || PRESETS[0]!;
  const IconComponent = activeMeta.icon;

  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 shadow-sm backdrop-blur-md", className)}>
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause ambient soundscape" : "Play ambient nature soundscape"}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            isPlaying ? "bg-moss text-ivory" : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
        </button>
        <span className="font-display text-sm tracking-wide text-foreground/90">{activeMeta.name}</span>
        <div className="flex items-center gap-1">
          {isPlaying && (
            <span className="flex h-2 w-2 items-center justify-center">
              <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-moss" />
            </span>
          )}
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Switch atmosphere"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-xl border border-border bg-card/95 p-4 shadow-md backdrop-blur-md transition-all", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-secondary", activeMeta.color)}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-lg leading-tight text-foreground">{activeMeta.name}</p>
              {isPlaying && (
                <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-2 py-0.5 text-[10px] font-medium text-moss">
                  <span className="h-1.5 w-1.5 rounded-full bg-moss animate-pulse" />
                  Playing live
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{activeMeta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
          >
            Atmosphere
          </button>
          <button
            onClick={togglePlay}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-95",
              isPlaying ? "bg-moss text-ivory shadow-sm" : "bg-primary text-primary-foreground hover:opacity-90",
            )}
            aria-label={isPlaying ? "Pause audio" : "Play nature sounds"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Preset selection dropdown */}
      {showPresets && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
          {PRESETS.map((p) => {
            const PIcon = p.icon;
            const isSelected = p.id === currentPreset;
            return (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg p-2 text-left text-xs transition-colors",
                  isSelected ? "bg-secondary font-medium text-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                <PIcon className={cn("h-4 w-4", p.color)} />
                <div className="truncate">
                  <p className="truncate">{p.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Volume slider row */}
      <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-2 text-muted-foreground">
        <button onClick={toggleMute} className="p-0.5 hover:text-foreground">
          {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={isMuted ? 0 : volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="h-1.5 w-full cursor-pointer accent-moss bg-secondary rounded-lg appearance-none"
          aria-label="Soundscape volume"
        />
        <span className="text-[11px] tabular-nums">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
      </div>
    </div>
  );
}
