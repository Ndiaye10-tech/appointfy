// Web Audio API Sound Effects Generator
// Conçu pour produire des alertes sonores HYPER PUISSANTES, claires et audibles dans un salon bruyant.

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Crée un compresseur dynamique pour maximiser le volume perçu (LOUDNESS)
 * sans saturation ni grésillement audio.
 */
const createLoudMasterChain = (ctx, userVolume = 1.0) => {
  // Limiteur / Compresseur professionnel
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-15, ctx.currentTime);
  compressor.knee.setValueAtTime(40, ctx.currentTime);
  compressor.ratio.setValueAtTime(14, ctx.currentTime);
  compressor.attack.setValueAtTime(0.002, ctx.currentTime);
  compressor.release.setValueAtTime(0.2, ctx.currentTime);

  // Gain maître poussé au maximum sans écrêtage
  const masterGain = ctx.createGain();
  const safeVolume = Math.min(Math.max(userVolume, 0), 1.0);
  // Multiplicateur pour booster le volume perçu
  masterGain.gain.setValueAtTime(safeVolume * 1.5, ctx.currentTime);

  compressor.connect(masterGain);
  masterGain.connect(ctx.destination);

  return { input: compressor, masterGain };
};

/**
 * SONNERIE 1 : "Carillon Doré Caisse Enregistreuse" (Default - HYPER FORT & VIBRANT)
 * Double carillon éclatant avec résonance harmonique. Impossible à rater.
 */
export const playLoudChime = (volume = 1.0) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const { input } = createLoudMasterChain(ctx, volume);
    const now = ctx.currentTime;

    // Séquence de carillon : 3 accords harmoniques éclatants successifs
    const chords = [
      { time: 0.0, freqs: [880, 1318.5, 1760], duration: 0.45, gain: 0.9 },     // A5 + E6 + A6
      { time: 0.18, freqs: [1046.5, 1567.9, 2093], duration: 0.55, gain: 1.0 }, // C6 + G6 + C7 (Peak)
      { time: 0.42, freqs: [1318.5, 1760, 2637], duration: 0.85, gain: 1.1 }    // E6 + A6 + E7 (Grand finish)
    ];

    chords.forEach(chord => {
      chord.freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Type onde triangulaire + sinus pour clarté cristalline perçante
        osc.type = freq > 1500 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + chord.time);

        const startTime = now + chord.time;
        const endTime = startTime + chord.duration;

        noteGain.gain.setValueAtTime(0.001, startTime);
        noteGain.gain.exponentialRampToValueAtTime(chord.gain, startTime + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(noteGain);
        noteGain.connect(input);

        osc.start(startTime);
        osc.stop(endTime);
      });
    });

  } catch (err) {
    console.warn('Erreur lecture son carillon:', err);
  }
};

/**
 * SONNERIE 2 : "Ding-Dong Salon VIP"
 * Deux cloches profondes et percutantes avec longue réverbération.
 */
export const playDingDong = (volume = 1.0) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const { input } = createLoudMasterChain(ctx, volume);
    const now = ctx.currentTime;

    // DING (Fréquence haute)
    const dingFreqs = [784, 1175, 1568]; // G5, D6, G6
    dingFreqs.forEach(f => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.9, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(g);
      g.connect(input);
      osc.start(now);
      osc.stop(now + 0.65);
    });

    // DONG (Fréquence plus basse et puissante)
    const dongFreqs = [587.3, 880, 1175]; // D5, A5, D6
    dongFreqs.forEach(f => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + 0.35);
      g.gain.setValueAtTime(0.001, now + 0.35);
      g.gain.linearRampToValueAtTime(1.1, now + 0.38);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.connect(g);
      g.connect(input);
      osc.start(now + 0.35);
      osc.stop(now + 1.2);
    });

  } catch (err) {
    console.warn('Erreur lecture son Ding-Dong:', err);
  }
};

/**
 * SONNERIE 3 : "Alerte Punchy Flash"
 * Bips rapides et énergiques pour captiver l'attention immédiatement.
 */
export const playPunchyAlert = (volume = 1.0) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const { input } = createLoudMasterChain(ctx, volume);
    const now = ctx.currentTime;

    [0, 0.12, 0.24, 0.36].forEach((timeOffset, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77 + i * 220, now + timeOffset);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now + timeOffset);

      g.gain.setValueAtTime(0.001, now + timeOffset);
      g.gain.linearRampToValueAtTime(0.85, now + timeOffset + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.09);

      osc.connect(filter);
      filter.connect(g);
      g.connect(input);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.1);
    });

  } catch (err) {
    console.warn('Erreur lecture alerte punchy:', err);
  }
};

/**
 * SONNERIE 4 : "Tiroir-Caisse Enregistreuse Ka-Ching"
 * Bruit mécanique d'ouverture suivi du tintement brillant de pièces dorées.
 */
export const playCashRegister = (volume = 1.0) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const { input } = createLoudMasterChain(ctx, volume);
    const now = ctx.currentTime;

    // 1. "Ka" : Bruit mécanique sec du tiroir
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(320, now);
    snapOsc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

    snapGain.gain.setValueAtTime(0.7, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    snapOsc.connect(snapGain);
    snapGain.connect(input);
    snapOsc.start(now);
    snapOsc.stop(now + 0.06);

    // 2. "Ching" : Cloche argentée éclatante et carillon de pièces (2489Hz + 3135Hz + 4186Hz)
    const chingTime = now + 0.05;
    const freqs = [2489, 3135.9, 4186]; // D#7, G7, C8

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, chingTime);

      gain.gain.setValueAtTime(0.001, chingTime);
      gain.gain.linearRampToValueAtTime(1.0 / (idx + 1), chingTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, chingTime + 0.95);

      osc.connect(gain);
      gain.connect(input);

      osc.start(chingTime);
      osc.stop(chingTime + 0.95);
    });

  } catch (err) {
    console.warn('Erreur lecture son Ka-Ching caisse:', err);
  }
};

/**
 * Joue la sonnerie selon le preset sélectionné
 */
export const playSoundPreset = (preset = 'chime', volume = 1.0) => {
  getAudioContext();

  if (preset === 'cash') {
    playCashRegister(volume);
  } else if (preset === 'dingdong' || preset === 'bell') {
    playDingDong(volume);
  } else if (preset === 'alert' || preset === 'minimal') {
    playPunchyAlert(volume);
  } else {
    playLoudChime(volume);
  }
};

