        (function() {
            // Audio context (must be created after user interaction)
            let audioContext = null;

            // sound library (using generated oscillators / noise for demo)
            // In a real app, you'd use audio files, but for demo we create synthetic sounds
            const sounds = [
                { id: 'rain', name: 'Rain', icon: '☔', type: 'noise', color: '#4a7a9c' },
                { id: 'waves', name: 'Waves', icon: '🌊', type: 'waves', color: '#2a6b8f' },
                { id: 'forest', name: 'Forest', icon: '🌲', type: 'birds', color: '#3d754a' },
                { id: 'fire', name: 'Fire', icon: '🔥', type: 'fire', color: '#b85a3a' },
                { id: 'wind', name: 'Wind', icon: '💨', type: 'wind', color: '#8a9aa8' },
                { id: 'crickets', name: 'Crickets', icon: '🦗', type: 'cricket', color: '#5d7a5d' }
            ];

            // store active nodes, volumes, etc.
            let soundNodes = [];
            let isPlaying = Array(sounds.length).fill(false);
            let volumes = Array(sounds.length).fill(0.5);
            let masterGainNode = null;

            // DOM elements
            const soundGrid = document.getElementById('soundGrid');
            const masterVolumeSlider = document.getElementById('masterVolume');
            const statusDisplay = document.getElementById('statusDisplay');
            const forestPreset = document.getElementById('forestPreset');
            const oceanPreset = document.getElementById('oceanPreset');
            const rainPreset = document.getElementById('rainPreset');
            const silencePreset = document.getElementById('silencePreset');

            // helper: init audio context (called on first user interaction)
            function initAudio() {
                if (audioContext) return;
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // create master gain
                masterGainNode = audioContext.createGain();
                masterGainNode.gain.value = masterVolumeSlider.value / 100;
                masterGainNode.connect(audioContext.destination);

                // create sound sources for each type
                sounds.forEach((sound, index) => {
                    createSoundSource(index, sound.type);
                });
            }

            // create a synthetic sound source (oscillator / noise)
            function createSoundSource(index, type) {
                if (!audioContext) return;

                let sourceNode;
                let gainNode = audioContext.createGain();
                gainNode.gain.value = volumes[index];
                gainNode.connect(masterGainNode);

                if (type === 'noise') {
                    // rain: filtered noise
                    const bufferSize = 2 * audioContext.sampleRate;
                    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                    const output = noiseBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        output[i] = Math.random() * 2 - 1;
                    }
                    const noise = audioContext.createBufferSource();
                    noise.buffer = noiseBuffer;
                    noise.loop = true;
                    
                    // bandpass filter
                    const filter = audioContext.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = 400;
                    filter.Q.value = 1.5;
                    
                    noise.connect(filter);
                    filter.connect(gainNode);
                    sourceNode = noise;
                } else if (type === 'waves') {
                    // waves: low-frequency oscillation + noise
                    const osc = audioContext.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = 0.5; // slow modulation
                    
                    const gainMod = audioContext.createGain();
                    gainMod.gain.value = 0.1;
                    
                    osc.connect(gainMod);
                    
                    // carrier noise
                    const bufferSize = audioContext.sampleRate;
                    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                    const output = noiseBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        output[i] = Math.random() * 2 - 1;
                    }
                    const noise = audioContext.createBufferSource();
                    noise.buffer = noiseBuffer;
                    noise.loop = true;
                    
                    const filter = audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 200;
                    
                    noise.connect(filter);
                    filter.connect(gainNode);
                    
                    // apply modulation to gain? Not trivial, but we'll keep simple
                    sourceNode = noise;
                } else if (type === 'birds') {
                    // birds: random high-pitched chirps (using oscillator)
                    const osc = audioContext.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = 2000 + Math.random() * 1000;
                    
                    const gainEnv = audioContext.createGain();
                    gainEnv.gain.value = 0.1;
                    
                    osc.connect(gainEnv);
                    gainEnv.connect(gainNode);
                    
                    // random pitch modulation not implemented in this simple version
                    sourceNode = osc;
                } else if (type === 'fire') {
                    // fire: crackling noise
                    const bufferSize = audioContext.sampleRate;
                    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                    const output = noiseBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        output[i] = Math.random() * 0.5;
                    }
                    const noise = audioContext.createBufferSource();
                    noise.buffer = noiseBuffer;
                    noise.loop = true;
                    
                    const filter = audioContext.createBiquadFilter();
                    filter.type = 'highpass';
                    filter.frequency.value = 800;
                    
                    noise.connect(filter);
                    filter.connect(gainNode);
                    sourceNode = noise;
                } else if (type === 'wind') {
                    // wind: filtered noise
                    const bufferSize = audioContext.sampleRate;
                    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                    const output = noiseBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        output[i] = Math.random() * 2 - 1;
                    }
                    const noise = audioContext.createBufferSource();
                    noise.buffer = noiseBuffer;
                    noise.loop = true;
                    
                    const filter = audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 200;
                    
                    noise.connect(filter);
                    filter.connect(gainNode);
                    sourceNode = noise;
                } else if (type === 'cricket') {
                    // cricket: pulsed oscillator
                    const osc = audioContext.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = 4000;
                    
                    const gainEnv = audioContext.createGain();
                    gainEnv.gain.value = 0.1;
                    
                    osc.connect(gainEnv);
                    gainEnv.connect(gainNode);
                    
                    sourceNode = osc;
                }

                if (sourceNode) {
                    soundNodes[index] = {
                        source: sourceNode,
                        gain: gainNode
                    };
                }
            }

            // start/stop sound
            function toggleSound(index) {
                if (!audioContext) {
                    initAudio();
                }

                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }

                const sound = soundNodes[index];
                if (!sound) return;

                if (isPlaying[index]) {
                    // stop
                    try {
                        sound.source.stop();
                    } catch (e) {}
                    isPlaying[index] = false;
                    
                    // recreate source for next play
                    createSoundSource(index, sounds[index].type);
                } else {
                    // start
                    const newSound = soundNodes[index];
                    if (newSound && newSound.source) {
                        newSound.source.start();
                        isPlaying[index] = true;
                    }
                }
                updateUI();
            }

            // update volume for a sound
            function setVolume(index, vol) {
                volumes[index] = vol;
                if (soundNodes[index] && soundNodes[index].gain) {
                    soundNodes[index].gain.gain.value = vol;
                }
            }

            // master volume
            function setMasterVolume(val) {
                if (masterGainNode) {
                    masterGainNode.gain.value = val / 100;
                }
            }

            // render sound cards
            function renderGrid() {
                let html = '';
                sounds.forEach((sound, idx) => {
                    html += `
                        <div class="sound-card ${isPlaying[idx] ? 'playing' : ''}" data-index="${idx}">
                            <div class="sound-icon">${sound.icon}</div>
                            <div class="sound-name">${sound.name}</div>
                            <input type="range" class="volume-slider" data-index="${idx}" min="0" max="1" step="0.01" value="${volumes[idx]}">
                            <button class="play-toggle ${isPlaying[idx] ? 'playing' : ''}" data-index="${idx}">
                                ${isPlaying[idx] ? '⏸ pause' : '▶ play'}
                            </button>
                        </div>
                    `;
                });
                soundGrid.innerHTML = html;

                // attach event listeners
                document.querySelectorAll('.play-toggle').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = btn.getAttribute('data-index');
                        toggleSound(parseInt(idx));
                    });
                });

                document.querySelectorAll('.volume-slider').forEach(slider => {
                    slider.addEventListener('input', (e) => {
                        const idx = slider.getAttribute('data-index');
                        const val = parseFloat(slider.value);
                        setVolume(parseInt(idx), val);
                    });
                });
            }

            // update UI after state change
            function updateUI() {
                renderGrid(); // simple re-render (could be optimized)
            }

            // preset handlers
            forestPreset.addEventListener('click', () => {
                // forest: birds, crickets, wind
                if (!audioContext) initAudio();
                // stop all first? we'll just set desired volumes
                sounds.forEach((_, idx) => {
                    const targetVol = [0, 0, 0.7, 0, 0.2, 0.6][idx] || 0;
                    setVolume(idx, targetVol);
                    volumes[idx] = targetVol;
                    if (targetVol > 0 && !isPlaying[idx]) {
                        // need to start
                        if (!soundNodes[idx]) createSoundSource(idx, sounds[idx].type);
                        if (soundNodes[idx] && !isPlaying[idx]) {
                            soundNodes[idx].source.start();
                            isPlaying[idx] = true;
                        }
                    } else if (targetVol === 0 && isPlaying[idx]) {
                        // stop
                        if (soundNodes[idx]) {
                            try { soundNodes[idx].source.stop(); } catch (e) {}
                            isPlaying[idx] = false;
                            createSoundSource(idx, sounds[idx].type);
                        }
                    }
                });
                updateUI();
                statusDisplay.innerText = '🌲 forest soundscape';
            });

            oceanPreset.addEventListener('click', () => {
                // ocean: waves, rain, wind
                sounds.forEach((_, idx) => {
                    const targetVol = [0.2, 0.8, 0, 0, 0.4, 0][idx] || 0;
                    setVolume(idx, targetVol);
                    volumes[idx] = targetVol;
                    if (targetVol > 0 && !isPlaying[idx]) {
                        if (!soundNodes[idx]) createSoundSource(idx, sounds[idx].type);
                        if (soundNodes[idx] && !isPlaying[idx]) {
                            soundNodes[idx].source.start();
                            isPlaying[idx] = true;
                        }
                    } else if (targetVol === 0 && isPlaying[idx]) {
                        if (soundNodes[idx]) {
                            try { soundNodes[idx].source.stop(); } catch (e) {}
                            isPlaying[idx] = false;
                            createSoundSource(idx, sounds[idx].type);
                        }
                    }
                });
                updateUI();
                statusDisplay.innerText = '🌊 ocean waves';
            });

            rainPreset.addEventListener('click', () => {
                // rainy night: rain, wind, fire
                sounds.forEach((_, idx) => {
                    const targetVol = [0.8, 0, 0, 0.5, 0.3, 0][idx] || 0;
                    setVolume(idx, targetVol);
                    volumes[idx] = targetVol;
                    if (targetVol > 0 && !isPlaying[idx]) {
                        if (!soundNodes[idx]) createSoundSource(idx, sounds[idx].type);
                        if (soundNodes[idx] && !isPlaying[idx]) {
                            soundNodes[idx].source.start();
                            isPlaying[idx] = true;
                        }
                    } else if (targetVol === 0 && isPlaying[idx]) {
                        if (soundNodes[idx]) {
                            try { soundNodes[idx].source.stop(); } catch (e) {}
                            isPlaying[idx] = false;
                            createSoundSource(idx, sounds[idx].type);
                        }
                    }
                });
                updateUI();
                statusDisplay.innerText = '☔ rainy night';
            });

            silencePreset.addEventListener('click', () => {
                // stop all
                sounds.forEach((_, idx) => {
                    if (isPlaying[idx]) {
                        if (soundNodes[idx]) {
                            try { soundNodes[idx].source.stop(); } catch (e) {}
                            isPlaying[idx] = false;
                            createSoundSource(idx, sounds[idx].type);
                        }
                    }
                    setVolume(idx, 0);
                    volumes[idx] = 0;
                });
                updateUI();
                statusDisplay.innerText = '🔇 silence';
            });

            masterVolumeSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                setMasterVolume(val);
            });

            // initial render (no audio until interaction)
            renderGrid();

            // ensure audio context is created on first user interaction anywhere
            document.body.addEventListener('click', function initOnClick() {
                if (!audioContext) {
                    initAudio();
                }
                document.body.removeEventListener('click', initOnClick);
            }, { once: true });
        })();