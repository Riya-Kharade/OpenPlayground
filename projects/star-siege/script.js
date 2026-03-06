
class PriorityQueue {
    constructor() { this.items = []; }
    enqueue(element, priority) {
        let qElement = { element, priority };
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (qElement.priority < this.items[i].priority) {
                this.items.splice(i, 0, qElement);
                added = true; break;
            }
        }
        if (!added) this.items.push(qElement);
    }
    dequeue() { return this.items.shift(); }
    isEmpty() { return this.items.length === 0; }
}

class Pathfinder {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
    }

    // Manhattan distance heuristic
    heuristic(a, b) { return Math.abs(a.c - b.c) + Math.abs(a.r - b.r); }

    findPath(grid, startC, startR, endC, endR) {
        let openSet = new PriorityQueue();
        let cameFrom = new Map();
        let gScore = new Map();
        
        const posToKey = (c, r) => `${c},${r}`;
        const startKey = posToKey(startC, startR);
        const endKey = posToKey(endC, endR);

        gScore.set(startKey, 0);
        openSet.enqueue({c: startC, r: startR}, this.heuristic({c: startC, r: startR}, {c: endC, r: endR}));

        while (!openSet.isEmpty()) {
            let current = openSet.dequeue().element;
            let currentKey = posToKey(current.c, current.r);

            if (currentKey === endKey) {
                let path = [];
                let curr = currentKey;
                while (cameFrom.has(curr)) {
                    let [c, r] = curr.split(',').map(Number);
                    path.push({c, r});
                    curr = cameFrom.get(curr);
                }
                return path.reverse();
            }

            let neighbors = [
                {c: current.c, r: current.r - 1}, {c: current.c + 1, r: current.r},
                {c: current.c, r: current.r + 1}, {c: current.c - 1, r: current.r}
            ];

            for (let n of neighbors) {
                if (n.c >= 0 && n.c < this.cols && n.r >= 0 && n.r < this.rows && grid[n.c][n.r] === 0) {
                    let nKey = posToKey(n.c, n.r);
                    let tentativeG = gScore.get(currentKey) + 1;

                    if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
                        cameFrom.set(nKey, currentKey);
                        gScore.set(nKey, tentativeG);
                        let fScore = tentativeG + this.heuristic(n, {c: endC, r: endR});
                        openSet.enqueue(n, fScore);
                    }
                }
            }
        }
        return null; 
    }
}


class Enemy {
    constructor(c, r, tileSize) {
        this.c = c; this.r = r;
        this.x = c * tileSize + tileSize / 2;
        this.y = r * tileSize + tileSize / 2;
        this.size = tileSize * 0.4;
        this.speed = 1.5;
        this.hp = 100;
        this.path = [];
        this.pathIndex = 0;
    }

    updatePath(newPath) {
        this.path = newPath;
        this.pathIndex = 0;
    }

    update(tileSize) {
        if (this.pathIndex >= this.path.length) return false; // Reached end

        let targetNode = this.path[this.pathIndex];
        let targetX = targetNode.c * tileSize + tileSize / 2;
        let targetY = targetNode.r * tileSize + tileSize / 2;

        let dx = targetX - this.x;
        let dy = targetY - this.y;
        let dist = Math.hypot(dx, dy);

        if (dist < this.speed) {
            this.x = targetX; this.y = targetY;
            this.c = targetNode.c; this.r = targetNode.r;
            this.pathIndex++;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        return true;
    }

    draw(ctx) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        
        // Health bar
        ctx.fillStyle = '#1e293b'; ctx.fillRect(this.x - 10, this.y - 15, 20, 4);
        ctx.fillStyle = '#4ade80'; ctx.fillRect(this.x - 10, this.y - 15, 20 * (this.hp/100), 4);
    }
}

class Tower {
    constructor(c, r, tileSize) {
        this.c = c; this.r = r;
        this.x = c * tileSize + tileSize / 2;
        this.y = r * tileSize + tileSize / 2;
        this.range = tileSize * 3.5;
        this.cooldown = 0;
        this.fireRate = 40; // Frames
    }

    update(enemies, projectiles) {
        if (this.cooldown > 0) this.cooldown--;
        if (this.cooldown <= 0) {
            // Find closest enemy
            let target = null;
            let minDist = this.range;
            for (let e of enemies) {
                let dist = Math.hypot(this.x - e.x, this.y - e.y);
                if (dist < minDist) { minDist = dist; target = e; }
            }
            if (target) {
                projectiles.push(new Projectile(this.x, this.y, target));
                this.cooldown = this.fireRate;
            }
        }
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(this.x, this.y, tileSize * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.arc(this.x, this.y, tileSize * 0.2, 0, Math.PI * 2); ctx.fill();
    }
}

class Projectile {
    constructor(x, y, target) {
        this.x = x; this.y = y;
        this.target = target;
        this.speed = 8;
        this.damage = 35;
        this.active = true;
    }

    update() {
        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let dist = Math.hypot(dx, dy);

        if (dist < this.speed) {
            this.target.hp -= this.damage;
            this.active = false;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill();
    }
}


class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.tileSize = 50;
        this.cols = Math.floor(window.innerWidth / this.tileSize);
        this.rows = Math.floor(window.innerHeight / this.tileSize);
        this.canvas.width = this.cols * this.tileSize;
        this.canvas.height = this.rows * this.tileSize;

        this.pathfinder = new Pathfinder(this.cols, this.rows);
        
        this.currentLevel = 1;
        this.state = 'PLAYING'; // PLAYING, WON, GAMEOVER
        
        this.setupEvents();
        this.loadLevel(this.currentLevel);
        this.loop();
    }
    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.state !== 'PLAYING') return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            let c = Math.floor(x / this.tileSize);
            let r = Math.floor(y / this.tileSize);

            // Safety bounds check
            if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;
            if (c === this.spawn.c && r === this.spawn.r) return;
            if (c === this.base.c && r === this.base.r) return;

            if (this.grid[c][r] === 0 && this.money >= 50) {
                
                this.grid[c][r] = 1; // Temporarily place tower
                let testPath = this.pathfinder.findPath(this.grid, this.spawn.c, this.spawn.r, this.base.c, this.base.r);
                
                if (testPath === null) {
                    // Blocked! Reject placement
                    this.grid[c][r] = 0;
                    document.getElementById('build-status').innerText = "❌ Cannot block the path!";
                    document.getElementById('build-status').style.color = "#ef4444";
                    setTimeout(() => {
                        document.getElementById('build-status').innerText = "Click any empty tile to build.";
                        document.getElementById('build-status').style.color = "#94a3b8";
                    }, 2000);
                } else {
                    // Valid placement
                    this.money -= 50;
                    this.towers.push(new Tower(c, r, this.tileSize));
                    this.masterPath = testPath; 
                    
                    for (let e of this.enemies) {
                        let newEPath = this.pathfinder.findPath(this.grid, e.c, e.r, this.base.c, this.base.r);
                        if (newEPath) e.updatePath(newEPath);
                    }
                    this.updateUI();
                }
            } else if (this.money < 50) {
                // Let the user know they are broke!
                document.getElementById('build-status').innerText = "⚠️ Not enough credits!";
                document.getElementById('build-status').style.color = "#fbbf24";
                setTimeout(() => {
                    document.getElementById('build-status').innerText = "Click any empty tile to build.";
                    document.getElementById('build-status').style.color = "#94a3b8";
                }, 2000);
            }
        });
    }

    buildWall(c, r) {
        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
            this.grid[c][r] = 2; 
        }
    }

    loadLevel(levelNum) {
        this.currentLevel = levelNum > 5 ? 5 : levelNum; // Max 5 levels
        this.state = 'PLAYING';
        this.frameCount = 0;
        
        document.getElementById('win-modal').classList.add('hidden');
        document.getElementById('game-over-modal').classList.add('hidden');

        // Reset Data
        this.grid = Array.from({length: this.cols}, () => Array(this.rows).fill(0));
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.enemiesSpawned = 0;
        this.health = 10;
        
        this.spawn = { c: 0, r: Math.floor(this.rows / 2) };
        this.base = { c: this.cols - 1, r: Math.floor(this.rows / 2) };

        // Level Configurations (Easy setups)
        let cx = Math.floor(this.cols / 2);
        let cy = Math.floor(this.rows / 2);

        if (this.currentLevel === 1) {
            this.totalEnemies = 10; this.money = 200; // Open field
        } 
        else if (this.currentLevel === 2) {
            this.totalEnemies = 15; this.money = 250;
            // Simple center block
            for (let i = -2; i <= 2; i++) this.buildWall(cx, cy + i);
        } 
        else if (this.currentLevel === 3) {
            this.totalEnemies = 20; this.money = 300;
            // Wide Funnel
            for(let c = 5; c < cx; c++) { this.buildWall(c, 2); this.buildWall(c, this.rows - 3); }
        } 
        else if (this.currentLevel === 4) {
            this.totalEnemies = 25; this.money = 350;
            // Split paths
            for(let r = 0; r < cy - 2; r++) this.buildWall(cx, r);
            for(let r = cy + 3; r < this.rows; r++) this.buildWall(cx, r);
        } 
        else if (this.currentLevel === 5) {
            this.totalEnemies = 30; this.money = 400;
            // Zig Zag
            for(let r = 0; r < this.rows - 4; r++) this.buildWall(cx - 3, r);
            for(let r = 4; r < this.rows; r++) this.buildWall(cx + 3, r);
        }

        this.masterPath = this.pathfinder.findPath(this.grid, this.spawn.c, this.spawn.r, this.base.c, this.base.r);
        this.renderGrid();
        this.updateUI();
    }

    renderGrid() {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            let statusClass = i === this.currentLevel ? 'active' : '';
            grid.innerHTML += `<button class="grid-btn ${statusClass}" onclick="game.loadLevel(${i})">${i}</button>`;
        }
    }

    resetLevel() { this.loadLevel(this.currentLevel); }
    nextLevel() { this.loadLevel(this.currentLevel + 1); }
    toggleGuide() { document.getElementById('guide-modal').classList.toggle('hidden'); }

    spawnEnemy() {
        if (this.enemiesSpawned >= this.totalEnemies) return;
        let e = new Enemy(this.spawn.c, this.spawn.r, this.tileSize);
        e.hp = 80 + (this.currentLevel * 20); // Slightly harder per level, but still easy
        e.updatePath(this.masterPath);
        this.enemies.push(e);
        this.enemiesSpawned++;
        this.updateUI();
    }

    updateUI() {
        document.getElementById('money-display').innerText = this.money;
        document.getElementById('health-display').innerText = this.health;
        let left = this.totalEnemies - this.enemiesSpawned + this.enemies.length;
        document.getElementById('enemies-left-display').innerText = left;
    }

    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Grid, Permanent Walls, and Tower Foundations
        this.ctx.strokeStyle = '#1e293b'; this.ctx.lineWidth = 1;
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows; r++) {
                this.ctx.strokeRect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);
                
                if (this.grid[c][r] === 2) {
                    // Draw Dark Permanent Walls
                    this.ctx.fillStyle = '#0f172a'; 
                    this.ctx.fillRect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);
                } else if (this.grid[c][r] === 1) {
                    // Draw a subtle blue highlight to show the "Tile" was built
                    this.ctx.fillStyle = 'rgba(56, 189, 248, 0.15)'; 
                    this.ctx.fillRect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }

        
        // Draw Spawn & Base
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        this.ctx.fillRect(this.spawn.c * this.tileSize, this.spawn.r * this.tileSize, this.tileSize, this.tileSize);
        this.ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        this.ctx.fillRect(this.base.c * this.tileSize, this.base.r * this.tileSize, this.tileSize, this.tileSize);

        if (this.state === 'PLAYING') {
            // Spawn Logic
            this.frameCount++;
            if (this.frameCount % 60 === 0) this.spawnEnemy(); // 1 enemy per second

            // Update Entities
            this.towers.forEach(t => { t.update(this.enemies, this.projectiles); t.draw(this.ctx, this.tileSize); });
            
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                let p = this.projectiles[i]; p.update(); p.draw(this.ctx);
                if (!p.active) this.projectiles.splice(i, 1);
            }

            for (let i = this.enemies.length - 1; i >= 0; i--) {
                let e = this.enemies[i];
                let reachedBase = !e.update(this.tileSize);
                e.draw(this.ctx);

                if (e.hp <= 0) {
                    this.money += 20; // Easy money
                    this.enemies.splice(i, 1);
                    this.updateUI();
                } else if (reachedBase) {
                    this.health--;
                    this.enemies.splice(i, 1);
                    this.updateUI();
                    
                    // LOSE CONDITION
                    if (this.health <= 0) {
                        this.state = 'GAMEOVER';
                        document.getElementById('game-over-modal').classList.remove('hidden');
                    }
                }
            }

            // WIN CONDITION
            if (this.enemiesSpawned >= this.totalEnemies && this.enemies.length === 0 && this.health > 0) {
                this.state = 'WON';
                document.getElementById('win-modal').classList.remove('hidden');
            }
        } else {
            // If won/lost, just draw static entities
            this.towers.forEach(t => t.draw(this.ctx, this.tileSize));
            this.enemies.forEach(e => e.draw(this.ctx));
        }

        requestAnimationFrame(() => this.loop());
    }
}

const game = new GameEngine();