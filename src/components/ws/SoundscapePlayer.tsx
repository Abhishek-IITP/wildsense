"use client";

import { useEffect, useState } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Trees,
  Waves,
  CloudRain,
  Moon,
  X,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SoundPreset = "forest" | "brook" | "rain" | "dusk";

interface PresetConfig {
  id: SoundPreset;
  name: string;
  tagline: string;
  description: string;
  icon: typeof Trees;
  accent: string;
  pillBorder: string;
}

export const PRESETS: PresetConfig[] = [
  {
    id: "forest",
    name: "Canopy Wind & Birds",
    tagline: "Swaying pines & warblers",
    description: "Deep wind through hemlock boughs with organic distant bird warbles.",
    icon: Trees,
    accent: "text-moss bg-moss/15 border-moss/40",
    pillBorder: "hover:border-moss/50",
  },
  {
    id: "brook",
    name: "Meadow Brook",
    tagline: "Cool mountain stream",
    description: "Gentle bubbling water tumbling across mossy granite stones.",
    icon: Waves,
    accent: "text-sage bg-sage/20 border-sage/40",
    pillBorder: "hover:border-sage/50",
  },
  {
    id: "rain",
    name: "Gentle Rain",
    tagline: "Soft drops on broad leaves",
    description: "Calm, rhythmic rainfall pattering softly on summer canopy foliage.",
    icon: CloudRain,
    accent: "text-earth bg-earth/15 border-earth/40",
    pillBorder: "hover:border-earth/50",
  },
  {
    id: "dusk",
    name: "Twilight Crickets",
    tagline: "Warm evening cadence",
    description: "Dusk breeze with the rhythmic, peaceful hum of field crickets.",
    icon: Moon,
    accent: "text-terracotta bg-terracotta/15 border-terracotta/40",
    pillBorder: "hover:border-terracotta/50",
  },
];

/**
 * Pure offline Web Audio synthesizer for ambient nature soundscapes.
 * Operates with 0 network dependencies or external audio files.
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
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.04);
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
        // disconnected
      }
    }
    this.activeSources = [];
  }

  private createNoiseBuffer(type: "pink" | "brown" | "white", durationSeconds = 5): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === "white") {
        output[i] = white * 0.15;
      } else if (type === "pink") {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      } else {
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.5;
      }
    }
    return buffer;
  }

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
      gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // scheduled safe
    }
  }

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
      // scheduled safe
    }
  }

  start(preset: SoundPreset = "forest") {
    this.stopAll();
    const ctx = this.getContext();
    this.activePreset = preset;
    this.isRunning = true;

    if (preset === "forest") {
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

      const scheduleNextChirp = () => {
        if (!this.isRunning || this.activePreset !== "forest") return;
        this.playBirdChirp();
        const nextDelay = 3000 + Math.random() * 4500;
        this.birdTimer = window.setTimeout(scheduleNextChirp, nextDelay);
      };
      this.birdTimer = window.setTimeout(scheduleNextChirp, 1500);
    } else if (preset === "brook") {
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

export const globalSoundEngine = typeof window !== "undefined" ? new NatureAudioEngine() : null;

// Animated live equalizer wave
function AudioBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-3.5 px-1">
      <span
        className={cn(
          "w-[2.5px] rounded-full bg-moss transition-all duration-300",
          isPlaying ? "h-3 animate-[pulse_0.7s_ease-in-out_infinite]" : "h-1 opacity-40",
        )}
      />
      <span
        className={cn(
          "w-[2.5px] rounded-full bg-moss transition-all duration-300",
          isPlaying ? "h-4 animate-[pulse_0.9s_ease-in-out_infinite_0.15s]" : "h-1.5 opacity-40",
        )}
      />
      <span
        className={cn(
          "w-[2.5px] rounded-full bg-moss transition-all duration-300",
          isPlaying ? "h-2.5 animate-[pulse_0.6s_ease-in-out_infinite_0.3s]" : "h-1 opacity-40",
        )}
      />
      <span
        className={cn(
          "w-[2.5px] rounded-full bg-moss transition-all duration-300",
          isPlaying ? "h-3.5 animate-[pulse_0.8s_ease-in-out_infinite_0.2s]" : "h-1.5 opacity-40",
        )}
      />
    </div>
  );
}

export function SoundscapePlayer({
  className,
  compact = false,
  autoPlay = false,
  preset: initialPreset = "forest",
  onClose,
}: {
  className?: string;
  compact?: boolean;
  autoPlay?: boolean;
  preset?: SoundPreset;
  onClose?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<SoundPreset>(initialPreset);
  const [volume, setVolume] = useState(0.65);
  const [isMuted, setIsMuted] = useState(false);
  const [showPresetsCompact, setShowPresetsCompact] = useState(false);

  useEffect(() => {
    if (autoPlay && globalSoundEngine) {
      globalSoundEngine.start(currentPreset);
      setIsPlaying(true);
    }
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
    setShowPresetsCompact(false);
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
  const ActiveIcon = activeMeta.icon;

  // Compact mode: used inside active mission timer
  if (compact) {
    return (
      <div className={cn("relative inline-flex flex-col items-center", className)}>
        <div className="flex items-center gap-2.5 rounded-full border border-scene-foreground/20 bg-scene-foreground/10 px-3.5 py-1.5 shadow-sm backdrop-blur-md text-scene-foreground transition-colors hover:bg-scene-foreground/15">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause ambient soundscape" : "Play ambient nature soundscape"}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-95 shadow-xs",
              isPlaying
                ? "bg-sage text-scene shadow-sage/30"
                : "bg-scene-foreground/20 text-scene-foreground hover:bg-scene-foreground/30",
            )}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
          </button>

          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setShowPresetsCompact(!showPresetsCompact)}>
            <ActiveIcon className="h-4 w-4 text-sage" />
            <span className="font-display text-sm tracking-wide">{activeMeta.name}</span>
            <AudioBars isPlaying={isPlaying} />
          </div>

          <button
            onClick={() => setShowPresetsCompact(!showPresetsCompact)}
            className="rounded-full bg-scene-foreground/10 px-2 py-0.5 text-[11px] font-sans opacity-80 hover:opacity-100 transition-opacity"
          >
            Change
          </button>
        </div>

        {/* Compact Preset Picker Dropdown */}
        {showPresetsCompact && (
          <div className="absolute top-11 z-50 w-72 rounded-xl border border-scene-foreground/20 bg-scene/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-scene-foreground/10">
              <span className="eyebrow text-[10px] text-sage opacity-80">Atmosphere</span>
              <button onClick={() => setShowPresetsCompact(false)} className="text-scene-foreground/60 hover:text-scene-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {PRESETS.map((p) => {
                const PIcon = p.icon;
                const isSelected = p.id === currentPreset;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePresetSelect(p.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                      isSelected
                        ? "bg-scene-foreground/20 font-medium text-scene-foreground shadow-xs"
                        : "text-scene-foreground/70 hover:bg-scene-foreground/10 hover:text-scene-foreground",
                    )}
                  >
                    <PIcon className="h-4 w-4 text-sage shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm leading-tight">{p.name}</p>
                      <p className="truncate text-[10px] opacity-60">{p.tagline}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full Premium Soundscape Popover Card
  return (
    <div
      className={cn(
        "w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border/80 bg-card/95 text-foreground shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition-all overflow-hidden",
        className,
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-secondary/30">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-moss/20 text-moss">
            <Headphones className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="eyebrow text-[10px] text-moss font-semibold block leading-none">
              Soundscape · Offline
            </span>
            <span className="font-display text-xs text-muted-foreground">Synthesized Ambience</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <AudioBars isPlaying={isPlaying} />
          {onClose && (
            <button
              onClick={onClose}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Close soundscape player"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main active atmosphere hero */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/40 p-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-xs transition-colors", activeMeta.accent)}>
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-display text-lg leading-tight truncate text-foreground">{activeMeta.name}</h4>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{activeMeta.tagline}</p>
            </div>
          </div>

          <button
            onClick={togglePlay}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 shadow-md",
              isPlaying
                ? "bg-moss text-ivory ring-4 ring-moss/20"
                : "bg-primary text-primary-foreground hover:opacity-90",
            )}
            aria-label={isPlaying ? "Pause ambient soundscape" : "Play ambient soundscape"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>
        </div>

        {/* Atmosphere description quote */}
        <p className="mt-2.5 px-1 font-hand text-sm text-muted-foreground italic leading-snug">
          "{activeMeta.description}"
        </p>

        {/* Atmosphere Presets grid */}
        <div className="mt-4">
          <p className="eyebrow text-[10px] text-muted-foreground mb-2 px-1">Atmospheres</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => {
              const PIcon = p.icon;
              const isSelected = p.id === currentPreset;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all",
                    isSelected
                      ? "border-moss bg-moss/10 shadow-xs"
                      : "border-border/60 bg-card/60 hover:border-border hover:bg-secondary/50",
                  )}
                >
                  <PIcon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isSelected ? "text-moss" : "text-muted-foreground",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-xs leading-tight font-display",
                        isSelected ? "text-foreground font-semibold" : "text-foreground/80",
                      )}
                    >
                      {p.name}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">{p.tagline}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Volume & Mixer row */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/30 px-3 py-2 text-muted-foreground">
          <button
            onClick={toggleMute}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-secondary hover:text-foreground transition-colors shrink-0"
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer accent-moss bg-secondary-foreground/20 rounded-lg appearance-none"
            aria-label="Soundscape volume slider"
          />

          <span className="text-[11px] tabular-nums font-mono text-muted-foreground/80 w-8 text-right shrink-0">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
