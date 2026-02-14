// 自動打ち上げはなく “手動だけ” で動く花火

const canvas = document.getElementById("fireworks");
const ctx = canvas.getContext("2d");

function fit() {
  const scale = Math.min(window.devicePixelRatio || 1, 1.5);

  canvas.width = innerWidth ;
  canvas.height = innerHeight ;

  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

fit();
addEventListener("resize", fit);

// ----------------------------------------------------------
// 音声ファイルを読み込みmp3
// ----------------------------------------------------------
const hissSound = new Audio("sounds/hiss.mp3"); // ヒュー音
hissSound.volume = 0.6;

const boomSound = new Audio("soundsboom.mp3"); // ドン音
boomSound.volume = 1.0;

// = 同時に何個も音を出せる
function playHiss() {
  const s = hissSound.cloneNode();
  s.volume = hissSound.volume;
  s.play();
  return s;
}

function playBoom() {
  const s = boomSound.cloneNode();
  s.volume = boomSound.volume;
  s.play();
}


const particles = [];
const shells = [];

const colors = [
  "#ff0043", "#14d2ff", "#14ff80",
  "#faff00", "#ff7f00", "#0080ff", "#f200ff"
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function hexToRGB(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

// ----------------------------------------------------------
// 手動で打ち上げる
// ----------------------------------------------------------
function launch(x) {
  const color = colors[(Math.random() * colors.length) | 0];

  const hiss = playHiss(); // 上昇音（mp3）

  shells.push({
    x: x,
    y: canvas.height,
    vx: rand(-0.4, 0.4),
    vy: rand(-11, -14),
    color,
    size: rand(4, 7),
    exploded: false,
    targetHeight: rand(canvas.height * 0.08, canvas.height * 0.28),
    hiss
  });
}

// 改善
function explode(x, y, color) {
  let count = 0;

  const burst = () => {
    for (let i = 0; i < 30; i++) {
      particles.push({
        x, y,
        vx: Math.cos(Math.random() * Math.PI * 2) * rand(2, 7),
        vy: Math.sin(Math.random() * Math.PI * 2) * rand(2, 7),
        radius: rand(2, 4),
        age: 0,
        life: rand(50, 90),
        color,
        glow: rand(8, 16), // ← 減らす
        gravity: 0.04,
        friction: 0.985
      });
    }
    count += 30;
    if (count < 180) requestAnimationFrame(burst);
  };

  burst();
  setTimeout(playBoom, 40); // ← 音を少し遅らせる
}


// ----------------------------------------------------------
function update() {

  // 花火玉
  for (let i = shells.length - 1; i >= 0; i--) {
    const s = shells[i];

    s.x += s.vx;
    s.y += s.vy;

    const prevVy = s.vy;
    s.vy += 0.12;

    // ----------------------
    // 必ず爆発判定
    // ----------------------

    // ①目標高度位置
    if (!s.exploded && s.y <= s.targetHeight) {
      s.exploded = true;
      explode(s.x, s.y, s.color);
      s.hiss.pause();
      shells.splice(i, 1);
      continue;
    }

    // ② 頂点（上昇→下降）
    if (!s.exploded && prevVy < 0 && s.vy >= 0) {
      s.exploded = true;
      explode(s.x, s.y, s.color);
      s.hiss.pause();
      shells.splice(i, 1);
      continue;
    }

    // ③ 上部に近い（保険）
    if (!s.exploded && s.y < canvas.height * 0.05) {
      s.exploded = true;
      explode(s.x, s.y, s.color);
      s.hiss.pause();
      shells.splice(i, 1);
    }
  }

  //パーティクル
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.vx *= p.friction;
    p.vy = p.vy * p.friction + p.gravity;

    p.x += p.vx;
    p.y += p.vy;

    p.age++;
    if (p.age > p.life) particles.splice(i, 1);
  }
}

// ----------------------------------------------------------
function draw() {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ★ 開花直後だけ lighter
  ctx.globalCompositeOperation =
    particles.some(p => p.age < 10) ? "lighter" : "source-over";


  shells.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = s.color;
    ctx.fill();
  });

  particles.forEach(p => {
  const alpha = Math.max(0, 1 - p.age / p.life);

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${hexToRGB(p.color)}, ${alpha})`;

  // ★ 開花直後だけ光らせる（超重要）
  ctx.shadowBlur = p.age < 10 ? p.glow : 0;
  ctx.shadowColor = p.color;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
  ctx.strokeStyle = `rgba(${hexToRGB(p.color)}, ${alpha * 0.4})`;
  ctx.lineWidth = p.radius;
  ctx.stroke();
});


  ctx.shadowBlur = 0;
}

// ----------------------------------------------------------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

// ----------------------------------------------------------
// ユーザー操作で打ち上がる
// ----------------------------------------------------------
canvas.addEventListener("click", e => launch(e.clientX));
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  launch(e.touches[0].clientX);
}, { passive: false });

