
class Boundary {
    constructor(x1, y1, x2, y2) {
        this.a = { x: x1, y: y1 };
        this.b = { x: x2, y: y2 };
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.a.x, this.a.y);
        ctx.lineTo(this.b.x, this.b.y);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
}

class Ray {
    constructor(pos, angle) {
        this.pos = pos;
        this.dir = { x: Math.cos(angle), y: Math.sin(angle) };
    }

    // Standard Line-Line Intersection Formula
    cast(wall) {
        const x1 = wall.a.x; const y1 = wall.a.y;
        const x2 = wall.b.x; const y2 = wall.b.y;
        const x3 = this.pos.x; const y3 = this.pos.y;
        const x4 = this.pos.x + this.dir.x; const y4 = this.pos.y + this.dir.y;

        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (den === 0) return null; // Parallel lines

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

        if (t > 0 && t < 1 && u > 0) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1),
                dist: u 
            };
        }
        return null;
    }
}

class Collectible {
    constructor(x, y) {
        this.pos = { x, y };
        this.radius = 8;
        this.collected = false;
        this.pulse = 0;
    }
    draw(ctx) {
        if (this.collected) return;
        this.pulse += 0.1;
        let glow = 15 + Math.sin(this.pulse) * 5;

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowBlur = glow;
        ctx.shadowColor = '#38bdf8';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
    }
}


class Player {
    constructor(x, y) {
        this.pos = { x, y };
        this.radius = 12;
        this.speed = 3.5;
        this.angle = 0;
        this.fov = Math.PI / 2.5; 
        this.rayCount = 120; 
    }

    update(keys, mouse, walls) {
      
        this.angle = Math.atan2(mouse.y - this.pos.y, mouse.x - this.pos.x);

        // Movement Vectors
        let dx = 0; let dy = 0;
        if (keys['w']) dy -= this.speed;
        if (keys['s']) dy += this.speed;
        if (keys['a']) dx -= this.speed;
        if (keys['d']) dx += this.speed;

        
        let newX = this.pos.x + dx;
        let newY = this.pos.y + dy;
        let canMoveX = true; let canMoveY = true;

        for (let wall of walls) {
            
            let lineLen = Math.hypot(wall.b.x - wall.a.x, wall.b.y - wall.a.y);
            let dotX = (((newX - wall.a.x)*(wall.b.x - wall.a.x)) + ((this.pos.y - wall.a.y)*(wall.b.y - wall.a.y))) / Math.pow(lineLen, 2);
            let dotY = (((this.pos.x - wall.a.x)*(wall.b.x - wall.a.x)) + ((newY - wall.a.y)*(wall.b.y - wall.a.y))) / Math.pow(lineLen, 2);
            
            let closestX = Math.max(0, Math.min(1, dotX));
            let closestY = Math.max(0, Math.min(1, dotY));

            let projX = wall.a.x + (closestX * (wall.b.x - wall.a.x));
            let projY = wall.a.y + (closestY * (wall.b.y - wall.a.y));

            if (Math.hypot(newX - projX, this.pos.y - projY) < this.radius + 5) canMoveX = false;
            if (Math.hypot(this.pos.x - projX, newY - projY) < this.radius + 5) canMoveY = false;
        }

        if (canMoveX) this.pos.x = newX;
        if (canMoveY) this.pos.y = newY;
    }

    getSightPolygon(walls) {
        const points = [];
        // Cast rays in a cone
        const startAngle = this.angle - this.fov / 2;
        const step = this.fov / this.rayCount;

        for (let i = 0; i <= this.rayCount; i++) {
            let rayAngle = startAngle + (i * step);
            let ray = new Ray(this.pos, rayAngle);
            let closest = null;
            let record = Infinity;

            for (let wall of walls) {
                const pt = ray.cast(wall);
                if (pt && pt.dist < record) {
                    record = pt.dist;
                    closest = pt;
                }
            }
            if (closest) points.push(closest);
        }
        return points;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
    }
}


class StealthEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        this.keys = {};
        this.mouse = { x: this.canvas.width/2, y: this.canvas.height/2 };
        
        this.currentLevel = 1;
        this.player = new Player(100, 100);
        this.walls = [];
        this.collectibles = [];
        this.score = 0;
        
        this.setupEvents();
        this.loadLevel(this.currentLevel);
        this.loop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
        this.canvas.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    createRoom(x, y, w, h) {
        this.walls.push(new Boundary(x, y, x + w, y)); // Top
        this.walls.push(new Boundary(x + w, y, x + w, y + h)); // Right
        this.walls.push(new Boundary(x + w, y + h, x, y + h)); // Bottom
        this.walls.push(new Boundary(x, y + h, x, y)); // Left
    }

    // --- 5 EASY LEVELS ---
    loadLevel(levelNum) {
        this.walls = [];
        this.collectibles = [];
        this.score = 0;
        document.getElementById('level-display').innerText = `Sector ${levelNum}`;
        document.getElementById('win-modal').classList.add('hidden');
        
        // Screen bounds
        this.createRoom(0, 0, this.canvas.width, this.canvas.height);

        let cx = this.canvas.width / 2;
        let cy = this.canvas.height / 2;
        
        // Always start the player bottom-center
        this.player.pos = { x: cx, y: cy + 250 };

        if (levelNum === 1) {
            // Level 1: One wall, one item. Very simple.
            this.walls.push(new Boundary(cx - 100, cy, cx + 100, cy));
            this.collectibles.push(new Collectible(cx, cy - 100));
        } 
        else if (levelNum === 2) {
            // Level 2: Two items, simple T-wall
            this.walls.push(new Boundary(cx - 150, cy, cx + 150, cy));
            this.walls.push(new Boundary(cx, cy, cx, cy - 150));
            this.collectibles.push(new Collectible(cx - 100, cy - 100));
            this.collectibles.push(new Collectible(cx + 100, cy - 100));
        } 
        else if (levelNum === 3) {
            
            this.createRoom(cx - 100, cy - 100, 200, 200);
            this.collectibles.push(new Collectible(cx - 200, cy));
            this.collectibles.push(new Collectible(cx + 200, cy));
            this.collectibles.push(new Collectible(cx, cy - 200));
        } 
        else if (levelNum === 4) {
            
            this.walls.push(new Boundary(cx - 200, cy - 150, cx - 100, cy - 150));
            this.walls.push(new Boundary(cx + 100, cy - 150, cx + 200, cy - 150));
            this.walls.push(new Boundary(cx - 200, cy + 50, cx - 100, cy + 50));
            this.walls.push(new Boundary(cx + 100, cy + 50, cx + 200, cy + 50));

            this.collectibles.push(new Collectible(cx - 150, cy - 200));
            this.collectibles.push(new Collectible(cx + 150, cy - 200));
            this.collectibles.push(new Collectible(cx - 150, cy + 100));
            this.collectibles.push(new Collectible(cx + 150, cy + 100));
        } 
        else if (levelNum === 5) {
            
            this.walls.push(new Boundary(cx - 250, cy + 50, cx + 100, cy + 50));
            this.walls.push(new Boundary(cx - 100, cy - 100, cx + 250, cy - 100));

            this.collectibles.push(new Collectible(cx - 300, cy + 150));
            this.collectibles.push(new Collectible(cx + 200, cy + 150));
            this.collectibles.push(new Collectible(cx - 200, cy - 25));
            this.collectibles.push(new Collectible(cx + 300, cy - 25));
            this.collectibles.push(new Collectible(cx, cy - 200));
        } 
        else {
            alert("All Sectors Cleared. Infiltration Successful.");
            this.currentLevel = 1;
            this.loadLevel(1); 
            return;
        }

        this.updateScore();
    }

    updateScore() {
        document.getElementById('score-display').innerText = `${this.score} / ${this.collectibles.length}`;
        if (this.score === this.collectibles.length) {
            setTimeout(() => document.getElementById('win-modal').classList.remove('hidden'), 500);
        }
    }

    nextLevel() {
        this.currentLevel++;
        this.loadLevel(this.currentLevel);
    }

    toggleGuide() { document.getElementById('guide-modal').classList.toggle('hidden'); }

    
    loop() {
        // 1. Update Logic
        this.player.update(this.keys, this.mouse, this.walls);

        for (let item of this.collectibles) {
            if (!item.collected && Math.hypot(this.player.pos.x - item.pos.x, this.player.pos.y - item.pos.y) < this.player.radius + item.radius) {
                item.collected = true;
                this.score++;
                this.updateScore();
            }
        }

        // 2. Clear Screen & Draw Floor
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.walls.forEach(w => w.draw(this.ctx));
        this.collectibles.forEach(c => c.draw(this.ctx));
        this.player.draw(this.ctx);

        // 4. Calculate Flashlight Math
        const sightPolygon = this.player.getSightPolygon(this.walls);
        
        this.ctx.fillStyle = 'rgba(2, 6, 23, 0.98)';
        this.ctx.beginPath();
        
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.canvas.width, 0);
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();

        if (sightPolygon.length > 0) {
            this.ctx.moveTo(this.player.pos.x, this.player.pos.y);
            // Reverse loop creates the counter-clockwise path
            for (let i = sightPolygon.length - 1; i >= 0; i--) {
                this.ctx.lineTo(sightPolygon[i].x, sightPolygon[i].y);
            }
            this.ctx.closePath();
        }
        
        
        this.ctx.fill('evenodd');

        // 6. Add a soft glow to the flashlight beam
        if (sightPolygon.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.pos.x, this.player.pos.y);
            for (let pt of sightPolygon) this.ctx.lineTo(pt.x, pt.y);
            this.ctx.closePath();

            let gradient = this.ctx.createRadialGradient(
                this.player.pos.x, this.player.pos.y, 0, 
                this.player.pos.x, this.player.pos.y, 450
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }

        requestAnimationFrame(() => this.loop());
    }
}

const game = new StealthEngine();