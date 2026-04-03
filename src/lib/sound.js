let audioCtx;

export function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function playTone(freq, type, duration, gainVal = 0.3, startTime) {
  try {
    const ac = getAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime || ac.currentTime);
    gain.gain.setValueAtTime(gainVal, startTime || ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, (startTime || ac.currentTime) + duration);
    osc.start(startTime || ac.currentTime);
    osc.stop((startTime || ac.currentTime) + duration);
  } catch (e) {
    // ignore audio errors
  }
}

export function playSound(name) {
  try {
    switch (name) {
      case 'shoot':
        playTone(600, 'square', 0.08, 0.2);
        break;
      case 'alienShoot':
        playTone(200, 'sawtooth', 0.15, 0.15);
        break;
      case 'explosion':
        playTone(100, 'sawtooth', 0.2, 0.3);
        playTone(80, 'square', 0.25, 0.2);
        break;
      case 'ufo':
        playTone(440, 'sawtooth', 0.3, 0.1);
        playTone(220, 'sawtooth', 0.3, 0.1);
        break;
      case 'ufoExplosion':
        playTone(150, 'sawtooth', 0.4, 0.4);
        playTone(75, 'square', 0.5, 0.3);
        break;
      case 'playerDead':
        playTone(400, 'sawtooth', 0.15, 0.3);
        playTone(200, 'square', 0.3, 0.3);
        playTone(100, 'sawtooth', 0.5, 0.3);
        break;
      case 'gameOver':
        for (let i = 0; i < 8; i++) {
          const ac = getAudioCtx();
          playTone(400 - i * 40, 'sawtooth', 0.15, 0.3, ac.currentTime + i * 0.15);
        }
        break;
    }
  } catch (e) {
    // ignore
  }
}

export function closeAudioContext() {
  if (audioCtx) audioCtx.close();
}
