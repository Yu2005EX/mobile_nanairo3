/* ===== 音 ===== */
const bassBase = document.getElementById('bass');
const chimeBase = document.getElementById('chime');

function playSound(base, vol){
  const s = base.cloneNode();
  s.volume = vol;
  s.play();
}

/* ===== Canvas ===== */
const bg = document.getElementById('bg');
const ctx = bg.getContext('2d');

let w,h;
function resize(){
  w = bg.width = innerWidth;
  h = bg.height = innerHeight;
}
addEventListener('resize', resize);
resize();

/* ===== 粒子（初期位置を記憶） ===== */
const COUNT = 450;
const particles = [];

for(let i=0;i<COUNT;i++){
  const x = Math.random()*w;
  const y = Math.random()*h;
  particles.push({
    x, y,
    ox:x, oy:y,   // ← 元の位置
    vx:(Math.random()-0.5)*1.5,
    vy:(Math.random()-0.5)*1.5
  });
}

/* ===== 状態 ===== */
let attract = null;
let strength = 0;
let restoring = false;

/* ===== 描画 ===== */
function draw(){
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0,0,w,h);

  particles.forEach(p=>{
    if(attract){
      // 吸収
      const dx = attract.x - p.x;
      const dy = attract.y - p.y;
      const d = Math.hypot(dx,dy) + 0.001;
      const force = Math.min(1.2, 3 / d);
      p.vx += dx * force * strength;
      p.vy += dy * force * strength;
    }
    else if(restoring){
      // 元の位置へ戻る
      const dx = p.ox - p.x;
      const dy = p.oy - p.y;
      p.vx += dx * 0.01;
      p.vy += dy * 0.01;
    }

    p.x += p.vx;
    p.y += p.vy;

    // 減衰
    p.vx *= 0.96;
    p.vy *= 0.96;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.4, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,220,255,0.85)';
    ctx.fill();
  });

  requestAnimationFrame(draw);
}
draw();

/* ===== 前景操作 ===== */
const stage = document.getElementById('stage');
let pressTimer = null;
let hole = null;
let holePos = null;

function createBlackhole(x,y){
  restoring = false;

  hole = document.createElement('div');
  hole.className = 'blackhole';
  hole.style.left = x+'px';
  hole.style.top = y+'px';
  hole.style.setProperty('--hue', Math.random()*360);
  stage.appendChild(hole);

  attract = {x,y};
  strength = 0.22;

  playSound(bassBase, 0.7);
}

function releaseBlackhole(x,y){
  if(hole){
    hole.remove();
    hole = null;
  }

  attract = null;
  strength = 0;
  restoring = true;

  const wave = document.createElement('div');
  wave.className = 'wave';
  wave.style.left = x+'px';
  wave.style.top = y+'px';
  wave.style.setProperty('--hue', Math.random()*360);
  stage.appendChild(wave);
  wave.addEventListener('animationend',()=>wave.remove());

  playSound(chimeBase, 0.5);
}

/* ===== イベント ===== */
stage.addEventListener('pointerdown', e=>{
  holePos = {x:e.clientX, y:e.clientY};
  pressTimer = setTimeout(()=>{
    createBlackhole(holePos.x, holePos.y);
  }, 280);
});

stage.addEventListener('pointerup', ()=>{
  clearTimeout(pressTimer);
  if(hole){
    releaseBlackhole(holePos.x, holePos.y);
  }
  pressTimer = null;
});
