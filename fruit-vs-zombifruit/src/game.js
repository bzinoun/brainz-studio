'use strict';
/* =========================================================
   Fruit Kawaii vs Fruit Zombifié — Brainz Studio
   Défense du verger en 5 colonnes (adaptation portrait du
   tower-defense en lignes) : les zombifruits descendent du
   haut, on plante des fruits kawaii pour les arrêter.
   Graphismes : sprites PNG embarqués (src/assets/, générés
   par tools/gen-assets.py) avec repli vectoriel Canvas 2D.
   Prêt pour YouTube Playables :
   - pause/reprise totales via window.GameApp
   - sauvegarde isolée dans l'objet Storage
   - aucun appel réseau (polices à embarquer avant soumission)
   ========================================================= */

const COLS = 5, ROWS = 7;

/* ---------- Défenseurs ---------- */
const PLANTS = {
  fraisoleil:{name:'Fraisoleil',      cost:50,  hp:60,  cd:7,  img:'plant_fraisoleil', desc:'Produit de la rosée'},
  cracheur:  {name:'Cracheur',        cost:100, hp:90,  cd:6,  img:'plant_cracheur',   desc:'Tire des pépins'},
  coco:      {name:'Coco-Mur',        cost:50,  hp:420, cd:14, img:'plant_coco',       desc:'Bloque les zombifruits'},
  givree:    {name:'Myrtille Givrée', cost:150, hp:90,  cd:9,  img:'plant_givree',     desc:'Ralentit de givre'},
  bombe:     {name:'Bombe Cerise',    cost:150, hp:999, cd:18, img:'plant_bombe',      desc:'Explose la zone'},
};

/* ---------- Zombifruits (vitesse en cases/s, dmg en PV/s) ---------- */
const ZOMBIES = {
  pomme:   {name:'Pomme Zombifiée',  hp:100,  speed:.105, dmg:28, pts:10, img:'z_pomme'},
  citron:  {name:'Citron Pressé',    hp:70,   speed:.21,  dmg:28, pts:15, img:'z_citron'},
  orange:  {name:'Orange Casquée',   hp:230,  speed:.085, dmg:28, pts:20, img:'z_orange'},
  pasteque:{name:'Pastèque Blindée', hp:430,  speed:.06,  dmg:42, pts:30, img:'z_pasteque'},
  raisin:  {name:'Grappe Grognon',   hp:160,  speed:.09,  dmg:28, pts:20, img:'z_raisin'},
  baron:   {name:'Baron Zombifié',   hp:1600, speed:.042, dmg:80, pts:150, img:'z_baron', boss:true},
};

/* ---------- Niveaux ----------
   script : [t, n, ...types] = à t secondes, n zombifruits tirés au
   hasard parmi types (étalés de 1.6 s en 1.6 s, colonnes aléatoires). */
const LEVELS = [
 {name:'Leçon de jardinage', story:'Petite démo guidée : apprends à défendre le verger, pas à pas, sans danger.', tuto:true,
  cards:['fraisoleil','cracheur'], dew:50, script:[]},
 {name:'Premiers pépins', story:'Les pommes zombifiées arrivent ! Plante des Fraisoleils pour la rosée et des Cracheurs pour tirer.',
  cards:['cracheur','fraisoleil'], dew:150,
  script:[[10,1,'pomme'],[26,1,'pomme'],[42,2,'pomme'],[58,2,'pomme'],[74,3,'pomme']]},
 {name:'La haie tient bon', story:'Les Citrons Pressés courent vite. Le Coco-Mur est là pour encaisser.',
  cards:['cracheur','fraisoleil','coco'], dew:125, unlock:'coco',
  script:[[10,1,'pomme'],[24,1,'citron'],[38,2,'pomme'],[52,2,'pomme','citron'],[66,3,'pomme','citron'],[82,4,'pomme','pomme','citron']]},
 {name:'Casque de gland', story:'Les Oranges Casquées encaissent les pépins. Une Bombe Cerise règle ça.',
  cards:['cracheur','fraisoleil','coco','bombe'], dew:125, unlock:'bombe',
  script:[[10,1,'pomme'],[24,1,'orange'],[38,2,'pomme','citron'],[52,2,'orange','pomme'],[68,3,'pomme','citron'],[84,4,'orange','pomme','citron']]},
 {name:'Givre et pépins', story:'La Myrtille Givrée ralentit tout ce qu’elle touche. Fraîcheur garantie !',
  cards:['cracheur','fraisoleil','coco','givree','bombe'], dew:125, unlock:'givree',
  script:[[10,1,'pomme'],[22,2,'citron'],[36,2,'orange'],[50,3,'pomme','citron'],[64,3,'orange','pomme'],[80,4,'pomme','citron','orange'],[96,4,'orange','citron','pomme']]},
 {name:'La pastèque qui roule', story:'Une Pastèque Blindée écrase tout sur son passage. Vise-la en priorité !',
  cards:['cracheur','fraisoleil','coco','givree','bombe'], dew:100,
  script:[[10,2,'pomme'],[26,1,'pasteque'],[42,3,'pomme','citron'],[58,2,'orange','pasteque'],[74,4,'pomme','citron','orange'],[92,4,'pasteque','orange','pomme']]},
 {name:'La grappe grogne', story:'Les Grappes Grognons débarquent en famille. Ça fait beaucoup de grimaces.',
  cards:['cracheur','fraisoleil','coco','givree','bombe'], dew:100,
  script:[[8,2,'pomme','raisin'],[24,2,'raisin','citron'],[40,3,'orange','raisin'],[56,3,'pomme','raisin','citron'],[72,4,'raisin','orange','pasteque'],[90,5,'raisin','pomme','citron','orange']]},
 {name:'La grande marée moisie', story:'Toute l’armée du Baron attaque en même temps. Tiens bon, le verger compte sur toi !',
  cards:['cracheur','fraisoleil','coco','givree','bombe'], dew:100,
  script:[[8,2,'pomme','citron'],[22,3,'orange','raisin'],[36,3,'pomme','pasteque','citron'],[50,4,'raisin','orange','pomme'],[66,5,'pomme','citron','orange','raisin'],[84,6,'pasteque','raisin','orange','pomme','citron']]},
 {name:'Le Baron Zombifié', story:'Le Baron Zombifié vient en personne, haut-de-forme moisi et tout. Dernier combat !', boss:true,
  cards:['cracheur','fraisoleil','coco','givree','bombe'], dew:125,
  script:[[8,2,'pomme','citron'],[22,3,'orange','raisin'],[38,1,'baron'],[44,3,'pomme','citron'],[60,4,'raisin','orange','pasteque'],[78,5,'pomme','citron','orange','raisin']]},
];

/* Mise en avant des nouveaux fruits (« glow up ») au premier niveau qui les débloque */
const UNLOCKS = {
  coco:  {desc:'Un mur végétal ultra résistant qui bloque les zombifruits.',
          how:'Place-le AU-DESSUS de tes tireurs (plus haut dans la colonne) : il encaisse les morsures pendant que les Cracheurs arrosent de pépins, bien à l’abri derrière lui.'},
  bombe: {desc:'Elle grésille une seconde… puis balaie tous les zombifruits autour d’elle.',
          how:'Pose-la au milieu d’un groupe compact ou sous une Orange Casquée trop coriace : BOUM, zone nettoyée. Usage unique : elle disparaît après l’explosion.'},
  givree:{desc:'Ses pépins givrés ralentissent fortement les zombifruits touchés.',
          how:'Vise les colonnes des Citrons Pressés trop rapides ou des gros costauds : gelés, ils restent deux fois plus longtemps sous le feu de tes Cracheurs.'},
};
const CINE_LINES = { baron:'MWAHAHA ! Votre verger sera MA compote ! Mes zombifruits, ATTAQUEZ !' };

/* ---------- Sauvegarde (localStorage ici ; ytgame.game.saveData sur Playables) ---------- */
const KEY = 'fvz-save-v2';
const Storage = {
  load(){
    try{
      let d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!d){
        // migration v1 : le niveau démo a décalé tous les niveaux de +1
        const old = JSON.parse(localStorage.getItem('fvz-save-v1') || 'null');
        if (old){
          const shift = o=>{ const r={}; for (const k in o||{}) r[+k+1]=o[k]; return r; };
          d = {unlocked:(old.unlocked||1)+1, best:shift(old.best), stars:shift(old.stars), muted:!!old.muted};
          localStorage.setItem(KEY, JSON.stringify(d));
          localStorage.removeItem('fvz-save-v1');
        }
      }
      return d || {};
    }catch(e){ return {}; }
  },
  save(d){ try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){} }
};
let save = Object.assign({unlocked:1, best:{}, stars:{}, muted:false, seenU:{}}, Storage.load());

/* ---------- Audio (synthèse WebAudio) ---------- */
let actx = null;
function tone(freq, dur, type, vol, when){
  if (save.muted) return;
  try{
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime + (when||0);
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type||'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol||0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t+dur+0.02);
  }catch(e){}
}
const sfx = {
  plant(){ tone(300,.08,'triangle',.09); tone(420,.09,'triangle',.08,.05); },
  shoot(){ tone(520,.05,'square',.04); },
  hit(){ tone(240,.06,'sine',.07); },
  splat(n){ for(let i=0;i<Math.min(n||1,4);i++) tone(170+i*60,.14,'sine',.1,i*0.05); },
  dew(){ tone(760,.08,'sine',.08); tone(1020,.1,'sine',.07,.06); },
  boom(){ tone(90,.3,'sawtooth',.12); tone(60,.4,'sine',.1,.05); },
  spray(){ [880,1100,990].forEach((f,i)=>tone(f,.09,'sine',.06,i*.05)); },
  eat(){ tone(140,.12,'sawtooth',.05); },
  bad(){ tone(220,.14,'sawtooth',.07); tone(180,.18,'sawtooth',.06,.07); },
  win(){ [523,659,784,1047].forEach((f,i)=>tone(f,.22,'triangle',.11,i*0.12)); },
  lose(){ [330,262,196,147].forEach((f,i)=>tone(f,.25,'sawtooth',.07,i*0.13)); },
  groan(){ tone(72,.5,'sawtooth',.12); tone(56,.7,'sawtooth',.1,.2); tone(90,.45,'sawtooth',.08,.5); },
};
/* Voix de synthèse (API locale du navigateur : aucun fichier, aucun réseau) */
function voice(text, pitch){
  if (save.muted) return;
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.lang='fr-FR'; u.rate=0.95; u.pitch=pitch===undefined?1:pitch;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }catch(e){}
}

/* ======================================================
   Assets image (embarqués dans le ZIP — aucun réseau).
   Chaque sprite a un repli vectoriel si son PNG manque.
   ====================================================== */
const IMG = {};
const IMG_NAMES = [
  'plant_fraisoleil','plant_cracheur','plant_coco','plant_givree','plant_bombe',
  'proj_pepin','drop','arrosoir','pelle',
  'z_pomme','z_orange','z_citron','z_pasteque','z_raisin','z_baron',
  'fx_spore','fx_splat','panneau','logo','bg0',
];
function loadImages(done){
  let left = IMG_NAMES.length;
  const end = ()=>{ if (--left===0) done(); };
  for (const n of IMG_NAMES){
    const im = new Image();
    im.onload = ()=>{ IMG[n]=im; end(); };
    im.onerror = end;
    im.src = 'src/assets/'+n+(n.startsWith('bg')?'.jpg':'.png');
  }
}
/* repli vectoriel : pastille colorée + petit visage */
const FB = {
  plant_fraisoleil:'#ff5d7a', plant_cracheur:'#e8384f', plant_coco:'#a07248',
  plant_givree:'#5a8fe8', plant_bombe:'#5e2c52', proj_pepin:'#8a6240',
  drop:'#6fc3ff', arrosoir:'#9fd8c0', pelle:'#c9a36a',
  z_pomme:'#9bbf6a', z_orange:'#cf9a3f', z_citron:'#cfc24f',
  z_pasteque:'#6a9a5f', z_raisin:'#9a7fb5', z_baron:'#8a8a4f',
  fx_spore:'#c8a8d8', fx_splat:'#9bb55a', panneau:'#b98a56', logo:'#ffb3cf',
};
function drawSprite(g, key, x, y, s, rot){
  const im = IMG[key];
  g.save(); g.translate(x,y); if (rot) g.rotate(rot);
  if (im) g.drawImage(im, -s/2, -s/2, s, s);
  else {
    g.fillStyle = FB[key] || '#ccc';
    g.beginPath(); g.arc(0,0,s*0.42,0,7); g.fill();
    g.fillStyle = '#47283a';
    g.beginPath(); g.arc(-s*0.13,-s*0.05,s*0.05,0,7); g.arc(s*0.13,-s*0.05,s*0.05,0,7); g.fill();
  }
  g.restore();
}

/* ---------- DOM ---------- */
const $ = id => document.getElementById(id);
const homeEl=$('home'), gameEl=$('game'), cv=$('cv'), ctx=cv.getContext('2d');
const ovPause=$('ovPause'), ovWin=$('ovWin'), ovLose=$('ovLose'), ovLevel=$('ovLevel');

/* ---------- État ---------- */
let state='home';            // home | playing | paused | won | lost
let levelIndex=0, levelT=0, score=0, dew=0, plantsLost=0;
let grid=[], zombies=[], bullets=[], drops=[], sprays=[], splats=[], particles=[], popups=[], rings=[];
let arro=[], queue=[], totalSpawn=0, spawnedN=0, waveN=0, waveI=0;
let selected=null, pelleMode=false, cdLeft={};
let rafId=0, lastT=0, skyT=7, shake=0, cardSync=0;
let tuto=null, finalShown=false, cineTimer=0, unlockThen=null;

/* ---------- Tutoriel : scénario du niveau démo ---------- */
const TUTO = [
 {msg:'Bienvenue dans le verger ! 🍒 Les zombifruits arrivent par le HAUT et descendent vers tes arrosoirs. (touche cette bulle pour continuer)', tap:true},
 {msg:'Commence par l’économie : touche la carte Fraisoleil 🍓 en bas de l’écran.', card:'fraisoleil'},
 {msg:'Maintenant, plante-le dans la case qui clignote !', place:['fraisoleil',2,5]},
 {msg:'Bravo ! Le Fraisoleil fabrique des gouttes de rosée 💧. Touche une goutte pour la ramasser.', collect:true},
 {msg:'Continue à ramasser la rosée jusqu’à 100 💧 : il en faut pour ton tireur.', dew:100},
 {msg:'Touche la carte Cracheur 🍒 : c’est lui qui tire des pépins.', card:'cracheur'},
 {msg:'Place-le AU-DESSUS du Fraisoleil, dans la case qui clignote : il protège toute sa colonne.', place:['cracheur',2,3]},
 {msg:'Un zombifruit attaque ta colonne ! Regarde ton Cracheur l’arroser de pépins… 🧟', spawn:['pomme',2], waitClear:true},
 {msg:'Dernier secret : si un zombifruit te dépasse, l’arrosoir de la colonne le stoppe — une seule fois ! Regarde à droite.', spawnLow:['citron',4], waitClear:true},
 {msg:'Parfait, tu sais tout ! Défends le Verger Enchanté ! 🍒⭐ (touche pour terminer)', tap:true, end:true},
];
function advanceTuto(){
  tuto.i++;
  const st=TUTO[tuto.i];
  if (!st) return;
  if (st.spawn) spawnZombie({type:st.spawn[0], lane:st.spawn[1]});
  if (st.spawnLow){
    spawnZombie({type:st.spawnLow[0], lane:st.spawnLow[1]});
    zombies[zombies.length-1].y = gridBot - ch*1.15;
  }
  $('tutoText').textContent=st.msg;
  syncCards();
}

/* ---------- Géométrie ---------- */
let W=0,H=0,dpr=1,cw=60,ch=66,boardL=0,gridTop=10,gridBot=0,arroH=46;
function resize(){
  const rect = cv.getBoundingClientRect();
  if (rect.width<10 || rect.height<10) return;
  dpr = Math.min(window.devicePixelRatio||1, 2.5);
  W = rect.width; H = rect.height;
  cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  cw = Math.min((W-12)/COLS, 96);
  boardL = (W - cw*COLS)/2;
  arroH = Math.min(cw*0.62, 54);
  gridTop = 10;
  ch = Math.min((H - gridTop - arroH - 12)/ROWS, cw*1.12);
  gridBot = gridTop + ROWS*ch;
}
const cellX = c => boardL + c*cw + cw/2;
const cellY = r => gridTop + r*ch + ch/2;
const rowAt = y => Math.floor((y - gridTop)/ch);
const colAt = x => Math.floor((x - boardL)/cw);

/* ---------- Fond du monde ---------- */
let bgImgOn=false;
function applyWorldBg(){
  const im = IMG.bg0;
  bgImgOn = !!im;
  cv.style.background = im ? `url("${im.src}") center/cover no-repeat` : '';
}

/* ---------- Niveau ---------- */
function startLevel(i){
  levelIndex=i; const L=LEVELS[i];
  levelT=0; score=0; dew=L.dew; plantsLost=0;
  grid = Array.from({length:ROWS},()=>new Array(COLS).fill(null));
  zombies=[]; bullets=[]; drops=[]; sprays=[]; splats=[]; particles=[]; popups=[]; rings=[];
  arro = new Array(COLS).fill(true);
  selected=null; pelleMode=false; cdLeft={}; shake=0; skyT=6;
  finalShown=false; clearTimeout(cineTimer); $('ovCine').hidden=true;
  // tutoriel (niveau démo) : scénario guidé, pas de pluie de rosée automatique
  tuto = L.tuto ? {i:-1} : null;
  $('tutoBubble').hidden = !tuto;
  if (tuto){
    skyT = 1e9;
    if (IMG.plant_cracheur) { $('tutoFace').src=IMG.plant_cracheur.src; }
  }
  // file d'apparition : chaque groupe du script est étalé sur des colonnes aléatoires
  queue=[]; waveN=L.script.length; waveI=0;
  L.script.forEach(([t,n,...types],gi)=>{
    for (let k=0;k<n;k++){
      queue.push({t:t + k*1.6 + Math.random()*0.8, type:types[Math.random()*types.length|0],
                  lane:Math.random()*COLS|0, g:gi});
    }
  });
  queue.sort((a,b)=>a.t-b.t);
  totalSpawn=queue.length; spawnedN=0;
  $('menu').hidden=true; homeEl.hidden=true; gameEl.hidden=false;
  ovPause.hidden=ovWin.hidden=ovLose.hidden=ovLevel.hidden=true;
  applyWorldBg();
  resize();
  buildCards();
  syncHud();
  state='playing'; startLoop();
  if (tuto) advanceTuto();   // après resize : les cases ciblées existent
}

/* ---------- Plantation ---------- */
function placePlant(type, c, r){
  const P=PLANTS[type];
  if (!P || grid[r][c] || dew<P.cost || (cdLeft[type]||0)>0) return false;
  if (tuto){
    const st=TUTO[tuto.i];
    if (!st || !st.place || type!==st.place[0] || c!==st.place[1] || r!==st.place[2]) return false;
  }
  dew -= P.cost;
  grid[r][c] = {type, hp:P.hp, maxHp:P.hp, shootT:1+Math.random()*0.5,
                prodT: tuto ? 2.2 : 5+Math.random()*2,
                fuse: type==='bombe' ? 1.1 : 0, bob:Math.random()*6};
  cdLeft[type]=P.cd;
  sfx.plant(); syncHud();
  if (tuto && TUTO[tuto.i].place) advanceTuto();
  return true;
}
function removePlant(c, r){
  if (!grid[r][c]) return;
  grid[r][c]=null; sfx.eat(); syncHud();
}
function spawnZombie(q){
  const def=ZOMBIES[q.type];
  zombies.push({type:q.type, def, lane:q.lane, y:-ch*0.4, hp:def.hp, max:def.hp, slow:0, wob:Math.random()*6});
  spawnedN++;
  if (q.g!==undefined && q.g>waveI){ waveI=q.g; }
  if (q.g===waveN-1 && !finalShown){
    finalShown=true;
    banner('🧟 Vague finale !'); sfx.bad(); sfx.groan();
    voice('Zombie attaque !', 0.6);
  }
  if (def.boss && state==='playing') startCine(zombies[zombies.length-1]);
}

/* ---------- Cinématique d'entrée de boss ---------- */
function startCine(z){
  state='cine';                       // la boucle s'arrête, les CSS animent la scène
  try{ if (IMG[z.def.img]) $('cineImg').src=IMG[z.def.img].src; }catch(e){}
  $('cineName').textContent=z.def.name;
  $('cineText').textContent=CINE_LINES[z.type] || 'GRRRAAAH !';
  $('ovCine').hidden=false;
  sfx.groan();
  voice(z.def.name + ' attaque !', 0.5);
  cineTimer=setTimeout(endCine, 4500);
}
function endCine(){
  if (state!=='cine') return;
  clearTimeout(cineTimer);
  $('ovCine').hidden=true;
  state='playing';
  if (document.hidden){ pauseGame(); return; }   // contrat de pause
  startLoop();
}
$('ovCine').addEventListener('pointerdown', endCine);

/* ---------- Boucle ---------- */
function startLoop(){
  lastT = performance.now();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(tick);
}
function tick(now){
  const dt = Math.min((now-lastT)/1000, 0.05); lastT=now;
  if (state==='playing') update(dt);
  render(now/1000);
  if (state==='playing' || state==='won' || state==='lost') rafId=requestAnimationFrame(tick);
}

function update(dt){
  levelT += dt;
  // tutoriel : étapes qui se valident toutes seules
  if (tuto){
    const st=TUTO[tuto.i];
    if (st && st.dew && dew>=st.dew) advanceTuto();
    else if (st && st.waitClear && !zombies.length) advanceTuto();
  }
  // apparitions
  while (queue.length && queue[0].t<=levelT) spawnZombie(queue.shift());
  // recharges de cartes
  for (const k in cdLeft) cdLeft[k]=Math.max(0, cdLeft[k]-dt);
  // rosée du ciel
  skyT -= dt;
  if (skyT<=0){
    skyT = 8.5 + Math.random()*3;
    const lane=Math.random()*COLS|0;
    drops.push({x:cellX(lane), y:-20, vy:60+Math.random()*30,
                landY:cellY(Math.random()*(ROWS-1)|0), life:9, val:25});
  }
  // plantes
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
    const p=grid[r][c];
    if (!p) continue;
    const P=PLANTS[p.type];
    if (p.type==='bombe'){
      p.fuse -= dt;
      if (p.fuse<=0){
        grid[r][c]=null;
        const bx=cellX(c), by=cellY(r);
        rings.push({x:bx,y:by,t:.45,max:.45,col:'#ff6b81'});
        for (let i=0;i<14;i++){
          const a=Math.random()*7, sp=120+Math.random()*260;
          particles.push({x:bx,y:by,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-80,life:.5,max:.5,col:i%2?'#ffbe2e':'#5e2c52',r:3+Math.random()*3});
        }
        shake=Math.min(9,shake+6); sfx.boom();
        for (const z of zombies){
          const d=Math.hypot(cellX(z.lane)-bx, z.y-by);
          if (d < cw*1.75) z.hp -= 650;
        }
        cullZombies();
      }
      continue;
    }
    if (p.type==='fraisoleil'){
      p.prodT -= dt;
      if (p.prodT<=0){
        p.prodT = tuto ? 3 : 8;
        drops.push({x:cellX(c)+ (Math.random()*0.5-0.25)*cw, y:cellY(r)-ch*0.3, vy:40,
                    landY:cellY(r)+ch*0.22, life:9, val: tuto ? 50 : 25});
      }
    }
    if (p.type==='cracheur' || p.type==='givree'){
      p.shootT -= dt;
      if (p.shootT<=0){
        const target = zombies.some(z=>z.lane===c && z.y < cellY(r)+ch*0.2 && z.y > -ch);
        if (target){
          p.shootT = p.type==='givree' ? 1.8 : 1.4;
          bullets.push({lane:c, y:cellY(r)-ch*0.35, vy:-7*ch,
                        dmg:p.type==='givree'?12:20, frozen:p.type==='givree'});
          sfx.shoot();
        } else p.shootT = 0.15;
      }
    }
  }
  // pépins
  for (let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];
    b.y += b.vy*dt;
    if (b.y < -ch){ bullets.splice(i,1); continue; }
    let best=null;
    for (const z of zombies){
      if (z.lane!==b.lane) continue;
      if (Math.abs(z.y-b.y) < ch*0.42 && (!best || z.y>best.y)) best=z;
    }
    if (best){
      best.hp -= b.dmg;
      if (b.frozen) best.slow = 4;
      particles.push({x:cellX(b.lane),y:b.y,vx:0,vy:-40,life:.25,max:.25,col:b.frozen?'#9fd0ff':'#c9a36a',r:3});
      bullets.splice(i,1); sfx.hit();
    }
  }
  cullZombies();
  // zombifruits
  for (const z of zombies){
    z.slow = Math.max(0, z.slow-dt);
    z.wob += dt*(z.slow>0?3:6);
    const front = rowAt(z.y + ch*0.33);
    const p = (front>=0 && front<ROWS) ? grid[front][z.lane] : null;
    if (p && z.y + ch*0.33 > cellY(front)-ch*0.28){
      p.hp -= z.def.dmg*dt;                   // il croque la plante
      if (Math.random()<dt*2) sfx.eat();
      if (p.hp<=0){
        grid[front][z.lane]=null;
        if (p.type!=='bombe') plantsLost++;
        splats.push({x:cellX(z.lane), y:cellY(front), t:1.2, img:'fx_spore', s:cw*0.8});
      }
    } else {
      z.y += z.def.speed*ch*dt*(z.slow>0?0.45:1);
    }
    // bas du verger : arrosoir de secours ou défaite
    if (z.y > gridBot + arroH*0.25){
      if (arro[z.lane]){
        arro[z.lane]=false;
        sprays.push({lane:z.lane, t:.8, max:.8});
        sfx.spray();
        for (const zz of zombies) if (zz.lane===z.lane){ zz.hp=-1; killFx(zz); }
        cullZombies();
        popup(cellX(z.lane), gridBot-20, 'Splash !');
      } else { loseLevel(); return; }
    }
  }
  // gouttes de rosée
  for (let i=drops.length-1;i>=0;i--){
    const d=drops[i];
    if (d.y < d.landY) d.y = Math.min(d.landY, d.y + d.vy*dt);
    else d.life -= dt;
    if (d.life<=0) drops.splice(i,1);
  }
  // effets
  for (let i=sprays.length-1;i>=0;i--){ sprays[i].t-=dt; if (sprays[i].t<=0) sprays.splice(i,1); }
  for (let i=splats.length-1;i>=0;i--){ splats[i].t-=dt; if (splats[i].t<=0) splats.splice(i,1); }
  for (let i=rings.length-1;i>=0;i--){ rings[i].t-=dt; if (rings[i].t<=0) rings.splice(i,1); }
  for (let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.vy += 500*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;
    if (p.life<=0) particles.splice(i,1);
  }
  for (let i=popups.length-1;i>=0;i--){
    popups[i].y -= 50*dt; popups[i].life -= dt*0.9;
    if (popups[i].life<=0) popups.splice(i,1);
  }
  shake = Math.max(0, shake - shake*8*dt - 0.4*dt);
  // victoire (le tutoriel se termine par sa dernière bulle, pas ici)
  if (!tuto && !queue.length && !zombies.length && spawnedN>0) { finishWin(); return; }
  // rafraîchit les cartes ~5 fois/s
  cardSync -= dt;
  if (cardSync<=0){ cardSync=0.2; syncCards(); }
}
function killFx(z){
  splats.push({x:cellX(z.lane), y:z.y, t:1.4, img:'fx_splat', s:cw*0.95});
  score += z.def.pts;
  popup(cellX(z.lane), z.y, '+'+z.def.pts);
}
function cullZombies(){
  let n=0;
  for (let i=zombies.length-1;i>=0;i--){
    if (zombies[i].hp<=0){
      if (zombies[i].hp>-1) killFx(zombies[i]); // -1 : déjà traité par l'arrosoir
      zombies.splice(i,1); n++;
    }
  }
  if (n) sfx.splat(n);
}

/* ---------- Fin de niveau ---------- */
function starsFor(){
  return 1 + (arro.every(a=>a)?1:0) + (plantsLost===0?1:0);
}
function finishWin(){
  state='won';
  if (tuto){ tuto=null; $('tutoBubble').hidden=true; }
  score += 500;
  const st = LEVELS[levelIndex].tuto ? 3 : starsFor(), i=levelIndex;
  save.stars[i]=Math.max(save.stars[i]||0, st);
  if (score>(save.best[i]||0)) save.best[i]=score;
  save.unlocked=Math.max(save.unlocked, Math.min(i+2, LEVELS.length));
  Storage.save(save);
  $('winStars').innerHTML=[1,2,3].map(n=>`<span class="${n<=st?'on':'off'}">★</span>`).join('');
  $('winTitle').textContent = LEVELS[i].tuto ? 'Leçon terminée !' :
                              i===LEVELS.length-1 ? 'Le Baron est compoté !' :
                              LEVELS[i].boss ? 'Boss vaincu !' : 'Verger défendu !';
  $('winScore').textContent=score;
  $('winBest').textContent='Record : '+save.best[i];
  $('btnNext').hidden = i+1>=LEVELS.length;
  sfx.win();
  setTimeout(()=>{ if(state==='won') ovWin.hidden=false; }, 600);
}
function loseLevel(){
  state='lost';
  Storage.save(save);
  $('loseScore').textContent=score;
  sfx.lose();
  setTimeout(()=>{ if(state==='lost') ovLose.hidden=false; }, 500);
}

/* ---------- Pause (contrat Playables : tout s'arrête) ---------- */
function pauseGame(){
  if (state!=='playing') return;
  state='paused';
  cancelAnimationFrame(rafId); rafId=0;
  try{ speechSynthesis.cancel(); }catch(e){}
  ovPause.hidden=false;
}
function resumeGame(){
  if (state!=='paused') return;
  state='playing'; ovPause.hidden=true;
  startLoop();
}
window.GameApp = { pause:pauseGame, resume:resumeGame };
document.addEventListener('visibilitychange', ()=>{ if (document.hidden) pauseGame(); });

/* ---------- Rendu ---------- */
function popup(x,y,text){ popups.push({x,y,text,life:1}); }
function banner(txt){
  const el=$('banner');
  el.textContent=txt;
  el.classList.remove('show'); void el.offsetWidth;
  el.classList.add('show');
}
function render(tNow){
  ctx.clearRect(0,0,W,H);
  if (bgImgOn){ ctx.fillStyle='rgba(255,255,255,.2)'; ctx.fillRect(0,0,W,H); }
  ctx.save();
  if (shake>0.15) ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake);

  // sillons : colonnes alternées
  for (let c=0;c<COLS;c++){
    ctx.fillStyle = c%2 ? 'rgba(130,190,110,.14)' : 'rgba(255,255,255,.14)';
    ctx.beginPath(); ctx.roundRect(boardL+c*cw+1, gridTop, cw-2, ROWS*ch, 10); ctx.fill();
  }
  // ligne de danger + arrosoirs
  ctx.setLineDash([8,8]); ctx.lineWidth=2.5; ctx.strokeStyle='rgba(255,90,130,.55)';
  ctx.beginPath(); ctx.moveTo(boardL+4,gridBot+2); ctx.lineTo(boardL+COLS*cw-4,gridBot+2); ctx.stroke();
  ctx.setLineDash([]);
  for (let c=0;c<COLS;c++){
    if (arro[c]) drawSprite(ctx,'arrosoir',cellX(c),gridBot+arroH*0.55,arroH*1.05);
  }
  // taches
  for (const s of splats){
    ctx.globalAlpha=Math.min(1,s.t);
    drawSprite(ctx,s.img,s.x,s.y,s.s);
  }
  ctx.globalAlpha=1;
  // plantes
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++){
    const p=grid[r][c];
    if (!p) continue;
    const bob=Math.sin(tNow*2.4+p.bob)*2;
    let s=cw*0.92;
    if (p.type==='bombe'){ s *= 1+0.12*Math.sin(tNow*18); } // la mèche grésille
    drawSprite(ctx,PLANTS[p.type].img,cellX(c),cellY(r)+bob,s);
    if (p.hp<p.maxHp && p.type!=='bombe'){
      const w=cw*0.6, pct=Math.max(0,p.hp/p.maxHp);
      ctx.fillStyle='rgba(255,255,255,.8)';
      ctx.beginPath(); ctx.roundRect(cellX(c)-w/2,cellY(r)-ch*0.46,w,5,3); ctx.fill();
      ctx.fillStyle=pct>0.4?'#57c878':'#ff5d6e';
      ctx.beginPath(); ctx.roundRect(cellX(c)-w/2,cellY(r)-ch*0.46,w*pct,5,3); ctx.fill();
    }
  }
  // pépins
  for (const b of bullets){
    if (b.frozen){
      ctx.fillStyle='rgba(140,200,255,.5)';
      ctx.beginPath(); ctx.arc(cellX(b.lane),b.y,cw*0.16,0,7); ctx.fill();
    }
    drawSprite(ctx,'proj_pepin',cellX(b.lane),b.y,cw*0.26,tNow*9%6.28);
  }
  // zombifruits (du plus haut au plus bas)
  const zs=[...zombies].sort((a,b)=>a.y-b.y);
  for (const z of zs){
    const rot=Math.sin(z.wob)*0.07;
    const s=cw*(z.def.boss?1.45:1.08);
    drawSprite(ctx,z.def.img,cellX(z.lane),z.y,s,rot);
    if (z.slow>0){
      ctx.fillStyle='rgba(120,190,255,.3)';
      ctx.beginPath(); ctx.arc(cellX(z.lane),z.y,s*0.5,0,7); ctx.fill();
    }
    if (z.def.boss || z.hp<z.max){
      const w=s*0.7, pct=Math.max(0,z.hp/z.max);
      ctx.fillStyle='rgba(255,255,255,.8)';
      ctx.beginPath(); ctx.roundRect(cellX(z.lane)-w/2,z.y-s*0.62,w,5,3); ctx.fill();
      ctx.fillStyle=pct>0.4?'#8fae5a':'#ff5d6e';
      ctx.beginPath(); ctx.roundRect(cellX(z.lane)-w/2,z.y-s*0.62,w*pct,5,3); ctx.fill();
    }
  }
  // jets d'arrosoir
  for (const s of sprays){
    const k=1-s.t/s.max;
    ctx.globalAlpha=1-k;
    ctx.fillStyle='#8fd0ff';
    for (let i=0;i<10;i++){
      const yy=gridBot - k*ROWS*ch*( (i%5+1)/5 ) - (i*37%40);
      ctx.beginPath(); ctx.arc(cellX(s.lane)+Math.sin(i*2.1)*cw*0.3, yy, 4, 0, 7); ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  // explosions
  for (const r of rings){
    const k=1-r.t/r.max;
    ctx.globalAlpha=r.t/r.max;
    ctx.beginPath(); ctx.arc(r.x,r.y,cw*0.5+k*cw*1.8,0,7);
    ctx.lineWidth=4*(1-k)+1; ctx.strokeStyle=r.col; ctx.stroke();
    ctx.globalAlpha=1;
  }
  for (const p of particles){
    ctx.globalAlpha=Math.max(0,p.life/p.max);
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fillStyle=p.col; ctx.fill();
  }
  ctx.globalAlpha=1;
  // rosée (au-dessus de tout : facile à toucher)
  for (const d of drops){
    const fade=Math.min(1,d.life/1.2);
    ctx.globalAlpha=fade;
    drawSprite(ctx,'drop',d.x,d.y+Math.sin(tNow*3+d.landY)*2,cw*0.48);
    ctx.globalAlpha=1;
  }
  // tutoriel : la case cible clignote
  if (tuto && TUTO[tuto.i] && TUTO[tuto.i].place){
    const [,tc,tr]=TUTO[tuto.i].place;
    const k=0.5+0.5*Math.sin(tNow*5);
    ctx.strokeStyle=`rgba(255,110,165,${0.4+0.55*k})`; ctx.lineWidth=4;
    ctx.beginPath(); ctx.roundRect(boardL+tc*cw+3,gridTop+tr*ch+3,cw-6,ch-6,12); ctx.stroke();
  }
  // sélection : surligne la case visée
  if ((selected||pelleMode) && hoverCell){
    const [hc,hr]=hoverCell;
    ctx.strokeStyle=pelleMode?'rgba(200,120,60,.8)':'rgba(255,110,165,.8)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.roundRect(boardL+hc*cw+3,gridTop+hr*ch+3,cw-6,ch-6,12); ctx.stroke();
  }
  // popups
  ctx.font=`800 ${Math.round(cw*0.3)}px Nunito, sans-serif`;
  ctx.textAlign='center';
  for (const p of popups){
    ctx.globalAlpha=Math.max(0,p.life);
    ctx.lineWidth=4; ctx.strokeStyle='rgba(255,255,255,.9)';
    ctx.strokeText(p.text,p.x,p.y);
    ctx.fillStyle='#ff5d8f';
    ctx.fillText(p.text,p.x,p.y);
  }
  ctx.globalAlpha=1;
  ctx.restore();
}

/* ---------- HUD ---------- */
function syncHud(){
  $('dewNum').textContent=Math.floor(dew);
  $('btnMute').textContent = save.muted ? '🔇' : '🔊';
  const pct = totalSpawn ? Math.round(spawnedN/totalSpawn*100) : 0;
  $('waveFill').style.width=pct+'%';
  $('waveTxt').textContent = (levelIndex+1)+'. '+LEVELS[levelIndex].name;
  syncCards();
}
function buildCards(){
  const bar=$('cardBar');
  bar.textContent='';
  for (const id of LEVELS[levelIndex].cards){
    const P=PLANTS[id];
    const b=document.createElement('button');
    b.className='pcard'; b.dataset.id=id;
    b.title=P.name+' — '+P.desc;
    const im=document.createElement('img');
    im.alt=P.name; if (IMG[P.img]) im.src=IMG[P.img].src;
    const cost=document.createElement('span'); cost.className='pcost'; cost.textContent='💧'+P.cost;
    const cd=document.createElement('div'); cd.className='cd';
    b.append(im,cost,cd);
    b.addEventListener('click',()=>{
      if (state!=='playing') return;
      if (tuto){
        const st=TUTO[tuto.i];
        if (!st || !(st.card===id || (st.place && st.place[0]===id))) return;
      }
      pelleMode=false;
      selected = selected===id ? null : id;
      if (tuto && selected===id && TUTO[tuto.i].card===id) advanceTuto();
      syncCards();
    });
    bar.appendChild(b);
  }
  const pb=document.createElement('button');
  pb.className='pcard'; pb.id='cardPelle'; pb.title='Pelle : retirer une plante';
  const pim=document.createElement('img'); pim.alt='Pelle'; if (IMG.pelle) pim.src=IMG.pelle.src;
  pb.appendChild(pim);
  pb.addEventListener('click',()=>{
    if (state!=='playing' || tuto) return;
    selected=null; pelleMode=!pelleMode; syncCards();
  });
  bar.appendChild(pb);
}
function syncCards(){
  document.querySelectorAll('#cardBar .pcard').forEach(b=>{
    const id=b.dataset.id;
    if (!id){ b.classList.toggle('sel', pelleMode); return; }
    const P=PLANTS[id], left=cdLeft[id]||0;
    const st = tuto && TUTO[tuto.i];
    b.classList.toggle('sel', selected===id);
    b.classList.toggle('poor', dew<P.cost);
    b.classList.toggle('glow', !!(st && (st.card===id || (st.place && st.place[0]===id && selected!==id))));
    b.querySelector('.cd').style.height = left>0 ? (left/P.cd*100)+'%' : '0%';
  });
  $('dewNum').textContent=Math.floor(dew);
}

/* ---------- Entrées ---------- */
let hoverCell=null;
cv.addEventListener('pointermove', e=>{
  const r=cv.getBoundingClientRect();
  const x=e.clientX-r.left, y=e.clientY-r.top;
  const c=colAt(x), rr=rowAt(y);
  hoverCell = (c>=0&&c<COLS&&rr>=0&&rr<ROWS) ? [c,rr] : null;
});
cv.addEventListener('pointerdown', e=>{
  if (state!=='playing') return;
  const rect=cv.getBoundingClientRect();
  const x=e.clientX-rect.left, y=e.clientY-rect.top;
  // 1. ramasser une goutte
  for (let i=drops.length-1;i>=0;i--){
    const d=drops[i];
    if ((d.x-x)**2+(d.y-y)**2 < (cw*0.45)**2){
      dew += d.val; drops.splice(i,1);
      popup(d.x,d.y,'+'+d.val+' 💧'); sfx.dew(); syncCards();
      if (tuto && TUTO[tuto.i] && TUTO[tuto.i].collect) advanceTuto();
      return;
    }
  }
  // 2. pelle ou plantation
  const c=colAt(x), r=rowAt(y);
  if (c<0||c>=COLS||r<0||r>=ROWS) return;
  if (pelleMode){ removePlant(c,r); pelleMode=false; syncCards(); return; }
  if (selected && placePlant(selected,c,r)){ selected=null; syncCards(); }
});

/* ---------- Boutons ---------- */
$('btnPause').addEventListener('click', pauseGame);
$('btnResume').addEventListener('click', resumeGame);
$('btnMute').addEventListener('click', ()=>{ save.muted=!save.muted; Storage.save(save); syncHud(); });
function toMenu(){
  state='home'; cancelAnimationFrame(rafId); rafId=0;
  Storage.save(save);
  tuto=null; $('tutoBubble').hidden=true;
  clearTimeout(cineTimer); $('ovCine').hidden=true;
  try{ speechSynthesis.cancel(); }catch(e){}
  gameEl.hidden=true; homeEl.hidden=false;
  ovPause.hidden=ovWin.hidden=ovLose.hidden=true;
  renderHome();
}
for (const id of ['btnMenu','btnMenu1','btnMenu2','btnMenu3']) $(id).addEventListener('click', toMenu);
for (const id of ['btnRestart1','btnRestart2','btnRestart3']) $(id).addEventListener('click', ()=>startLevel(levelIndex));
$('btnNext').addEventListener('click', ()=>{ toMenu(); openLevel(levelIndex+1); });

/* ---------- Menu principal (écran titre) ---------- */
function showMenu(){
  state='home';
  gameEl.hidden=true; homeEl.hidden=true;
  const set=(id,key)=>{ const el=$(id); if (IMG[key]){ el.src=IMG[key].src; el.hidden=false; } };
  set('mcPlant','plant_cracheur'); set('mcZombi','z_pomme'); set('menuLogo','logo');
  const tot=Object.values(save.stars).reduce((a,b)=>a+b,0);
  $('menuStars').innerHTML = tot ? `<span class="on">★</span> ${tot} / ${LEVELS.length*3} étoiles` : 'Défends le Verger Enchanté !';
  $('btnMuteMenu').textContent = save.muted ? '🔇 Son coupé' : '🔊 Son';
  $('menu').hidden=false;
}
$('btnStart').addEventListener('click', ()=>{
  $('menu').hidden=true;
  homeEl.hidden=false;
  renderHome();
});
$('btnMuteMenu').addEventListener('click', ()=>{
  save.muted=!save.muted; Storage.save(save);
  $('btnMuteMenu').textContent = save.muted ? '🔇 Son coupé' : '🔊 Son';
  if (!save.muted) sfx.dew();
});

/* ---------- Accueil : liste des niveaux ---------- */
function starsHtml(n){ return [1,2,3].map(k=>`<span class="${k<=n?'on':'off'}">★</span>`).join(''); }
function renderHome(){
  const list=$('lvlList');
  list.textContent='';
  LEVELS.forEach((L,i)=>{
    const locked=i>=save.unlocked, st=save.stars[i]||0;
    const b=document.createElement('button');
    b.className='lnode'+(L.boss?' boss':'')+(locked?' locked':'');
    const im=document.createElement('img');
    const key = locked ? 'panneau' : L.boss ? 'z_baron' : (['plant_cracheur','z_pomme','z_orange','plant_givree','z_pasteque','z_raisin','fx_spore'][i%7]);
    if (IMG[key]) im.src=IMG[key].src; im.alt='';
    const body=document.createElement('span'); body.className='lbody';
    body.innerHTML=`<span class="lname">${locked?'🔒 ':''}${i+1}. ${L.name}</span>
                    <span class="lstars">${locked?'':starsHtml(st)}</span>`;
    b.append(im,body);
    if (locked) b.disabled=true;
    else b.addEventListener('click',()=>openLevel(i));
    list.appendChild(b);
  });
  const done=Object.keys(save.stars).length;
  $('heroTag').textContent = done ? `🍒 ${done}/${LEVELS.length} niveaux défendus — continue !`
    : 'Le Baron Zombifié attaque le Verger : plante tes fruits et défends chaque rangée !';
}
function openLevel(i){
  if (i>=LEVELS.length) return;
  levelIndex=i;
  const L=LEVELS[i];
  $('plName').textContent=(L.boss?'👑 ':'')+(i+1)+'. '+L.name;
  $('plStory').textContent=L.story;
  $('plStars').innerHTML=starsHtml(save.stars[i]||0);
  $('plBest').innerHTML=save.best[i]?('Record : <b>'+save.best[i]+'</b>'):'Jamais défendu';
  ovLevel.hidden=false;
}
$('btnPlClose').addEventListener('click', ()=>{ ovLevel.hidden=true; });
$('btnPlay').addEventListener('click', ()=>{
  ovLevel.hidden=true;
  const L=LEVELS[levelIndex];
  if (L.unlock && !save.seenU[L.unlock]) showUnlock(L.unlock, ()=>startLevel(levelIndex));
  else startLevel(levelIndex);
});

/* ---------- Bulle du tutoriel ---------- */
$('tutoBubble').addEventListener('click', ()=>{
  if (!tuto || state!=='playing') return;
  const st=TUTO[tuto.i];
  if (!st || !st.tap) return;
  if (st.end){ finishWin(); return; }
  advanceTuto();
});

/* ---------- Aide & déblocages ---------- */
$('btnHelp').addEventListener('click', ()=>{ $('ovHelp').hidden=false; });
$('btnHelpClose').addEventListener('click', ()=>{ $('ovHelp').hidden=true; });
function showUnlock(id, then){
  const P=PLANTS[id], U=UNLOCKS[id];
  if (IMG[P.img]) $('unImg').src=IMG[P.img].src;
  $('unName').textContent=P.name+' · 💧'+P.cost;
  $('unDesc').textContent=U.desc;
  $('unHow').textContent='💡 '+U.how;
  unlockThen=()=>{ save.seenU[id]=1; Storage.save(save); then(); };
  $('ovUnlock').hidden=false;
}
$('btnUnlock').addEventListener('click', ()=>{
  $('ovUnlock').hidden=true;
  const f=unlockThen; unlockThen=null;
  if (f) f();
});

/* ---------- Redimensionnement ---------- */
new ResizeObserver(()=>{ resize(); if(state!=='home') render(performance.now()/1000); }).observe(cv);
window.addEventListener('resize', resize);

/* ---------- Intro « Brainz Studio » ---------- */
function runIntro(done){
  const el=$('intro');
  if (IMG.logo){ $('introLogo').src=IMG.logo.src; $('introLogo').hidden=false; }
  else $('introEmoji').hidden=false;
  let fini=false;
  const end=()=>{
    if (fini) return; fini=true;
    GameApp.skipIntro=null;
    el.classList.add('out');
    setTimeout(()=>{ el.hidden=true; done(); }, 480);
  };
  GameApp.skipIntro=end;        // utilisé par le test de fumée
  el.addEventListener('pointerdown', end, {once:true});
  setTimeout(end, 3000);        // avant la partie : hors contrat de pause
}

/* ---------- Démarrage ---------- */
function boot(){ showMenu(); }
loadImages(()=>{
  if (window.claude?.hot?.data !== undefined && window.claude?.hot?.data !== null){
    $('intro').hidden=true; boot();   // rechargement à chaud : pas d'intro
  } else runIntro(boot);
});
window.claude?.hot?.snapshot?.(()=>({screen:'home'}));
