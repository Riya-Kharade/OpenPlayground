        (function() {
            // ----- DOM elements -----
            const circle = document.getElementById('breathCircle');
            const phaseDisplay = document.getElementById('phaseDisplay');
            const instruction = document.getElementById('instruction');
            const timerDisplay = document.getElementById('timerDisplay');
            const playPauseBtn = document.getElementById('playPauseBtn');
            const resetBtn = document.getElementById('resetBtn');
            const cycleCountSpan = document.getElementById('cycleCount');
            const totalTimeSpan = document.getElementById('totalTime');

            // input fields
            const inhaleInput = document.getElementById('inhaleTime');
            const holdInput = document.getElementById('holdTime');
            const exhaleInput = document.getElementById('exhaleTime');

            // ----- state -----
            let isRunning = false;
            let currentPhase = 'inhale'; // inhale, hold, exhale
            let timer = 0; // seconds left in current phase
            let cycleCounter = 0;
            let totalSeconds = 0;
            let intervalId = null;

            // phase durations (in seconds)
            let inhaleDur = 4;
            let holdDur = 7;
            let exhaleDur = 8;

            // ----- helper to update UI from durations -----
            function updateDurationsFromInputs() {
                inhaleDur = parseInt(inhaleInput.value, 10) || 4;
                holdDur = parseInt(holdInput.value, 10) || 0;
                exhaleDur = parseInt(exhaleInput.value, 10) || 4;
                if (inhaleDur < 2) inhaleDur = 2;
                if (exhaleDur < 2) exhaleDur = 2;
                if (holdDur < 0) holdDur = 0;
                if (holdDur > 15) holdDur = 15;
                // clamp
                inhaleInput.value = inhaleDur;
                holdInput.value = holdDur;
                exhaleInput.value = exhaleDur;

                // reset phase timer when changed? but we'll just reset cycle
                resetCycle();
            }

            // ----- reset to beginning of cycle (inhale) -----
            function resetCycle() {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
                isRunning = false;
                playPauseBtn.innerText = '▶';
                currentPhase = 'inhale';
                timer = inhaleDur;
                updateDisplay();
                applyCircleClass();
                // don't reset cycle counter maybe, but reset total seconds? we'll keep counter as is? for simplicity, we reset counter on reset button
            }

            // full reset (including counters)
            function fullReset() {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
                isRunning = false;
                playPauseBtn.innerText = '▶';
                currentPhase = 'inhale';
                timer = inhaleDur;
                cycleCounter = 0;
                totalSeconds = 0;
                cycleCountSpan.innerText = '0';
                totalTimeSpan.innerText = '0:00';
                updateDisplay();
                applyCircleClass();
            }

            // update the text and timer display
            function updateDisplay() {
                timerDisplay.innerText = timer;
                if (currentPhase === 'inhale') {
                    phaseDisplay.innerText = 'Inhale';
                    instruction.innerText = 'through nose';
                } else if (currentPhase === 'hold') {
                    phaseDisplay.innerText = 'Hold';
                    instruction.innerText = 'keep calm';
                } else {
                    phaseDisplay.innerText = 'Exhale';
                    instruction.innerText = 'through mouth';
                }
            }

            // apply css class for animation (scale)
            function applyCircleClass() {
                circle.classList.remove('inhale', 'exhale');
                if (currentPhase === 'inhale') {
                    circle.classList.add('inhale');
                } else if (currentPhase === 'exhale') {
                    circle.classList.add('exhale');
                } else {
                    // hold: keep same as inhale scale? we'll keep inhale scale for hold too
                    circle.classList.add('inhale');
                }
            }

            // advance to next phase
            function nextPhase() {
                if (currentPhase === 'inhale') {
                    if (holdDur > 0) {
                        currentPhase = 'hold';
                        timer = holdDur;
                    } else {
                        currentPhase = 'exhale';
                        timer = exhaleDur;
                    }
                } else if (currentPhase === 'hold') {
                    currentPhase = 'exhale';
                    timer = exhaleDur;
                } else { // exhale
                    // cycle completed
                    currentPhase = 'inhale';
                    timer = inhaleDur;
                    cycleCounter++;
                    cycleCountSpan.innerText = cycleCounter;
                }
                updateDisplay();
                applyCircleClass();
            }

            // tick every second
            function tick() {
                if (!isRunning) return;

                timer--;
                totalSeconds++;
                // update total time display
                const mins = Math.floor(totalSeconds / 60);
                const secs = totalSeconds % 60;
                totalTimeSpan.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                if (timer <= 0) {
                    nextPhase();
                } else {
                    updateDisplay();
                }
            }

            // start/pause
            function toggleRunning() {
                if (isRunning) {
                    // pause
                    if (intervalId) {
                        clearInterval(intervalId);
                        intervalId = null;
                    }
                    isRunning = false;
                    playPauseBtn.innerText = '▶';
                } else {
                    // start
                    isRunning = true;
                    playPauseBtn.innerText = '⏸';
                    if (!intervalId) {
                        intervalId = setInterval(tick, 1000);
                    }
                }
            }

            // ----- event listeners -----
            playPauseBtn.addEventListener('click', toggleRunning);
            resetBtn.addEventListener('click', () => {
                fullReset();
            });

            // circle click toggles
            circle.addEventListener('click', toggleRunning);

            // input changes: update durations and reset cycle (but keep running? better reset to avoid mismatch)
            inhaleInput.addEventListener('change', () => {
                updateDurationsFromInputs();
                fullReset(); // reset everything
            });
            holdInput.addEventListener('change', () => {
                updateDurationsFromInputs();
                fullReset();
            });
            exhaleInput.addEventListener('change', () => {
                updateDurationsFromInputs();
                fullReset();
            });

            // initialize
            updateDurationsFromInputs();
            fullReset();

            // handle visibility change: optional – we don't want timer to drift when tab hidden, but it's fine.
        })();