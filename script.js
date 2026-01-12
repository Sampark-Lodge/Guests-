/**
 * Sampark Lodge - Antigravity Concept
 * integrated with "Orbital Harmony" Micro-game
 */

const canvas = document.getElementById('antigravity-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let gameActive = true;
let pulses = []; // User clicks create pulses
let targets = []; // Orbital targets to hit
let score = 0;

// Colors
const COLOR_GOLD = '212, 175, 55';
const COLOR_OBSIDIAN = '10, 10, 12';

// ---------------- CANVAS SETUP ---------------- //
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ---------------- PHYSICS & GAME ENGINE ---------------- //

class Particle {
    constructor() {
        this.reset();
        // Initial random position
        this.x = Math.random() * width;
        this.y = Math.random() * height;
    }

    reset() {
        this.x = Math.random() * width;
        this.y = height + 10;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = -(Math.random() * 0.5 + 0.2); // Float upwards
        this.size = Math.random() * 2 + 0.5;
        this.alpha = Math.random() * 0.5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.002;

        if (this.y < -10 || this.alpha <= 0) {
            this.reset();
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR_GOLD}, ${this.alpha})`;
        ctx.fill();
    }
}

class Pulse {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.maxRadius = 300;
        this.speed = 4;
        this.alpha = 1;
        this.active = true;
    }

    update() {
        this.radius += this.speed;
        this.alpha -= 0.015;
        if (this.alpha <= 0) this.active = false;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${COLOR_GOLD}, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Target {
    constructor() {
        this.active = true;
        this.angle = Math.random() * Math.PI * 2;
        this.orbitRadius = 150 + Math.random() * 200; // Distance from center
        this.speed = (Math.random() - 0.5) * 0.02;
        this.size = Math.random() * 9 + 3; // Random sizes between 3 and 12
        this.bloom = 0;
    }

    update() {
        this.angle += this.speed;
        if (this.bloom > 0) this.bloom -= 1;
    }

    getPos() {
        return {
            x: width / 2 + Math.cos(this.angle) * this.orbitRadius,
            y: height / 2 + Math.sin(this.angle) * this.orbitRadius
        };
    }

    draw() {
        const pos = this.getPos();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.size + (this.bloom > 0 ? 5 : 0), 0, Math.PI * 2);
        ctx.fillStyle = this.bloom > 0 ? '#fff' : `rgba(${COLOR_GOLD}, 0.8)`;
        ctx.shadowBlur = this.bloom > 0 ? 20 : 5;
        ctx.shadowColor = `rgba(${COLOR_GOLD}, 1)`;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
    }
}

// Initialize Elements
for (let i = 0; i < 50; i++) particles.push(new Particle());
for (let i = 0; i < 5; i++) targets.push(new Target());

// ---------------- INTERACTION LOGIC ---------------- //
window.addEventListener('mousedown', (e) => {
    // Only launch pulse if clicking directly on canvas (not on buttons)
    // But since buttons have stopPropagation via default behavior if linked?
    // Let's just create pulse at mouse coords
    pulses.push(new Pulse(e.clientX, e.clientY));

    // Check collisions
    checkCollisions(e.clientX, e.clientY);
});

window.addEventListener('mousemove', (e) => {
    // Slight parallax for background particles based on mouse
    particles.forEach(p => {
        p.x += (e.movementX * 0.01);
        p.y += (e.movementY * 0.01);
    });
});

// Magnetic Buttons
const magneticButtons = document.querySelectorAll('[data-magnetic="true"]');
magneticButtons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.1)`;
        // also move icon darker
        const icon = btn.querySelector('.orb-icon');
        if (icon) icon.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.2)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        const icon = btn.querySelector('.orb-icon');
        if (icon) icon.style.transform = '';
    });
});

function checkCollisions(x, y) {
    // Simple mechanic: If click is close to a target, it explodes
    targets.forEach(t => {
        const pos = t.getPos();
        const dist = Math.hypot(pos.x - x, pos.y - y);
        if (dist < 50) {
            // Hit!
            t.bloom = 20;
            // Create specific explosion particles
            createExplosion(pos.x, pos.y);
        }
    });
}

function createExplosion(x, y) {
    for (let i = 0; i < 8; i++) {
        let p = new Particle();
        p.x = x;
        p.y = y;
        p.vx = (Math.random() - 0.5) * 4;
        p.vy = (Math.random() - 0.5) * 4;
        p.alpha = 1;
        p.size = Math.random() * 3;
        particles.push(p); // Add to main pool for simplicity, though physics differ slightly (gravity defaults)
    }
}

// ---------------- RENDER LOOP ---------------- //
function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw Ambient Particles
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw Targets (Orbitals)
    targets.forEach(t => {
        t.update();
        t.draw();

        // Connect targets with faint lines for "constellation" feel
        targets.forEach(t2 => {
            if (t !== t2) {
                const p1 = t.getPos();
                const p2 = t2.getPos();
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (dist < 200) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(${COLOR_GOLD}, ${0.1 - dist / 2000})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });
    });

    // Draw Pulses
    pulses.forEach((p, index) => {
        p.update();
        p.draw();
        if (!p.active) pulses.splice(index, 1);
    });

    requestAnimationFrame(animate);
}

animate();
