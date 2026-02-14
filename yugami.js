const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let w, h;
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

/* =========================
   パーティクル
========================= */
const particles = [];
const COUNT = 900;
let hueShift = 0;

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.size = Math.random() * 1.2 + 0.6;
    this.life = Math.random() * 200 + 100;
    this.hue = Math.random() * 360;
    this.flash = 0; // はじかれ強調用
  }

  update() {
    this.life--;

    // フロー（gbbbBoK系）
    const angle =
      Math.sin(this.y * 0.002) +
      Math.cos(this.x * 0.002);

    this.vx += Math.cos(angle) * 0.02;
    this.vy += Math.sin(angle) * 0.02;

    applyDistortion(this);

    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.97;
    this.vy *= 0.97;
    this.flash *= 0.9;

    if (
      this.life <= 0 ||
      this.x < 0 || this.x > w ||
      this.y < 0 || this.y > h
    ) {
      this.reset();
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(
      this.x,
      this.y,
      this.size + this.flash * 0.6,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = `hsla(${this.hue + hueShift},100%,${70 + this.flash * 20}%,0.85)`;
    ctx.fill();
  }
}

for (let i = 0; i < COUNT; i++) {
  particles.push(new Particle());
}

/* =========================
   歪み（反発特化）
========================= */
let distortions = [];

function addDistortion(x, y, power = 1) {
  for (let i = 0; i < 4; i++) { // ← 反応数UP
    distortions.push({
      x: x + (Math.random() - 0.5) * 25,
      y: y + (Math.random() - 0.5) * 25,
      strength: 200 * power,
      life: 1.2
    });
  }
}

function applyDistortion(p) {
  distortions.forEach(d => {
    const dx = p.x - d.x;
    const dy = p.y - d.y;
    const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;

    if (dist < d.strength) {
      // 距離が近いほど強烈に弾く
      const force =
        Math.pow(1 - dist / d.strength, 2) *
        d.life * 3.5;

      p.vx += (dx / dist) * force;
      p.vy += (dy / dist) * force;

      // はじかれた粒を強調
      p.flash = Math.min(p.flash + force * 0.6, 1.5);
    }
  });
}

/* =========================
   入力
========================= */
let isDragging = false;

canvas.addEventListener("pointerdown", e => {
  isDragging = true;
  addDistortion(e.clientX, e.clientY, 1.5);
});

canvas.addEventListener("pointermove", e => {
  if (!isDragging) return;
  addDistortion(e.clientX, e.clientY, 0.9);
});

canvas.addEventListener("pointerup", () => isDragging = false);
canvas.addEventListener("pointerleave", () => isDragging = false);

/* =========================
   ループ
========================= */
function animate() {
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.fillRect(0, 0, w, h);

  hueShift += 0.5;

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  distortions = distortions.filter(d => {
    d.life *= 0.92;
    return d.life > 0.05;
  });

  requestAnimationFrame(animate);
}

animate();
