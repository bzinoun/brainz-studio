'use strict';
/* =========================================================
   Fruit Pop — « Le Verger Enchanté »
   Bubble shooter kawaii : 24 niveaux, 3 mondes, 3 boss,
   tirs spéciaux, super fruits, événements météo.
   Graphismes : sprites PNG embarqués (src/assets/, générés
   par tools/gen-assets.py) avec repli vectoriel Canvas 2D
   si une image manque. Aucun appel réseau.
   Prêt pour YouTube Playables :
   - pause/reprise totales via window.GameApp
     (à brancher sur ytgame.system.onPause / onResume)
   - sauvegarde isolée dans l'objet Storage
     (à remplacer par ytgame.game.saveData / loadData)
   ========================================================= */

const TYPES = [
  {name:'fraise',   c:'#ff4d6d'},
  {name:'citron',   c:'#ffcf2e'},
  {name:'raisin',   c:'#a06ee8'},
  {name:'pasteque', c:'#3fc46c'},
  {name:'orange',   c:'#ff9124'},
  {name:'myrtille', c:'#4e7fe8'},
];
const FACE_DARK = '#47283a';
const SPAD = 1.18;
const COLS = 9, SQ3 = Math.sqrt(3);

const WORLDS = [
  {name:'Le Potager',          icon:'🌳'},
  {name:'Les Cimes Givrées',   icon:'❄️'},
  {name:'Les Racines Pourries',icon:'🍂'},
];

/* Grilles : '.' vide · o fruit · W caisse · i gelé · x pourri · c cage ·
   G doré · * étoile · + cœur · p prisme. Rangées 9/8 en alternance. */
const PAL_A=[0,1,4], PAL_B=[0,1,4,3], PAL_C=[0,1,3,5], PAL_D=[0,1,2,3,5], PAL_E=[0,1,2,3,4,5];
const LEVELS = [
 {w:0,name:'Premiers pas',story:'Pépin entre dans le Potager. Vise, relâche… boum !',pal:PAL_A,drop:12,events:[],
  layout:['ooooooooo','oooooooo','ooooooooo','oooooooo']},
 {w:0,name:'La haie',story:'Des trous dans la haie : vise les angles, les rebonds sont tes amis.',pal:PAL_A,drop:11,events:[],
  layout:['ooo...ooo','oo....oo','ooo...ooo','oo....oo','ooo...ooo']},
 {w:0,name:'Caisses !',story:'Des caisses en bois bloquent le passage. Détache-les du plafond pour les faire tomber !',pal:PAL_A,drop:10,events:[],
  layout:['ooooooooo','oWooooWo','ooooooooo','o..WW..o']},
 {w:0,name:'Le coffre doré',story:'Des fruits dorés ! Fais-les exploser pour gagner des pièces.',pal:PAL_A,drop:10,events:['sun'],
  layout:['ooooooooo','oo.GG.oo','ooooooooo','..oooo..','....G....']},
 {w:0,name:'Prisonniers',story:'Des amis en cage ! Une explosion voisine les libère.',pal:PAL_B,drop:10,events:['sun','dew'],
  layout:['ooooooooo','o.cooc.o','ooooooooo','oo.cc.oo']},
 {w:0,name:'Vent d’été',story:'Le vent se lève et courbe tes tirs… anticipe !',pal:PAL_B,drop:9,events:['wind','sun'],
  layout:['oo.ooo.oo','oooooooo','oo.ooo.oo','.oo.oo.o']},
 {w:0,name:'Grand ménage',story:'Fruit étoile en vue : il fait exploser toute sa couleur !',pal:PAL_B,drop:9,events:['dew','wasp','sun'],
  layout:['ooooooooo','oooo*ooo','ooooooooo','oo+oo+oo','ooo...ooo']},
 {w:0,name:'La Limace Royale',story:'Boss ! Explose des grappes accrochées aux lianes du haut pour la blesser.',pal:PAL_B,drop:99,events:['sun'],boss:'slug',
  layout:['ooooooooo','oooooooo','ooooooooo']},
 {w:1,name:'Givre léger',story:'Les fruits gelés demandent deux coups : brise la glace, puis explose-les.',pal:PAL_C,drop:10,events:['sun'],
  layout:['ooioooioo','oooooooo','oiooooioo','oooooooo']},
 {w:1,name:'Mur de glace',story:'Un mur de glace entier… ouvre une brèche !',pal:PAL_C,drop:9,events:['dew','sun'],
  layout:['ooooooooo','iiiiiiii','ooooooooo','..oooo..']},
 {w:1,name:'Chutes de neige',story:'L’averse fait descendre le plafond deux fois plus vite. Reste calme.',pal:PAL_C,drop:9,events:['rain','sun','dew'],
  layout:['oioioioio','oooooooo','..ioooi..','.oo..oo.']},
 {w:1,name:'La volière',story:'Des cages suspendues dans le vent. Les oiseaux comptent sur toi !',pal:PAL_C,drop:9,events:['wind','wasp','sun'],
  layout:['oo.oco.oo','ocooooco','ooooooooo','..c..c..']},
 {w:1,name:'Nuit polaire',story:'La nuit tombe : on ne voit plus que le bout de sa visée…',pal:PAL_D,drop:8,events:['night','dew'],
  layout:['ooooooooo','oiooooio','oo*oo*ooo','oooooooo']},
 {w:1,name:'Cœur du glacier',story:'Un cœur bat sous la glace. Libère-le pour gagner des tirs !',pal:PAL_D,drop:8,events:['rain','toucan'],
  layout:['ooiiiiioo','oiio+oii','oo.iii.oo','.oo..oo.']},
 {w:1,name:'Tempête',story:'Vent, pluie, guêpes… tout le monde s’en mêle !',pal:PAL_D,drop:7,events:['wind','rain','wasp','sun'],
  layout:['ooooooooo','oiooooio','ooooooooo','oooioioo','oo.ooo.oo','.o.oo.o.']},
 {w:1,name:'Le Corbeau Givré',story:'Boss ! Il gèle tes fruits et souffle le blizzard. Vise les lianes !',pal:PAL_D,drop:99,events:['sun','dew'],boss:'crow',
  layout:['ooooooooo','oooooooo','ooooooooo']},
 {w:2,name:'Racines moisies',story:'Des fruits pourris ne se matchent plus. Purifie-les d’une explosion voisine !',pal:PAL_E,drop:8,events:['sun'],
  layout:['ooxooxooo','oooooooo','oxooooxoo','oooooooo']},
 {w:2,name:'Marais gluant',story:'Caisses et moisissure… le Toucan vient donner un coup d’aile.',pal:PAL_E,drop:8,events:['toucan','basket'],
  layout:['oooWoWooo','oxooooxo','ooooooooo','oWxooxWo']},
 {w:2,name:'Brume noire',story:'La brume du Baron cache tout. Garde ton sang-froid.',pal:PAL_E,drop:7,events:['night','wasp','dew'],
  layout:['oxooxooxo','oooooooo','oo.xox.oo','.oo..oo.']},
 {w:2,name:'Le verger perdu',story:'Les derniers amis sont en cage, gardés par la pourriture.',pal:PAL_E,drop:7,events:['sun','toucan'],
  layout:['ooGooooGo','ocoxxoco','ooooooooo','oo.cG.oo']},
 {w:2,name:'Guêpes !',story:'Un nid de guêpes voleuses. Surveille ton fruit !',pal:PAL_E,drop:6,events:['wasp','rain','sun'],
  layout:['ooooooooo','oooxxooo','ooooooooo','oooooooo','oo*ooo*oo']},
 {w:2,name:'Prismes anciens',story:'Les prismes se matchent avec toutes les couleurs. Magique !',pal:PAL_E,drop:6,events:['basket','dew'],
  layout:['oooopoooo','oxooooxo','oopooopoo','oooooooo']},
 {w:2,name:'L’antre',story:'Dernière ligne droite avant le trône du Baron. Tout peut arriver.',pal:PAL_E,drop:5,events:['night','wind','rain','wasp','sun','dew'],
  layout:['oxoiioxoo','oWooooWo','oooxxoooo','oiooooio','oo.ooo.oo']},
 {w:2,name:'Le Baron Moisi',story:'Boss final ! Trois phases, zéro pitié. Libère le Verger !',pal:PAL_E,drop:99,events:['sun','dew','basket'],boss:'baron',
  layout:['ooooooooo','oooooooo','ooooooooo','oooooooo']},
];

const BOSSES = {
  slug: {name:'Limace Royale', hp:24, every:5, atks:['slime','row']},
  crow: {name:'Corbeau Givré', hp:32, every:5, atks:['freeze','wind','row']},
  baron:{name:'Baron Moisi',   hp:46, every:4, atks:[]},
};
const ATK_INFO = {
  slime:{icon:'🟢',txt:'Bave moisie !'},
  freeze:{icon:'🧊',txt:'Souffle glacé !'},
  wind:{icon:'💨',txt:'Battement d’ailes !'},
  row:{icon:'⬇️',txt:'Renforts !'},
  night:{icon:'🌙',txt:'Brume noire !'},
};

const EVENTS = {
  wind:  {icon:'💨',name:'Coup de vent', bad:true, dur:3},
  rain:  {icon:'🌧️',name:'Averse',       bad:true, dur:5},
  night: {icon:'🌙',name:'Nuit noire',   bad:true, dur:4},
  wasp:  {icon:'🐝',name:'Guêpe voleuse',bad:true, dur:0},
  sun:   {icon:'☀️',name:'Rayon de soleil',bad:false,dur:6},
  toucan:{icon:'🐦',name:'Toucan ami',   bad:false,dur:0},
  dew:   {icon:'💧',name:'Rosée magique',bad:false,dur:3},
  basket:{icon:'🧺',name:'Panier surprise',bad:false,dur:0},
};

const SPECIALS = {
  bomb:   {icon:'💣',name:'Bombe cerise',   desc:'Explose tout dans un large rayon', cost:12},
  bolt:   {icon:'⚡',name:'Citron éclair',  desc:'Foudroie toute une ligne',          cost:10},
  pierce: {icon:'🍍',name:'Ananas perforant',desc:'Transperce tout sur son passage',  cost:10},
  rainbow:{icon:'🌈',name:'Tir arc-en-ciel', desc:'Se matche avec n’importe quelle couleur', cost:8},
};

const DIALOGS = {
  w1:[['pepin','Le Baron Moisi a ensorcelé le Verger Enchanté ! Mes amis sont capturés…'],
      ['pepin','À moi de jouer ! Vise avec le doigt, relâche pour tirer. 3 fruits pareils : BOUM !']],
  b1pre:[['slug','Glllurp… le Potager est à moiii…'],
         ['pepin','Beurk ! Rends-nous le Potager, grosse limace !'],
         ['pepin','Astuce : les grappes accrochées aux lianes du haut la blessent quand elles explosent !']],
  b1post:[['slug','Glllurp… trop… pétillant…'],
          ['pepin','Et d’une ! Direction les Cimes Givrées ! ❄️']],
  w2:[['pepin','Brrr… Le Corbeau Givré a tout gelé ! Une explosion voisine brise la glace.']],
  b2pre:[['crow','CROÂÂ ! Personne ne passe les Cimes !'],
         ['pepin','On va voir ça, boule de plumes !']],
  b2post:[['crow','croâ… respect…'],
          ['pepin','Plus qu’un ! Le Baron nous attend aux Racines…']],
  w3:[['pepin','Pouah, ça sent le moisi… Une explosion voisine purifie les fruits pourris !']],
  b3pre:[['baron','MWAHAHA ! Mon royaume de moisissure est éternel !'],
         ['pepin','Le verger appartient aux fruits frais. On termine ça !']],
  b3post:[['baron','Nooon… ma jolie pourriture…'],
          ['pepin','On a réussi ! Le Verger Enchanté est libre ! 💖 Merci d’avoir joué !']],
};
const DIALOG_BEFORE = {0:'w1',7:'b1pre',8:'w2',15:'b2pre',16:'w3',23:'b3pre'};
const DIALOG_AFTER  = {7:'b1post',15:'b2post',23:'b3post'};
const CHARS = {
  pepin:{name:'Pépin'}, slug:{name:'Limace Royale'},
  crow:{name:'Corbeau Givré'}, baron:{name:'Baron Moisi'},
};

/* ---------- Sauvegarde (localStorage ici ; ytgame.game.saveData sur Playables) ---------- */
const KEY = 'fruitpop-save-v2';
const Storage = {
  load(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }catch(e){ return {}; } },
  save(d){ try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){} }
};
let save = Object.assign({unlocked:1, best:{}, stars:{}, coins:0, seen:{}, muted:false}, Storage.load());

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
  shoot(){ tone(360, .09, 'triangle', .09); },
  stick(){ tone(200, .07, 'sine', .08); },
  pop(n){ for(let i=0;i<Math.min(n,6);i++) tone(480+i*110, .13, 'sine', .11, i*0.045); },
  fall(){ tone(240, .18, 'sawtooth', .05); tone(160, .22, 'sine', .06, .06); },
  win(){ [523,659,784,1047].forEach((f,i)=>tone(f,.22,'triangle',.11,i*0.12)); },
  lose(){ [330,262,196,147].forEach((f,i)=>tone(f,.25,'sawtooth',.07,i*0.13)); },
  swap(){ tone(520,.06,'sine',.07); tone(660,.06,'sine',.07,.06); },
  freeze(){ tone(880,.1,'sine',.07); tone(1320,.14,'sine',.05,.05); },
  bossHit(){ tone(180,.12,'square',.08); tone(120,.18,'square',.06,.05); },
  special(){ [392,523,659].forEach((f,i)=>tone(f,.1,'triangle',.09,i*0.05)); },
  bad(){ tone(220,.14,'sawtooth',.07); tone(180,.18,'sawtooth',.06,.07); },
};

/* ======================================================
   Assets image (embarqués dans le ZIP — aucun réseau).
   Chaque sprite a un repli vectoriel si son PNG manque.
   ====================================================== */
const IMG = {};   // nom -> HTMLImageElement (absent si échec de chargement)
const IMG_NAMES = [
  'fruit_fraise','fruit_citron','fruit_raisin','fruit_pasteque','fruit_orange','fruit_myrtille',
  'rot','prism','wood','bomb','pierce',
  'pepin0','pepin1','pepin2','pepin3','slug','crow','baron',
  'logo','bg0','bg1','bg2',
];
/* Taille de dessin (en rayons R) : le contenu d'un sprite remplit ~92% de son
   PNG ; 2.07·R donne donc un fruit de ~1.9·R, comme les corps vectoriels. */
const IMG_SCALE = {
  wood:2.15, bomb:2.2, pierce:2.6,
  pepin0:2.75, pepin1:2.75, pepin2:2.75, pepin3:2.75,
  slug:2.9, crow:2.75, baron:2.9,
};
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

/* ======================================================
   Dessin kawaii (repli vectoriel)
   ====================================================== */
function sticker(g, pathFn, stroke, r){
  pathFn(); g.fill();
  g.lineWidth = r*0.065; g.strokeStyle = stroke; pathFn(); g.stroke();
}
function drawShine(g,m,r){
  g.beginPath(); g.ellipse(m-r*0.36, m-r*0.44, r*0.2, r*0.11, -0.6, 0, 7);
  g.fillStyle='rgba(255,255,255,.55)'; g.fill();
}
function drawFace(g,m,r,opts){
  opts = opts||{};
  const ey = m + r*0.03, ex = r*0.33;
  if (opts.blink){
    g.strokeStyle=FACE_DARK; g.lineWidth=r*0.075; g.lineCap='round';
    for (const s of [-1,1]){
      g.beginPath(); g.arc(m+s*ex, ey-r*0.02, r*0.12, Math.PI*0.18, Math.PI*0.82); g.stroke();
    }
  } else if (opts.ko){
    g.strokeStyle=FACE_DARK; g.lineWidth=r*0.07; g.lineCap='round';
    for (const s of [-1,1]){
      const x=m+s*ex;
      g.beginPath(); g.moveTo(x-r*0.09,ey-r*0.09); g.lineTo(x+r*0.09,ey+r*0.09);
      g.moveTo(x+r*0.09,ey-r*0.09); g.lineTo(x-r*0.09,ey+r*0.09); g.stroke();
    }
  } else {
    for (const s of [-1,1]){
      g.beginPath(); g.arc(m+s*ex, ey, r*0.135, 0, 7); g.fillStyle=FACE_DARK; g.fill();
      g.beginPath(); g.arc(m+s*ex - r*0.05, ey - r*0.055, r*0.05, 0, 7); g.fillStyle='#fff'; g.fill();
    }
  }
  if (opts.angry){
    g.strokeStyle=FACE_DARK; g.lineWidth=r*0.07; g.lineCap='round';
    for (const s of [-1,1]){
      g.beginPath();
      g.moveTo(m+s*ex - s*r*0.14, ey - r*0.3 + r*0.07);
      g.lineTo(m+s*ex + s*r*0.12, ey - r*0.3 - r*0.03);
      g.stroke();
    }
  }
  g.fillStyle='rgba(255,105,150,.42)';
  for (const s of [-1,1]){ g.beginPath(); g.ellipse(m+s*r*0.57, m+r*0.21, r*0.13, r*0.085, 0, 0, 7); g.fill(); }
  if (opts.grin){
    g.strokeStyle=FACE_DARK; g.lineWidth=r*0.07; g.lineCap='round';
    g.beginPath(); g.arc(m, m+r*0.16, r*0.17, Math.PI*0.15, Math.PI*0.85); g.stroke();
  } else if (opts.sad){
    g.strokeStyle=FACE_DARK; g.lineWidth=r*0.07; g.lineCap='round';
    g.beginPath(); g.arc(m, m+r*0.36, r*0.12, Math.PI*1.15, Math.PI*1.85); g.stroke();
  } else {
    g.beginPath(); g.arc(m, m+r*0.24, r*0.105, 0, Math.PI); g.closePath();
    g.fillStyle=FACE_DARK; g.fill();
    g.beginPath(); g.arc(m, m+r*0.29, r*0.05, 0, Math.PI); g.fillStyle='#ff8ba0'; g.fill();
  }
}

const BODIES = {
  fraise(g,m,r){
    g.fillStyle='#43b85c';
    for (const a of [-0.85,-0.3,0.3,0.85]){
      g.save(); g.translate(m, m-r*0.6); g.rotate(a);
      g.beginPath(); g.ellipse(0,-r*0.16, r*0.11, r*0.26, 0, 0, 7); g.fill(); g.restore();
    }
    const gr = g.createLinearGradient(m, m-r, m, m+r);
    gr.addColorStop(0,'#ff8398'); gr.addColorStop(1,'#ff3d5f');
    g.fillStyle=gr;
    sticker(g, ()=>{
      g.beginPath();
      g.moveTo(m, m+r*0.97);
      g.bezierCurveTo(m-r*1.1, m+r*0.3, m-r*0.92, m-r*0.72, m, m-r*0.66);
      g.bezierCurveTo(m+r*0.92, m-r*0.72, m+r*1.1, m+r*0.3, m, m+r*0.97);
    }, 'rgba(150,20,60,.35)', r);
    g.fillStyle='rgba(255,236,170,.95)';
    for (const [px,py] of [[-0.5,0.02],[0.5,0.02],[-0.28,0.45],[0.28,0.45],[0,0.68],[-0.6,-0.3],[0.6,-0.3],[0,-0.4]]){
      g.beginPath(); g.ellipse(m+px*r, m+py*r, r*0.04, r*0.065, 0, 0, 7); g.fill();
    }
  },
  citron(g,m,r){
    g.save(); g.translate(m,m); g.rotate(-0.22);
    g.fillStyle='#ffd43b';
    for (const s of [-1,1]){ g.beginPath(); g.ellipse(s*r*0.95, 0, r*0.17, r*0.12, 0, 0, 7); g.fill(); }
    const gr=g.createRadialGradient(-r*0.3,-r*0.3,r*0.1,0,0,r);
    gr.addColorStop(0,'#fff3a8'); gr.addColorStop(1,'#ffd029');
    g.fillStyle=gr;
    sticker(g, ()=>{ g.beginPath(); g.ellipse(0,0,r*0.92,r*0.72,0,0,7); }, 'rgba(170,120,0,.32)', r);
    g.restore();
  },
  raisin(g,m,r){
    g.strokeStyle='#8a6240'; g.lineWidth=r*0.09; g.lineCap='round';
    g.beginPath(); g.moveTo(m, m-r*0.8); g.quadraticCurveTo(m+r*0.12, m-r*1.02, m+r*0.32, m-r*0.98); g.stroke();
    g.fillStyle='#8a4fd8';
    for (const [px,py] of [[-0.46,-0.32],[0.46,-0.32],[0,-0.58]]){
      g.beginPath(); g.arc(m+px*r, m+py*r, r*0.38, 0, 7); g.fill();
    }
    const gr=g.createRadialGradient(m-r*0.25,m-r*0.1,r*0.1,m,m+r*0.1,r*0.9);
    gr.addColorStop(0,'#cba4f8'); gr.addColorStop(1,'#9a5fe0');
    g.fillStyle=gr;
    sticker(g, ()=>{ g.beginPath(); g.arc(m, m+r*0.12, r*0.82, 0, 7); }, 'rgba(80,25,140,.35)', r);
  },
  pasteque(g,m,r){
    const gr=g.createRadialGradient(m-r*0.3,m-r*0.3,r*0.1,m,m,r*0.95);
    gr.addColorStop(0,'#9beeb4'); gr.addColorStop(1,'#3fc46c');
    g.fillStyle=gr;
    sticker(g, ()=>{ g.beginPath(); g.arc(m,m,r*0.92,0,7); }, 'rgba(15,100,55,.4)', r);
    g.save(); g.beginPath(); g.arc(m,m,r*0.89,0,7); g.clip();
    g.fillStyle='rgba(15,105,55,.4)';
    for (const px of [-0.58,-0.2,0.2,0.58]){
      g.beginPath(); g.ellipse(m+px*r, m, r*0.085, r*1.05, px*0.28, 0, 7); g.fill();
    }
    g.restore();
    g.strokeStyle='#8a6240'; g.lineWidth=r*0.08; g.lineCap='round';
    g.beginPath(); g.moveTo(m, m-r*0.9); g.quadraticCurveTo(m+r*0.18, m-r*1.05, m+r*0.3, m-r*0.95); g.stroke();
  },
  orange(g,m,r){
    const gr=g.createRadialGradient(m-r*0.3,m-r*0.35,r*0.1,m,m,r*0.95);
    gr.addColorStop(0,'#ffd194'); gr.addColorStop(1,'#ff9124');
    g.fillStyle=gr;
    sticker(g, ()=>{ g.beginPath(); g.arc(m,m,r*0.9,0,7); }, 'rgba(190,85,0,.35)', r);
    g.fillStyle='rgba(205,105,10,.22)';
    for (let i=0;i<14;i++){
      const a=i*2.399, rr=r*(0.4+0.42*((i*37%10)/10));
      g.beginPath(); g.arc(m+Math.cos(a)*rr, m+Math.sin(a)*rr, r*0.028, 0, 7); g.fill();
    }
    g.strokeStyle='#8a6240'; g.lineWidth=r*0.08; g.lineCap='round';
    g.beginPath(); g.moveTo(m, m-r*0.88); g.lineTo(m, m-r*1.0); g.stroke();
    g.save(); g.translate(m+r*0.22, m-r*0.98); g.rotate(0.5);
    g.beginPath(); g.ellipse(0,0,r*0.22,r*0.1,0,0,7); g.fillStyle='#43b85c'; g.fill(); g.restore();
  },
  myrtille(g,m,r){
    const gr=g.createRadialGradient(m-r*0.3,m-r*0.3,r*0.1,m,m,r*0.95);
    gr.addColorStop(0,'#a9c4ff'); gr.addColorStop(1,'#4e76e0');
    g.fillStyle=gr;
    sticker(g, ()=>{ g.beginPath(); g.arc(m,m,r*0.9,0,7); }, 'rgba(35,55,150,.4)', r);
    g.fillStyle='#2c4ba8';
    const cy = m-r*0.56;
    g.beginPath();
    for (let i=0;i<10;i++){
      const a=-Math.PI/2 + i*Math.PI/5, rr=(i%2===0)?r*0.2:r*0.09;
      const px=m+Math.cos(a)*rr, py=cy+Math.sin(a)*rr*0.8;
      i?g.lineTo(px,py):g.moveTo(px,py);
    }
    g.closePath(); g.fill();
  },
};

/* fruit pourri (couleur cachée) */
function drawRot(g,m,r){
  const gr=g.createRadialGradient(m-r*0.3,m-r*0.3,r*0.1,m,m,r*0.95);
  gr.addColorStop(0,'#c3cd92'); gr.addColorStop(1,'#8d9a5c');
  g.fillStyle=gr;
  sticker(g, ()=>{
    g.beginPath();
    g.moveTo(m-r*0.85,m);
    g.bezierCurveTo(m-r*0.95,m-r*0.8, m+r*0.5,m-r*1.0, m+r*0.75,m-r*0.45);
    g.bezierCurveTo(m+r*1.05,m+r*0.1, m+r*0.6,m+r*0.95, m,m+r*0.88);
    g.bezierCurveTo(m-r*0.7,m+r*0.8, m-r*0.75,m+r*0.5, m-r*0.85,m);
  }, 'rgba(70,80,30,.4)', r);
  g.fillStyle='rgba(110,130,60,.5)';
  for (const [px,py,s] of [[-0.4,-0.35,0.16],[0.45,-0.1,0.2],[-0.15,0.5,0.13],[0.15,-0.55,0.1]]){
    g.beginPath(); g.arc(m+px*r,m+py*r,r*s,0,7); g.fill();
  }
  drawFace(g,m,r,{ko:true,sad:true});
}
/* prisme (joker) */
function drawPrism(g,m,r){
  const cols=['#ff6b81','#ffc93c','#5ad66f','#5aa2ff','#b07ef0'];
  g.save(); g.beginPath(); g.arc(m,m,r*0.9,0,7); g.clip();
  cols.forEach((c,i)=>{
    g.fillStyle=c; g.globalAlpha=.8;
    g.beginPath(); g.moveTo(m,m);
    const a0=-Math.PI/2 + i*(Math.PI*2/5);
    g.arc(m,m,r, a0, a0+Math.PI*2/5); g.closePath(); g.fill();
  });
  g.globalAlpha=1;
  const gr=g.createRadialGradient(m,m,0,m,m,r*0.9);
  gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(0.55,'rgba(255,255,255,.55)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr; g.beginPath(); g.arc(m,m,r*0.9,0,7); g.fill();
  g.restore();
  g.lineWidth=r*0.065; g.strokeStyle='rgba(120,90,140,.4)';
  g.beginPath(); g.arc(m,m,r*0.9,0,7); g.stroke();
  drawShine(g,m,r);
  drawFace(g,m,r,{});
}
/* caisse en bois */
function drawWood(g,m,r){
  const w=r*0.92;
  const rr=(x,y,wd,h,rad)=>{ g.beginPath(); g.roundRect(x,y,wd,h,rad); };
  const gr=g.createLinearGradient(m,m-w,m,m+w);
  gr.addColorStop(0,'#d9ab76'); gr.addColorStop(1,'#b9854c');
  g.fillStyle=gr; rr(m-w,m-w,w*2,w*2,r*0.22); g.fill();
  g.lineWidth=r*0.07; g.strokeStyle='rgba(90,55,20,.45)'; rr(m-w,m-w,w*2,w*2,r*0.22); g.stroke();
  g.strokeStyle='rgba(120,75,30,.5)'; g.lineWidth=r*0.05;
  for (const y of [-0.3,0.1,0.5]){
    g.beginPath(); g.moveTo(m-w*0.85,m+y*r); g.lineTo(m+w*0.85,m+y*r); g.stroke();
  }
  g.fillStyle='rgba(90,55,20,.5)';
  for (const [px,py] of [[-0.6,-0.6],[0.6,-0.6],[-0.6,0.72],[0.6,0.72]]){
    g.beginPath(); g.arc(m+px*r,m+py*r,r*0.06,0,7); g.fill();
  }
  g.beginPath(); g.arc(m+r*0.25,m-r*0.05,r*0.11,0,7);
  g.strokeStyle='rgba(120,75,30,.55)'; g.lineWidth=r*0.045; g.stroke();
}
/* personnages */
const PEPIN_STAGES = [
  {name:'Pépin Bourgeon',    desc:'Une toute petite cerise, mais un très grand courage.', scale:0.8},
  {name:'Pépin Explorateur', desc:'Bonnet tout doux et écharpe : prêt pour les Cimes Givrées !', scale:0.92},
  {name:'Pépin Chevalier',   desc:'Cape et bandeau de héros pour affronter les Racines Pourries.', scale:1.04},
  {name:'Pépin Légendaire',  desc:'Le sauveur du Verger Enchanté, couronné d’or !', scale:1.16},
];
function pepinStage(){ return [7,15,23].filter(i=>save.stars[i]).length; }
function sparkle(g,x,y,s,col){
  g.fillStyle=col; g.beginPath();
  g.moveTo(x,y-s); g.quadraticCurveTo(x,y,x+s,y); g.quadraticCurveTo(x,y,x,y+s);
  g.quadraticCurveTo(x,y,x-s,y); g.quadraticCurveTo(x,y,x,y-s); g.fill();
}
function drawPepin(g,m,r,mood,stage,step){
  if (stage===undefined) stage=pepinStage();
  step=step||0;
  const by=m+r*0.05, br=r*0.85;
  // cape (derrière le corps)
  if (stage>=2){
    const cc = stage===3 ? ['#ffe08a','#f2a93b'] : ['#c9a2ff','#8b5ee0'];
    const gr=g.createLinearGradient(m,by-r*0.4,m,by+r);
    gr.addColorStop(0,cc[0]); gr.addColorStop(1,cc[1]);
    g.fillStyle=gr;
    g.beginPath();
    g.moveTo(m-r*0.5,by-r*0.35);
    g.quadraticCurveTo(m-r*1.12,by+r*0.4, m-r*0.98,by+r*0.92);
    g.quadraticCurveTo(m,by+r*0.78, m+r*0.98,by+r*0.92);
    g.quadraticCurveTo(m+r*1.12,by+r*0.4, m+r*0.5,by-r*0.35);
    g.closePath(); g.fill();
    g.strokeStyle='rgba(70,30,110,.3)'; g.lineWidth=r*0.05; g.stroke();
  }
  // petits pieds (alternent pendant la marche)
  g.fillStyle='#c22a4a';
  for (const s of [-1,1]){
    const lift=Math.max(0, s*step)*r*0.16;
    g.beginPath(); g.ellipse(m+s*r*0.33, by+br*0.93-lift, r*0.19, r*0.12, 0, 0, 7); g.fill();
  }
  // tige + feuille(s)
  if (stage===0 || stage===2){
    g.strokeStyle='#8a6240'; g.lineWidth=r*0.1; g.lineCap='round';
    g.beginPath(); g.moveTo(m, m-r*0.8); g.quadraticCurveTo(m+r*0.1, m-r*1.05, m+r*0.32, m-r*1.0); g.stroke();
    g.fillStyle='#43b85c';
    g.save(); g.translate(m+r*0.42,m-r*0.95); g.rotate(0.5);
    g.beginPath(); g.ellipse(0,0,r*0.24,r*0.11,0,0,7); g.fill(); g.restore();
    if (stage===2){
      g.save(); g.translate(m+r*0.2,m-r*1.08); g.rotate(-0.6);
      g.beginPath(); g.ellipse(0,0,r*0.2,r*0.09,0,0,7); g.fill(); g.restore();
    }
  }
  // corps
  const gr=g.createRadialGradient(m-r*0.3,m-r*0.3,r*0.1,m,m,r*0.95);
  gr.addColorStop(0,'#ff8398'); gr.addColorStop(1,'#ff3d5f');
  g.fillStyle=gr;
  sticker(g, ()=>{ g.beginPath(); g.arc(m,by,br,0,7); }, 'rgba(150,20,60,.35)', r);
  drawShine(g,m,r);
  drawFace(g,m,r,mood||{});

  if (stage===1){
    // écharpe rayée
    g.save(); g.beginPath(); g.arc(m,by,br,0,7); g.clip();
    g.fillStyle='#5fa8ff'; g.fillRect(m-br, by+br*0.5, br*2, r*0.2);
    g.fillStyle='#fff';
    for (let k=-3;k<=3;k++) g.fillRect(m+k*r*0.22-r*0.04, by+br*0.5, r*0.08, r*0.2);
    g.restore();
    g.save(); g.translate(m+r*0.42, by+br*0.58); g.rotate(-0.25);
    g.fillStyle='#5fa8ff'; g.beginPath(); g.roundRect(-r*0.1,0,r*0.2,r*0.45,r*0.05); g.fill();
    g.fillStyle='#fff'; g.fillRect(-r*0.1, r*0.16, r*0.2, r*0.07);
    g.restore();
    // bonnet à pompon
    const hy=m-r*0.5;
    g.fillStyle='#ff9fc4';
    g.beginPath(); g.ellipse(m, hy, r*0.62, r*0.56, 0, Math.PI, 0); g.closePath(); g.fill();
    g.strokeStyle='rgba(200,60,120,.35)'; g.lineWidth=r*0.05; g.stroke();
    g.fillStyle='#fff';
    g.beginPath(); g.roundRect(m-r*0.72, hy-r*0.06, r*1.44, r*0.2, r*0.1); g.fill(); g.stroke();
    g.beginPath(); g.arc(m, hy-r*0.62, r*0.17, 0, 7); g.fill(); g.stroke();
  }
  if (stage===2){
    // bandeau de héros
    g.save(); g.beginPath(); g.arc(m,by,br,0,7); g.clip();
    g.fillStyle='#fff'; g.fillRect(m-br, m-r*0.5, br*2, r*0.17);
    g.restore();
    g.beginPath(); g.arc(m, m-r*0.415, r*0.07, 0, 7); g.fillStyle='#ff3d5f'; g.fill();
    g.fillStyle='#fff'; g.strokeStyle='rgba(150,20,60,.25)'; g.lineWidth=r*0.03;
    for (const [a,l] of [[0.35,0.42],[0.8,0.36]]){
      g.save(); g.translate(m+r*0.68, m-r*0.42); g.rotate(a);
      g.beginPath(); g.ellipse(r*l*0.5,0,r*l*0.5,r*0.07,0,0,7); g.fill(); g.stroke();
      g.restore();
    }
  }
  if (stage===3){
    // couronne d'or
    const cy=m-r*0.62;
    const gc=g.createLinearGradient(m,cy-r*0.6,m,cy);
    gc.addColorStop(0,'#ffe58a'); gc.addColorStop(1,'#ffb627');
    g.fillStyle=gc;
    g.beginPath();
    g.moveTo(m-r*0.5,cy); g.lineTo(m-r*0.56,cy-r*0.45); g.lineTo(m-r*0.25,cy-r*0.22);
    g.lineTo(m,cy-r*0.6); g.lineTo(m+r*0.25,cy-r*0.22); g.lineTo(m+r*0.56,cy-r*0.45);
    g.lineTo(m+r*0.5,cy); g.closePath(); g.fill();
    g.strokeStyle='rgba(170,100,0,.45)'; g.lineWidth=r*0.05; g.lineJoin='round'; g.stroke();
    for (const [dx,col] of [[-0.28,'#4e7fe8'],[0,'#ff4d6d'],[0.28,'#3fc46c']]){
      g.beginPath(); g.arc(m+dx*r, cy-r*0.1, r*0.07, 0, 7); g.fillStyle=col; g.fill();
    }
    for (const [px,py,s] of [[-1.2,-0.6,0.16],[1.22,-0.15,0.13],[-1.1,0.55,0.11],[1.05,0.75,0.1]])
      sparkle(g, m+px*r, m+py*r, r*s, '#ffc93c');
  }
}
function drawSlug(g,m,r){
  const gr=g.createLinearGradient(m,m-r,m,m+r);
  gr.addColorStop(0,'#c8e87a'); gr.addColorStop(1,'#8fc44e');
  g.fillStyle=gr;
  sticker(g, ()=>{
    g.beginPath();
    g.moveTo(m-r*0.95,m+r*0.6);
    g.bezierCurveTo(m-r*1.05,m-r*0.4, m-r*0.3,m-r*0.95, m+r*0.2,m-r*0.75);
    g.bezierCurveTo(m+r*0.9,m-r*0.5, m+r*1.0,m+r*0.3, m+r*0.85,m+r*0.6);
    g.closePath();
  }, 'rgba(80,110,20,.4)', r);
  g.strokeStyle='#6f9a35'; g.lineWidth=r*0.07; g.lineCap='round';
  for (const s of [-1,1]){
    g.beginPath(); g.moveTo(m+s*r*0.2-r*0.1, m-r*0.72); g.lineTo(m+s*r*0.35-r*0.1, m-r*1.0); g.stroke();
    g.beginPath(); g.arc(m+s*r*0.35-r*0.1, m-r*1.02, r*0.08, 0, 7); g.fillStyle='#6f9a35'; g.fill();
  }
  g.fillStyle='#ffbe2e';
  g.beginPath();
  g.moveTo(m-r*0.45,m-r*0.62); g.lineTo(m-r*0.38,m-r*0.88); g.lineTo(m-r*0.25,m-r*0.66);
  g.lineTo(m-r*0.14,m-r*0.92); g.lineTo(m-r*0.02,m-r*0.68); g.lineTo(m+r*0.06,m-r*0.86);
  g.lineTo(m+r*0.1,m-r*0.6); g.closePath(); g.fill();
  g.fillStyle='rgba(200,240,140,.6)';
  g.beginPath(); g.ellipse(m+r*0.45,m+r*0.5,r*0.25,r*0.12,0,0,7); g.fill();
  drawFace(g,m-r*0.1,r*0.85,{angry:true,grin:true});
}
function drawCrow(g,m,r){
  g.fillStyle='#8fd4ff';
  for (const [px,py,s] of [[-0.85,-0.3,0.12],[0.85,-0.2,0.1],[-0.7,0.5,0.09],[0.75,0.55,0.11]]){
    g.save(); g.translate(m+px*r,m+py*r); g.rotate(px);
    g.beginPath(); g.moveTo(0,-r*s*2); g.lineTo(r*s,r*s); g.lineTo(-r*s,r*s); g.closePath(); g.fill();
    g.restore();
  }
  g.fillStyle='#46587e';
  for (const a of [-0.5,0,0.5]){
    g.save(); g.translate(m, m-r*0.75); g.rotate(a);
    g.beginPath(); g.ellipse(0,-r*0.15, r*0.1, r*0.28, 0, 0, 7); g.fill(); g.restore();
  }
  const gr=g.createRadialGradient(m-r*0.3,m-r*0.3,r*0.1,m,m,r*0.95);
  gr.addColorStop(0,'#7389b5'); gr.addColorStop(1,'#46587e');
  g.fillStyle=gr;
  sticker(g, ()=>{ g.beginPath(); g.arc(m,m,r*0.88,0,7); }, 'rgba(25,35,70,.5)', r);
  g.fillStyle='#ff9838';
  g.beginPath(); g.moveTo(m-r*0.16,m+r*0.1); g.lineTo(m+r*0.16,m+r*0.1); g.lineTo(m,m+r*0.42); g.closePath(); g.fill();
  const eo={angry:true}; // yeux + sourcils
  const ey=m-r*0.12, ex=r*0.33;
  for (const s of [-1,1]){
    g.beginPath(); g.arc(m+s*ex, ey, r*0.13, 0, 7); g.fillStyle='#fff'; g.fill();
    g.beginPath(); g.arc(m+s*ex, ey, r*0.07, 0, 7); g.fillStyle=FACE_DARK; g.fill();
    g.strokeStyle=FACE_DARK; g.lineWidth=r*0.07; g.lineCap='round';
    g.beginPath(); g.moveTo(m+s*ex - s*r*0.14, ey-r*0.26); g.lineTo(m+s*ex + s*r*0.1, ey-r*0.18); g.stroke();
  }
}
function drawBaron(g,m,r){
  const gr=g.createRadialGradient(m-r*0.3,m-r*0.3,r*0.1,m,m,r*0.95);
  gr.addColorStop(0,'#b5ad68'); gr.addColorStop(1,'#77713f');
  g.fillStyle=gr;
  sticker(g, ()=>{ g.beginPath(); g.arc(m,m+r*0.05,r*0.88,0,7); }, 'rgba(50,45,15,.5)', r);
  g.fillStyle='rgba(130,160,110,.55)';
  for (const [px,py,s] of [[-0.45,0.3,0.18],[0.5,0.1,0.14],[0.2,0.55,0.12],[-0.2,-0.2,0.1]]){
    g.beginPath(); g.arc(m+px*r,m+py*r,r*s,0,7); g.fill();
  }
  g.fillStyle='#2b2233';
  g.beginPath(); g.roundRect(m-r*0.55,m-r*1.06,r*1.1,r*0.14,r*0.05); g.fill();
  g.beginPath(); g.roundRect(m-r*0.36,m-r*1.5,r*0.72,r*0.5,r*0.08); g.fill();
  g.fillStyle='#ff6fa5';
  g.beginPath(); g.rect(m-r*0.36,m-r*1.14,r*0.72,r*0.12); g.fill();
  drawFace(g,m,r*0.9,{angry:true,grin:true});
  g.strokeStyle=FACE_DARK; g.lineWidth=r*0.06; g.lineCap='round';
  for (const s of [-1,1]){
    g.beginPath(); g.moveTo(m+s*r*0.08, m+r*0.28);
    g.quadraticCurveTo(m+s*r*0.4, m+r*0.22, m+s*r*0.5, m+r*0.05); g.stroke();
  }
}
const CHAR_DRAW = {pepin:drawPepin, slug:drawSlug, crow:drawCrow, baron:drawBaron};

function makeSprite(t, rpx, blink){
  const s = Math.ceil(rpx*2*SPAD)+2;
  const c = document.createElement('canvas'); c.width=c.height=s;
  const g = c.getContext('2d'), m=s/2;
  const im = IMG['fruit_'+TYPES[t].name];
  if (im){ const d=rpx*2.07; g.drawImage(im, m-d/2, m-d/2, d, d); return c; }
  BODIES[TYPES[t].name](g,m,rpx);
  drawShine(g,m,rpx);
  drawFace(g,m,rpx,{blink});
  return c;
}
/* `name` : clé d'un PNG de IMG_NAMES ; sinon repli sur le dessin `fn`. */
function makeMisc(fn, rpx, mood, name){
  const s = Math.ceil(rpx*2*1.6)+2;
  const c = document.createElement('canvas'); c.width=c.height=s;
  const g = c.getContext('2d');
  const im = name && IMG[name];
  if (im){ const d=rpx*(IMG_SCALE[name]||2.07); g.drawImage(im, s/2-d/2, s/2-d/2, d, d); return c; }
  fn(g, s/2, rpx, mood);
  return c;
}

/* ---------- DOM ---------- */
const $ = id => document.getElementById(id);
const homeEl=$('home'), gameEl=$('game'), cv=$('cv'), ctx=cv.getContext('2d');
const ovPause=$('ovPause'), ovWin=$('ovWin'), ovLose=$('ovLose'),
      ovChoose=$('ovChoose'), ovLevel=$('ovLevel'), ovDialog=$('ovDialog'), ovEvolve=$('ovEvolve');

/* ---------- État ---------- */
let state='home';            // home | playing | paused | dialog | won | lost
let levelIndex=0, score=0, shotsUntilDrop=0;
let rows=[];                 // [{shifted, cells:[cell|null]}]
let cur=0, nxt=0;
let bullet=null;
let falling=[], particles=[], chunks=[], ringsFx=[], popups=[], bolts=[];
let aiming=false, aimAngle=-Math.PI/2, lastPointer=null;
let rafId=0, lastT=0, shakeAmp=0, lastPlaced=null;
let gauge=0, loadedSpecial=null;
let pepinJump=0;
let boss=null;               // {key, def, hp, atkIn, flash, next}
let activeEvent=null, pendingEvent=null, evCooldown=8, lastEvent=null, windDir=1;

/* ---------- Fond du monde courant ---------- */
let bgImgOn=false;
function applyWorldBg(){
  const im = IMG['bg'+LEVELS[levelIndex].w];
  bgImgOn = !!im;
  // remplace le dégradé CSS du canvas ; retour au style de la feuille sinon
  cv.style.background = im ? `url("${im.src}") center/cover no-repeat` : '';
}

/* ---------- Cellules ---------- */
function makeCell(t){ return {t, ice:0, rot:false, cage:false, sup:null}; }
function isFruit(c){ return c && !c.wood && !c.prism; }
function matchable(c){ return c && !c.wood && !c.ice && !c.rot && !c.cage; }
function randPal(){ const p=LEVELS[levelIndex].pal; return p[Math.random()*p.length|0]; }

/* ---------- Géométrie ---------- */
let W=0,H=0,dpr=1,R=16,rowH=28,boardL=0,boardR=0,boardTop=10,shX=0,shY=0,dangerY=0;
let spr={fruits:[],rot:null,prism:null,wood:null,boss:null};

function resize(){
  const rect = cv.getBoundingClientRect();
  if (rect.width<10 || rect.height<10) return;
  dpr = Math.min(window.devicePixelRatio||1, 2.5);
  W = rect.width; H = rect.height;
  cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const bossPad = boss ? 88 : 0;
  R = Math.min(W/(COLS*2), (H-168-bossPad)/(2+10*SQ3), 32);
  rowH = R*SQ3;
  boardL = (W - COLS*2*R)/2;
  boardR = boardL + COLS*2*R;
  boardTop = 10 + bossPad;
  shX = W/2; shY = H-78;
  dangerY = H-158;
  spr.fruits = TYPES.map((_,t)=>[makeSprite(t,R*dpr,false), makeSprite(t,R*dpr,true)]);
  spr.rot   = makeMisc(drawRot,   R*dpr, undefined, 'rot');
  spr.prism = makeMisc(drawPrism, R*dpr, undefined, 'prism');
  spr.wood  = makeMisc(drawWood,  R*dpr, undefined, 'wood');
  { const st=pepinStage(); spr.pepin = makeMisc((g,m,r)=>drawPepin(g,m,r,{},st), R*0.95*dpr*PEPIN_STAGES[st].scale, undefined, 'pepin'+st); }
  if (boss) spr.boss = makeMisc(CHAR_DRAW[boss.key], 34*dpr, undefined, boss.key);
  drawNextPreview();
}

/* overlays dessinés en direct (légers) */
function drawIceOver(x,y){
  ctx.fillStyle='rgba(185,225,255,.55)';
  ctx.beginPath(); ctx.arc(x,y,R*0.98,0,7); ctx.fill();
  ctx.strokeStyle='rgba(140,195,255,.9)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(x,y,R*0.98,0,7); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(x-R*0.45,y-R*0.2); ctx.lineTo(x-R*0.15,y-R*0.5);
  ctx.moveTo(x+R*0.1,y+R*0.35); ctx.lineTo(x+R*0.45,y);
  ctx.stroke();
}
function drawCageOver(x,y){
  ctx.strokeStyle='rgba(110,70,40,.85)'; ctx.lineWidth=Math.max(2,R*0.12); ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(x,y,R*0.95,0,7); ctx.stroke();
  ctx.lineWidth=Math.max(1.5,R*0.09);
  for (const px of [-0.55,0,0.55]){
    ctx.beginPath(); ctx.moveTo(x+px*R, y-Math.sqrt(1-px*px*0.9)*R*0.9);
    ctx.lineTo(x+px*R, y+Math.sqrt(1-px*px*0.9)*R*0.9); ctx.stroke();
  }
}
function drawBadge(x,y,sup,tNow){
  const bx=x+R*0.58, by=y-R*0.58, s=R*0.34;
  if (sup==='gold'){
    ctx.save();
    ctx.strokeStyle='rgba(255,190,40,.9)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(x,y,R*1.02,0,7); ctx.stroke();
    const tw=(tNow*2)%1;
    ctx.fillStyle='rgba(255,220,90,'+(0.5+0.5*Math.sin(tNow*5))+')';
    star5(bx,by,s*0.9); ctx.fill();
    ctx.restore();
  } else if (sup==='star'){
    ctx.fillStyle='#ffbe2e'; star5(bx,by,s); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; star5(bx,by,s); ctx.stroke();
  } else if (sup==='heart'){
    ctx.fillStyle='#ff5d8f';
    heart(bx,by,s); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; heart(bx,by,s); ctx.stroke();
  }
}
function star5(x,y,s){
  ctx.beginPath();
  for (let i=0;i<10;i++){
    const a=-Math.PI/2+i*Math.PI/5, rr=(i%2===0)?s:s*0.45;
    const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr;
    i?ctx.lineTo(px,py):ctx.moveTo(px,py);
  }
  ctx.closePath();
}
function heart(x,y,s){
  ctx.beginPath();
  ctx.moveTo(x,y+s*0.75);
  ctx.bezierCurveTo(x-s*1.2,y-s*0.1, x-s*0.5,y-s*0.95, x,y-s*0.3);
  ctx.bezierCurveTo(x+s*0.5,y-s*0.95, x+s*1.2,y-s*0.1, x,y+s*0.75);
  ctx.closePath();
}

function drawCell(x,y,cell,scale,blink,tNow){
  const half = R*(scale||1)*SPAD;
  if (cell.wood){ ctx.drawImage(spr.wood, x-R*1.6, y-R*1.6, R*3.2, R*3.2); return; }
  if (cell.prism){ ctx.drawImage(spr.prism, x-R*1.6, y-R*1.6, R*3.2, R*3.2); }
  else if (cell.rot){ ctx.drawImage(spr.rot, x-R*1.6, y-R*1.6, R*3.2, R*3.2); }
  else ctx.drawImage(spr.fruits[cell.t][blink?1:0], x-half, y-half, half*2, half*2);
  if (cell.ice) drawIceOver(x,y);
  if (cell.cage) drawCageOver(x,y);
  if (cell.sup) drawBadge(x,y,cell.sup,tNow||0);
}

function drawNextPreview(){
  const c=$('nextCv'), g=c.getContext('2d');
  const d=Math.min(window.devicePixelRatio||1,2.5), size=30;
  c.width=c.height=size*d; c.style.width=c.style.height=size+'px';
  g.setTransform(d,0,0,d,0,0);
  g.clearRect(0,0,size,size);
  const sp=makeSprite(nxt, 12.5*d, false);
  g.drawImage(sp, 15-12.5*SPAD, 15-12.5*SPAD, 25*SPAD, 25*SPAD);
}

/* ---------- Grille hexagonale ---------- */
function rowLen(shifted){ return shifted ? COLS-1 : COLS; }
function cellPos(r,c){
  const row = rows[r];
  return { x: boardL + R + c*2*R + (row.shifted ? R : 0), y: boardTop + R + r*rowH };
}
function neighbors(r,c){
  const out=[], s=rows[r].shifted;
  out.push([r,c-1],[r,c+1]);
  for (const rr of [r-1,r+1]){
    if (rr<0 || rr>=rows.length) continue;
    if (s) out.push([rr,c],[rr,c+1]); else out.push([rr,c-1],[rr,c]);
  }
  return out.filter(([rr,cc])=> rr>=0 && rr<rows.length && cc>=0 && cc<rows[rr].cells.length);
}
function makeRow(shifted, filled){
  const cells = new Array(rowLen(shifted));
  for (let c=0;c<cells.length;c++) cells[c] = filled ? makeCell(randPal()) : null;
  return {shifted, cells};
}
function insertTopRow(){
  const row = makeRow(rows.length ? !rows[0].shifted : false, true);
  if (Math.random()<0.18){
    const c=row.cells[Math.random()*row.cells.length|0];
    if (c) c.sup='gold';
  }
  rows.unshift(row);
  if (lastPlaced) lastPlaced.r++;
}
function parseLayout(def){
  rows=[];
  def.layout.forEach((str,ri)=>{
    const shifted = ri%2===1;
    const cells=[];
    for (const ch of str){
      let cell=null;
      if (ch==='o') cell=makeCell(randPal());
      else if (ch==='i'){ cell=makeCell(randPal()); cell.ice=1; }
      else if (ch==='x'){ cell=makeCell(randPal()); cell.rot=true; }
      else if (ch==='c'){ cell=makeCell(randPal()); cell.cage=true; }
      else if (ch==='G'){ cell=makeCell(randPal()); cell.sup='gold'; }
      else if (ch==='*'){ cell=makeCell(randPal()); cell.sup='star'; }
      else if (ch==='+'){ cell=makeCell(randPal()); cell.sup='heart'; }
      else if (ch==='p'){ cell={prism:true}; }
      else if (ch==='W'){ cell={wood:true}; }
      cells.push(cell);
    }
    while (cells.length < rowLen(shifted)) cells.push(null);
    cells.length = rowLen(shifted);
    rows.push({shifted, cells});
  });
}
function typesInGrid(){
  const set = new Set();
  for (const row of rows) for (const c of row.cells)
    if (isFruit(c) && !c.rot) set.add(c.t);
  return [...set];
}
function gridEmpty(){
  for (const row of rows) for (const c of row.cells) if (c) return false;
  return true;
}
function pickType(){
  const present = typesInGrid();
  if (!present.length) return randPal();
  return present[Math.random()*present.length|0];
}

/* ---------- Niveau ---------- */
function startLevel(i, booster){
  levelIndex=i; const L=LEVELS[i];
  boss = L.boss ? {key:L.boss, def:BOSSES[L.boss], hp:BOSSES[L.boss].hp, atkIn:BOSSES[L.boss].every, flash:0} : null;
  score=0; shotsUntilDrop=L.drop;
  bullet=null; falling=[]; particles=[]; chunks=[]; ringsFx=[]; popups=[]; bolts=[];
  shakeAmp=0; lastPlaced=null; lastPointer=null;
  gauge=0; loadedSpecial=booster||null;
  activeEvent=null; pendingEvent=null; lastEvent=null; evCooldown=7+(Math.random()*4|0);
  homeEl.hidden=true; gameEl.hidden=false;
  applyWorldBg();
  ovPause.hidden=ovWin.hidden=ovLose.hidden=ovChoose.hidden=ovLevel.hidden=true;
  resize();
  parseLayout(L);
  cur=pickType(); nxt=pickType();
  syncHud();
  const pre = DIALOG_BEFORE[i];
  if (pre && !save.seen[pre]){
    state='dialog';
    render(0);
    showDialog(pre, ()=>{ state='playing'; startLoop(); });
  } else {
    state='playing'; startLoop();
  }
}

/* ---------- Moteur d'explosion commun ---------- */
function keyOf(r,c){ return r+','+c; }
function cellAt(k){ const [r,c]=k.split(',').map(Number); return rows[r] ? rows[r].cells[c] : null; }

function expandStars(set){
  let changed=true;
  while (changed){
    changed=false;
    for (const k of [...set]){
      const cell=cellAt(k);
      if (cell && cell.sup==='star'){
        for (let r=0;r<rows.length;r++) for (let c=0;c<rows[r].cells.length;c++){
          const o=rows[r].cells[c], kk=keyOf(r,c);
          if (o && matchable(o) && !o.prism && o.t===cell.t && !set.has(kk)){ set.add(kk); changed=true; }
        }
        cell.sup=null; // l'étoile ne se déclenche qu'une fois
      }
    }
  }
}

function popCells(pairs){
  const set = new Set(pairs.map(p=>Array.isArray(p)?p.join(','):p));
  expandStars(set);
  let count=0, touchTop=false, coins=0, hearts=0;
  const popped=[];
  for (const k of set){
    const [r,c]=k.split(',').map(Number);
    const cell = rows[r] && rows[r].cells[c];
    if (!cell) continue;
    popped.push([r,c,cell]);
  }
  for (const [r,c,cell] of popped){
    const p=cellPos(r,c);
    rows[r].cells[c]=null; count++;
    if (r===0) touchTop=true;
    const col = cell.wood?'#b78a5a' : cell.prism?'#ffffff' : cell.rot?'#8d9a5c' : TYPES[cell.t].c;
    explode(p.x,p.y,col);
    if (cell.sup==='gold'){ coins+=2; popup(p.x,p.y,'🪙 +2'); }
    if (cell.sup==='heart') hearts++;
    if (cell.cage){ score+=100; popup(p.x,p.y,'Libéré ! +100'); }
  }
  if (!count) return 0;
  // effets de voisinage sur les survivants
  const adj=new Set();
  for (const [r,c] of popped)
    for (const [x,y] of neighbors(r,c)){
      const k=keyOf(x,y);
      if (!set.has(k)) adj.add(k);
    }
  for (const k of adj){
    const [r,c]=k.split(',').map(Number);
    const cell = rows[r] && rows[r].cells[c];
    if (!cell || cell.wood || cell.prism) continue;
    const p=cellPos(r,c);
    if (cell.ice){ cell.ice=0; sfx.freeze(); explode(p.x,p.y,'#bfe3ff'); }
    else if (cell.rot){ cell.rot=false; cell.t=randPal(); popup(p.x,p.y,'Purifié !'); explode(p.x,p.y,'#d8e8a8'); }
    else if (cell.cage){ cell.cage=false; score+=100; popup(p.x,p.y,'Libéré !'); }
  }
  score += count*10;
  gauge = Math.min(100, gauge + count*(evActive('sun')?8:4));
  if (coins) save.coins += coins;
  if (hearts){
    if (boss){ boss.atkIn+=2*hearts; popup(W/2,H*0.4,'Attaque retardée ❤'); }
    else { shotsUntilDrop+=3*hearts; popup(W/2,H*0.4,'+'+(3*hearts)+' tirs ❤'); }
  }
  shakeAmp = Math.min(8, shakeAmp + 2 + count*0.4);
  sfx.pop(count);
  if (count>=4) pepinJump=0.45;
  if (boss && touchTop && boss.hp>0){
    boss.hp = Math.max(0, boss.hp - count);
    boss.flash = 0.3;
    popup(W/2, boardTop-26, '−'+count);
    sfx.bossHit();
  }
  return count;
}

function matchGroup(r,c){
  const base = rows[r].cells[c], baseT = base.t;
  const seen = new Set([keyOf(r,c)]), stack=[[r,c]], out=[[r,c]];
  while (stack.length){
    const [a,b]=stack.pop();
    for (const [x,y] of neighbors(a,b)){
      const k=keyOf(x,y), cell=rows[x].cells[y];
      if (seen.has(k) || !matchable(cell)) continue;
      if (cell.prism || cell.t===baseT){ seen.add(k); stack.push([x,y]); out.push([x,y]); }
    }
  }
  return out;
}

function dropFloaters(){
  const seen=new Set(), stack=[];
  if (rows.length) for (let c=0;c<rows[0].cells.length;c++)
    if (rows[0].cells[c]){ seen.add('0,'+c); stack.push([0,c]); }
  while (stack.length){
    const [a,b]=stack.pop();
    for (const [x,y] of neighbors(a,b)){
      const k=keyOf(x,y);
      if (seen.has(k) || !rows[x].cells[y]) continue;
      seen.add(k); stack.push([x,y]);
    }
  }
  let n=0;
  for (let r=0;r<rows.length;r++) for (let c=0;c<rows[r].cells.length;c++){
    const cell=rows[r].cells[c];
    if (cell && !seen.has(keyOf(r,c))){
      const p=cellPos(r,c);
      falling.push({x:p.x,y:p.y,vx:(Math.random()-0.5)*180,vy:-120-Math.random()*120,rot:0,vr:(Math.random()-0.5)*6,cell});
      rows[r].cells[c]=null; n++;
    }
  }
  if (n){ score += n*20; popup(W/2, H*0.45, '+'+n*20+' chute !'); sfx.fall(); }
  return n;
}
function trimEmptyRows(){
  while (rows.length && rows[rows.length-1].cells.every(c=>!c)) rows.pop();
}
function touchesDanger(){
  for (let r=0;r<rows.length;r++) for (let c=0;c<rows[r].cells.length;c++)
    if (rows[r].cells[c] && cellPos(r,c).y + R > dangerY) return true;
  return false;
}

/* ---------- Tir ---------- */
function shoot(){
  if (state!=='playing' || bullet) return;
  const sp = Math.max(900, H*1.5) * (evActive('dew')?0.55:1);
  const special = loadedSpecial; loadedSpecial=null;
  bullet = { x:shX, y:shY, vx:Math.cos(aimAngle)*sp, vy:Math.sin(aimAngle)*sp,
             t: special?0:cur, special: special||null };
  if (!special){ cur = nxt; nxt = pickType(); }
  if (special) sfx.special(); else sfx.shoot();
  syncHud();
}
function hitCellAt(x,y,factor){
  const f=(factor||1.75)*R;
  for (let r=0;r<rows.length;r++){
    const row=rows[r];
    for (let c=0;c<row.cells.length;c++){
      if (!row.cells[c]) continue;
      const p=cellPos(r,c);
      const dx=p.x-x, dy=p.y-y;
      if (dx*dx+dy*dy < f*f) return [r,c];
    }
  }
  return null;
}
function snapBullet(bx,by,t){
  let r = Math.round((by - boardTop - R)/rowH);
  if (r<0) r=0;
  while (rows.length <= r+1){
    const last = rows[rows.length-1];
    rows.push(makeRow(last ? !last.shifted : false, false));
  }
  let best=null, bestD=Infinity, bestAny=null, bestAnyD=Infinity;
  for (let rr=Math.max(0,r-1); rr<=r+1; rr++){
    const row=rows[rr];
    for (let c=0;c<row.cells.length;c++){
      if (row.cells[c]) continue;
      const p=cellPos(rr,c);
      const d=(p.x-bx)**2 + (p.y-by)**2;
      const anchored = rr===0 || neighbors(rr,c).some(([a,b])=>rows[a].cells[b]);
      if (anchored && d<bestD){ best=[rr,c]; bestD=d; }
      if (d<bestAnyD){ bestAny=[rr,c]; bestAnyD=d; }
    }
  }
  const [pr,pc] = best || bestAny;
  rows[pr].cells[pc]=makeCell(t);
  lastPlaced={r:pr,c:pc,t:0};
  return [pr,pc];
}

/* impacts des tirs */
function bulletImpact(){
  const b=bullet; bullet=null;
  if (!b.special){
    const [pr,pc]=snapBullet(b.x,b.y,b.t);
    sfx.stick();
    const group = matchGroup(pr,pc);
    let popped=0;
    if (group.length>=3){ lastPlaced=null; popped=popCells(group); dropFloaters(); }
    postTurn({shot:true, popped, placed:[pr,pc]});
    return;
  }
  if (b.special==='bomb'){
    const targets=[];
    for (let r=0;r<rows.length;r++) for (let c=0;c<rows[r].cells.length;c++){
      if (!rows[r].cells[c]) continue;
      const p=cellPos(r,c);
      if ((p.x-b.x)**2+(p.y-b.y)**2 < (2.7*R)**2) targets.push([r,c]);
    }
    explode(b.x,b.y,'#3a2433'); ringsFx.push({x:b.x,y:b.y,life:.5,max:.5,col:'#ff6b81'});
    popCells(targets); dropFloaters();
    postTurn({shot:false});
    return;
  }
  if (b.special==='bolt'){
    let r = Math.round((b.y - boardTop - R)/rowH);
    r = Math.max(0, Math.min(rows.length-1, r));
    const targets=[];
    if (rows[r]) for (let c=0;c<rows[r].cells.length;c++) if (rows[r].cells[c]) targets.push([r,c]);
    bolts.push({y: boardTop + R + r*rowH, life:.35, max:.35});
    popCells(targets); dropFloaters();
    postTurn({shot:false});
    return;
  }
  if (b.special==='rainbow'){
    const [pr,pc]=snapBullet(b.x,b.y,0);
    rows[pr].cells[pc]={prism:true};
    lastPlaced={r:pr,c:pc,t:0};
    // trouve le plus grand groupe voisin
    let best=null;
    for (const [x,y] of neighbors(pr,pc)){
      const cell=rows[x].cells[y];
      if (!matchable(cell) || cell.prism) continue;
      const g = matchGroup(x,y);
      if (!best || g.length>best.length) best=g;
    }
    if (best && best.length>=2){
      lastPlaced=null;
      popCells(best.concat([[pr,pc]]));
      dropFloaters();
    } else {
      const t = best ? rows[best[0][0]].cells[best[0][1]].t : randPal();
      rows[pr].cells[pc]=makeCell(t);
    }
    postTurn({shot:false});
    return;
  }
}

/* ---------- Tour de jeu ---------- */
function postTurn(o){
  trimEmptyRows();
  if (boss){
    if (boss.hp<=0){ bossDefeated(); return; }
    if (gridEmpty() || rows.length<2){
      bossSummon(2);
      banner('⬇️ '+boss.def.name+' appelle des renforts !');
    }
  } else if (gridEmpty()){ finishWin(); return; }
  if (touchesDanger()){ loseLevel(); return; }
  if (o.shot){
    if (boss){
      boss.atkIn--;
      if (boss.atkIn<=0){ bossAttack(); if (state!=='playing') return; }
    } else {
      shotsUntilDrop -= (evActive('rain')?2:1);
      if (shotsUntilDrop<=0){
        insertTopRow();
        shotsUntilDrop = LEVELS[levelIndex].drop;
        sfx.fall();
        if (touchesDanger()){ syncHud(); loseLevel(); return; }
      }
    }
    tickEvents();
  }
  syncHud();
}

/* ---------- Événements météo ---------- */
function evActive(id){ return activeEvent && activeEvent.id===id; }
function pickEvent(){
  const pool = LEVELS[levelIndex].events.filter(id=>{
    if (id===lastEvent) return false;
    if (lastEvent && EVENTS[lastEvent].bad && EVENTS[id].bad) return false;
    return true;
  });
  const src = pool.length?pool:LEVELS[levelIndex].events;
  return src[Math.random()*src.length|0];
}
function tickEvents(){
  if (activeEvent){
    activeEvent.left--;
    if (activeEvent.left<=0) activeEvent=null;
  } else if (pendingEvent){
    activateEvent(pendingEvent); pendingEvent=null;
  } else {
    evCooldown--;
    const pool=LEVELS[levelIndex].events;
    if (evCooldown<=0 && pool.length){
      pendingEvent = pickEvent();
      const E=EVENTS[pendingEvent];
      banner(E.icon+' '+E.name+' arrive !');
      if (E.bad) sfx.bad();
      evCooldown = 8 + (Math.random()*4|0);
    }
  }
}
function activateEvent(id){
  const E=EVENTS[id]; lastEvent=id;
  if (E.dur>0){
    activeEvent={id, left:E.dur};
    if (id==='wind') windDir = Math.random()<0.5?-1:1;
    banner(E.icon+' '+E.name+' !');
    return;
  }
  // événements instantanés
  if (id==='wasp'){
    const p=LEVELS[levelIndex].pal.filter(t=>t!==cur);
    cur = p[Math.random()*p.length|0];
    banner('🐝 La guêpe a volé ton fruit !'); sfx.bad();
  } else if (id==='basket'){
    gauge=100; banner('🧺 Panier surprise : jauge pleine !'); sfx.special();
  } else if (id==='toucan'){
    const cands=[];
    for (let r=0;r<rows.length;r++) for (let c=0;c<rows[r].cells.length;c++)
      if (matchable(rows[r].cells[c]) && !rows[r].cells[c].prism) cands.push([r,c]);
    if (cands.length){
      const [r,c]=cands[Math.random()*cands.length|0];
      popCells(matchGroup(r,c).slice(0,5));
      dropFloaters(); trimEmptyRows();
      banner('🐦 Le toucan emporte une grappe !');
      if (!boss && gridEmpty()){ finishWin(); return; }
    }
  }
}

/* ---------- Boss ---------- */
function bossSummon(n){
  for (let i=0;i<n;i++) insertTopRow();
}
function bossPool(){
  if (boss.key!=='baron') return boss.def.atks;
  const pct = boss.hp/boss.def.hp;
  if (pct>2/3) return ['slime','row'];
  if (pct>1/3) return ['freeze','wind'];
  return ['row','night','slime'];
}
function bossAttack(){
  const pool=bossPool();
  const atk = pool[Math.random()*pool.length|0];
  const I=ATK_INFO[atk];
  banner('💢 '+boss.def.name+' : '+I.txt);
  shakeAmp=Math.min(8, shakeAmp+4); sfx.bad();
  const plainFruits=()=>{
    const out=[];
    for (let r=0;r<rows.length;r++) for (let c=0;c<rows[r].cells.length;c++){
      const cell=rows[r].cells[c];
      if (cell && !cell.wood && !cell.prism && !cell.ice && !cell.rot && !cell.cage) out.push([r,c]);
    }
    return out;
  };
  if (atk==='slime'){
    const f=plainFruits();
    for (let i=0;i<3 && f.length;i++){
      const j=Math.random()*f.length|0; const [r,c]=f.splice(j,1)[0];
      rows[r].cells[c].rot=true;
      const p=cellPos(r,c); explode(p.x,p.y,'#8d9a5c');
    }
  } else if (atk==='freeze'){
    const f=plainFruits();
    for (let i=0;i<4 && f.length;i++){
      const j=Math.random()*f.length|0; const [r,c]=f.splice(j,1)[0];
      rows[r].cells[c].ice=1;
      const p=cellPos(r,c); explode(p.x,p.y,'#bfe3ff');
    }
    sfx.freeze();
  } else if (atk==='wind'){
    activeEvent={id:'wind',left:2}; windDir=Math.random()<0.5?-1:1; lastEvent='wind';
  } else if (atk==='night'){
    activeEvent={id:'night',left:2}; lastEvent='night';
  } else if (atk==='row'){
    insertTopRow();
  }
  boss.atkIn = boss.def.every;
  if (touchesDanger()) loseLevel();
}
function bossDefeated(){
  state='won';
  const all=[];
  for (let r=0;r<rows.length;r++) for (let c=0;c<rows[r].cells.length;c++)
    if (rows[r].cells[c]) all.push([r,c]);
  popCells(all);
  const bp=makeMisc(CHAR_DRAW[boss.key], 30*dpr);
  explode(W/2, boardTop-44, '#ffbe2e'); explode(W/2, boardTop-44, '#ff6b81');
  shakeAmp=8; sfx.win();
  finishWin(true);
}

/* ---------- Fin de niveau ---------- */
function starsFor(i, sc){
  const b = LEVELS[i].boss ? 1 : 0;
  const s2 = 900 + i*110 + b*600, s3 = 1500 + i*190 + b*900;
  return sc>=s3 ? 3 : sc>=s2 ? 2 : 1;
}
function finishWin(isBoss){
  if (state!=='won') state='won';
  bullet=null;
  score += isBoss ? 1500 : 500;
  const i=levelIndex;
  const st = starsFor(i, score);
  const prevStars = save.stars[i]||0;
  const newStars = Math.max(prevStars, st);
  const coinsWon = 5 + Math.max(0, newStars-prevStars)*2;
  save.coins += coinsWon;
  save.stars[i] = newStars;
  if (score > (save.best[i]||0)) save.best[i]=score;
  save.unlocked = Math.max(save.unlocked, Math.min(i+2, LEVELS.length));
  Storage.save(save);
  const showCard = ()=>{
    $('winStars').innerHTML = [1,2,3].map(n=>`<span class="${n<=st?'on':'off'}">★</span>`).join('');
    $('winTitle').textContent = i===LEVELS.length-1 ? 'Le Verger est libre !' :
                                 LEVELS[i].boss ? 'Boss vaincu !' : 'Niveau terminé !';
    $('winScore').textContent = score;
    $('winBest').textContent = 'Record : '+save.best[i];
    $('winCoins').textContent = '🪙 +'+coinsWon;
    $('btnNext').hidden = i+1 >= LEVELS.length;
    syncHud();
    setTimeout(()=>{ if(state==='won') ovWin.hidden=false; }, 500);
  };
  const post = DIALOG_AFTER[i];
  if (post && !save.seen[post]){
    setTimeout(()=>{ if(state==='won') showDialog(post, showCard); }, 700);
  } else {
    if (!isBoss) sfx.win();
    showCard();
  }
}
function loseLevel(){
  state='lost'; bullet=null;
  Storage.save(save);
  $('loseScore').textContent=score;
  sfx.lose();
  setTimeout(()=>{ if(state==='lost') ovLose.hidden=false; }, 400);
}

/* ---------- Effets visuels ---------- */
function explode(x,y,col){
  for (let i=0;i<3;i++){
    const a = Math.random()*Math.PI*2, sp = 150+Math.random()*220;
    chunks.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-160,rot:Math.random()*6,vr:(Math.random()-0.5)*14,
                 a:Math.random()*6,size:R*(0.4+Math.random()*0.3),col,life:0.9});
  }
  for (let i=0;i<9;i++){
    const a = Math.random()*Math.PI*2, sp = 120+Math.random()*280;
    particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-100,life:0.5+Math.random()*0.35,max:0.85,col,r:2.5+Math.random()*3.5});
  }
  for (let i=0;i<2;i++){
    const a = Math.random()*Math.PI*2, sp = 200+Math.random()*200;
    particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-120,life:0.4,max:0.4,col:'#fff',r:1.8+Math.random()*2});
  }
  ringsFx.push({x,y,life:0.4,max:0.4,col});
}
function popup(x,y,text){ popups.push({x,y,text,life:1}); }

/* ---------- Pause (contrat Playables : tout s'arrête) ---------- */
function pauseGame(){
  if (state!=='playing') return;
  state='paused';
  cancelAnimationFrame(rafId); rafId=0;
  ovPause.hidden=false;
}
function resumeGame(){
  if (state!=='paused') return;
  state='playing'; ovPause.hidden=true;
  startLoop();
}
window.GameApp = { pause:pauseGame, resume:resumeGame };
// Sur YouTube Playables :
//   ytgame.system.onPause(GameApp.pause); ytgame.system.onResume(GameApp.resume);
document.addEventListener('visibilitychange', ()=>{ if (document.hidden) pauseGame(); });

/* ---------- Boucle ---------- */
function startLoop(){
  lastT = performance.now();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(tick);
}
function tick(now){
  const dt = Math.min((now-lastT)/1000, 0.05); lastT=now;
  if (state==='playing' || state==='won' || state==='lost') update(dt);
  render(now/1000);
  if (state==='playing' || state==='won' || state==='lost') rafId=requestAnimationFrame(tick);
}
const WIND_AX = 500;
function update(dt){
  if (bullet && state==='playing'){
    if (evActive('wind')) bullet.vx += windDir*WIND_AX*dt;
    bullet.x += bullet.vx*dt; bullet.y += bullet.vy*dt;
    if (bullet.x < boardL+R){ bullet.x = 2*(boardL+R)-bullet.x; bullet.vx=-bullet.vx; }
    if (bullet.x > boardR-R){ bullet.x = 2*(boardR-R)-bullet.x; bullet.vx=-bullet.vx; }
    if (bullet && bullet.special==='pierce'){
      let hit = hitCellAt(bullet.x,bullet.y,1.2);
      let guard=0;
      while (hit && guard++<6){ popCells([hit]); hit=hitCellAt(bullet.x,bullet.y,1.2); }
      if (bullet.y - R <= boardTop){
        bullet=null; dropFloaters(); postTurn({shot:false});
      }
    } else if (bullet && (bullet.y - R <= boardTop || hitCellAt(bullet.x,bullet.y))){
      bulletImpact();
    }
  }
  if (lastPlaced){ lastPlaced.t += dt; if (lastPlaced.t > 0.35) lastPlaced=null; }
  if (boss && boss.flash>0) boss.flash -= dt;
  if (pepinJump>0) pepinJump=Math.max(0,pepinJump-dt);
  shakeAmp = Math.max(0, shakeAmp - shakeAmp*9*dt - 0.4*dt);
  for (let i=falling.length-1;i>=0;i--){
    const f=falling[i];
    f.vy += 1500*dt; f.x += f.vx*dt; f.y += f.vy*dt; f.rot += f.vr*dt;
    if (f.y > H + R*2) falling.splice(i,1);
  }
  for (let i=chunks.length-1;i>=0;i--){
    const c=chunks[i];
    c.vy += 1300*dt; c.x += c.vx*dt; c.y += c.vy*dt; c.rot += c.vr*dt; c.life -= dt;
    if (c.life<=0 || c.y > H+R*2) chunks.splice(i,1);
  }
  for (let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.vy += 900*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt;
    if (p.life<=0) particles.splice(i,1);
  }
  for (let i=ringsFx.length-1;i>=0;i--){ ringsFx[i].life-=dt; if (ringsFx[i].life<=0) ringsFx.splice(i,1); }
  for (let i=bolts.length-1;i>=0;i--){ bolts[i].life-=dt; if (bolts[i].life<=0) bolts.splice(i,1); }
  for (let i=popups.length-1;i>=0;i--){
    popups[i].y -= 55*dt; popups[i].life -= dt*0.9;
    if (popups[i].life<=0) popups.splice(i,1);
  }
}

/* ---------- Rendu ---------- */
function drawSpecialBullet(x,y,kind){
  if (kind==='rainbow'){ ctx.drawImage(spr.prism, x-R*1.6, y-R*1.6, R*3.2, R*3.2); return; }
  if (IMG[kind]){ const d=R*(IMG_SCALE[kind]||2.2); ctx.drawImage(IMG[kind], x-d/2, y-d/2, d, d); return; }
  if (kind==='bomb'){
    ctx.beginPath(); ctx.arc(x,y,R*0.85,0,7); ctx.fillStyle='#3a2a44'; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x-R*0.3,y-R*0.35,R*0.2,R*0.11,-0.6,0,7); ctx.fillStyle='rgba(255,255,255,.4)'; ctx.fill();
    ctx.strokeStyle='#8a6240'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x,y-R*0.8); ctx.quadraticCurveTo(x+R*0.3,y-R*1.1,x+R*0.5,y-R*0.95); ctx.stroke();
    ctx.fillStyle='#ffbe2e'; star5(x+R*0.55,y-R*0.95,R*0.22); ctx.fill();
    return;
  }
  if (kind==='bolt'){
    ctx.beginPath(); ctx.arc(x,y,R*0.85,0,7); ctx.fillStyle='#ffd43b'; ctx.fill();
    ctx.strokeStyle='rgba(170,120,0,.5)'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#fff';
    ctx.beginPath();
    ctx.moveTo(x+R*0.15,y-R*0.55); ctx.lineTo(x-R*0.25,y+R*0.1); ctx.lineTo(x,y+R*0.1);
    ctx.lineTo(x-R*0.15,y+R*0.55); ctx.lineTo(x+R*0.3,y-R*0.1); ctx.lineTo(x+R*0.05,y-R*0.1);
    ctx.closePath(); ctx.fill();
    return;
  }
  if (kind==='pierce'){
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle='#43b85c';
    for (const a of [-0.5,0,0.5]){
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0,-R*0.75,R*0.14,R*0.35,0,0,7); ctx.fill(); ctx.restore();
    }
    const gr=ctx.createRadialGradient(-R*0.2,-R*0.2,R*0.1,0,0,R);
    gr.addColorStop(0,'#ffe08a'); gr.addColorStop(1,'#f0a830');
    ctx.beginPath(); ctx.ellipse(0,R*0.1,R*0.65,R*0.8,0,0,7); ctx.fillStyle=gr; ctx.fill();
    ctx.strokeStyle='rgba(150,90,10,.45)'; ctx.lineWidth=2; ctx.stroke();
    ctx.strokeStyle='rgba(150,90,10,.35)'; ctx.lineWidth=1.5;
    for (const d of [-1,1]) for (const o of [-0.4,0,0.4]){
      ctx.beginPath(); ctx.moveTo(-R*0.6, R*0.1+o*R + d*R*0.3); ctx.lineTo(R*0.6, R*0.1+o*R - d*R*0.3); ctx.stroke();
    }
    ctx.restore();
    return;
  }
}
function render(tNow){
  ctx.clearRect(0,0,W,H);
  // léger voile blanc pour garder la grille lisible devant le fond illustré
  if (bgImgOn){ ctx.fillStyle='rgba(255,255,255,.16)'; ctx.fillRect(0,0,W,H); }
  if (boardL > 1){
    ctx.fillStyle='rgba(255,170,205,.32)';
    ctx.fillRect(0,0,boardL,H); ctx.fillRect(boardR,0,W-boardR,H);
    ctx.strokeStyle='rgba(255,120,170,.7)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(boardL,0); ctx.lineTo(boardL,H); ctx.moveTo(boardR,0); ctx.lineTo(boardR,H); ctx.stroke();
  }
  ctx.save();
  if (shakeAmp>0.15) ctx.translate((Math.random()-0.5)*shakeAmp, (Math.random()-0.5)*shakeAmp);

  // boss
  if (boss){
    const bob = Math.sin(tNow*2.2)*3;
    // lianes
    ctx.strokeStyle='rgba(110,170,90,.5)'; ctx.lineWidth=4; ctx.lineCap='round';
    for (const k of [-1,0,1]){
      ctx.beginPath();
      ctx.moveTo(W/2 + k*30, 70+bob);
      ctx.quadraticCurveTo(W/2 + k*70, 85, W/2 + k*(boardR-boardL)/3, boardTop+2);
      ctx.stroke();
    }
    if (spr.boss) ctx.drawImage(spr.boss, W/2-54, 46-54+bob, 108, 108);
    if (boss.flash>0){
      ctx.globalAlpha=Math.min(1,boss.flash*3);
      ctx.beginPath(); ctx.arc(W/2, 46+bob, 40, 0, 7); ctx.fillStyle='#fff'; ctx.fill();
      ctx.globalAlpha=1;
    }
    // barre de vie
    const bw=W*0.56, bx=(W-bw)/2, by=6;
    ctx.fillStyle='#fff'; ctx.strokeStyle='#ff9dc0'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(bx,by,bw,10,5); ctx.fill(); ctx.stroke();
    const pct=Math.max(0,boss.hp/boss.def.hp);
    ctx.fillStyle = pct>0.5?'#57c878':pct>0.25?'#ffbe2e':'#ff5d6e';
    if (pct>0){ ctx.beginPath(); ctx.roundRect(bx+1.5,by+1.5,(bw-3)*pct,7,3.5); ctx.fill(); }
  }

  // ligne de danger
  ctx.save();
  ctx.setLineDash([8,8]); ctx.lineWidth=2.5; ctx.strokeStyle='rgba(255,90,130,.6)';
  ctx.beginPath(); ctx.moveTo(boardL+6,dangerY); ctx.lineTo(boardR-6,dangerY); ctx.stroke();
  ctx.restore();

  // grille
  for (let r=0;r<rows.length;r++){
    const row=rows[r];
    for (let c=0;c<row.cells.length;c++){
      const cell=row.cells[c];
      if (!cell) continue;
      const p=cellPos(r,c);
      const blink = ((tNow + r*0.73 + c*1.31) % 3.8) < 0.13;
      let sc=1;
      if (lastPlaced && lastPlaced.r===r && lastPlaced.c===c){
        const k=lastPlaced.t/0.35;
        sc = 1 + 0.22*Math.sin(Math.PI*k)*(1-k*0.5);
      }
      drawCell(p.x,p.y,cell,sc,blink,tNow);
    }
  }

  // visée
  if (state==='playing' && !bullet){
    const sp = Math.max(900, H*1.5) * (evActive('dew')?0.55:1);
    let x=shX, y=shY, vx=Math.cos(aimAngle)*sp, vy=Math.sin(aimAngle)*sp;
    const dt=0.008; let d=0;
    ctx.fillStyle = aiming ? 'rgba(255,90,140,.85)' : 'rgba(170,110,150,.4)';
    for (let i=0;i<400;i++){
      if (evActive('wind')) vx += windDir*WIND_AX*dt;
      x+=vx*dt; y+=vy*dt; d+=Math.hypot(vx,vy)*dt;
      if (x<boardL+R){ x=2*(boardL+R)-x; vx=-vx; }
      if (x>boardR-R){ x=2*(boardR-R)-x; vx=-vx; }
      if (y - R <= boardTop || hitCellAt(x,y)) break;
      if (d>18){ d=0; ctx.beginPath(); ctx.arc(x,y,2.6,0,7); ctx.fill(); }
    }
  }

  // canon + fruit courant / spécial chargé
  ctx.beginPath(); ctx.arc(shX,shY,R+9,0,7);
  ctx.fillStyle='rgba(255,120,165,.1)'; ctx.fill();
  ctx.lineWidth=2.5; ctx.strokeStyle='rgba(255,120,165,.45)'; ctx.stroke();
  if (state==='playing' || state==='paused' || state==='dialog'){
    if (loadedSpecial) drawSpecialBullet(shX,shY,loadedSpecial);
    else drawCell(shX,shY,{t:cur,ice:0},1.06,false,tNow);
  }

  // Pépin à côté du lance-fruits (il saute sur les gros combos)
  if (spr.pepin && state!=='home'){
    const s=spr.pepin.width/dpr;
    let jy=0;
    if (pepinJump>0){ const k=1-pepinJump/0.45; jy=Math.sin(Math.PI*k)*R*0.9; }
    ctx.drawImage(spr.pepin, shX-R*3.4-s/2, shY+R*0.15-s/2-jy, s, s);
  }

  // projectile / chutes
  if (bullet){
    if (bullet.special) drawSpecialBullet(bullet.x,bullet.y,bullet.special);
    else drawCell(bullet.x,bullet.y,{t:bullet.t,ice:0},1,false,tNow);
  }
  for (const f of falling){
    ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(f.rot);
    drawCell(0,0,f.cell,1,true,tNow);
    ctx.restore();
  }

  // éclairs (citron éclair)
  for (const b of bolts){
    ctx.globalAlpha = b.life/b.max;
    ctx.fillStyle='#fff7c0';
    ctx.fillRect(boardL, b.y-R*0.5, boardR-boardL, R);
    ctx.fillStyle='#ffd43b';
    ctx.fillRect(boardL, b.y-R*0.15, boardR-boardL, R*0.3);
  }
  ctx.globalAlpha=1;

  // quartiers
  for (const c of chunks){
    ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.rot);
    ctx.globalAlpha = Math.min(1, c.life*2.5);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,c.size, c.a, c.a+1.3); ctx.closePath();
    ctx.fillStyle=c.col; ctx.fill();
    ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,.65)'; ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha=1;

  // ondes de choc
  for (const rg of ringsFx){
    const k = 1 - rg.life/rg.max;
    ctx.globalAlpha = rg.life/rg.max;
    ctx.beginPath(); ctx.arc(rg.x, rg.y, R*0.5 + k*R*2.3, 0, 7);
    ctx.lineWidth = 3*(1-k)+1; ctx.strokeStyle=rg.col; ctx.stroke();
  }
  ctx.globalAlpha=1;

  // gouttes
  for (const p of particles){
    ctx.globalAlpha = Math.max(0, p.life/p.max);
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7);
    ctx.fillStyle=p.col; ctx.fill();
  }
  ctx.globalAlpha=1;

  // météo
  if (evActive('wind')){
    ctx.strokeStyle='rgba(140,180,220,.4)'; ctx.lineWidth=2; ctx.lineCap='round';
    for (let i=0;i<6;i++){
      const yy = 40 + (i*67)%Math.max(60,(H-200));
      const xx = ((tNow*220*windDir + i*140) % (W+120) + W+120) % (W+120) - 60;
      ctx.beginPath(); ctx.moveTo(xx,yy); ctx.lineTo(xx+34*windDir,yy+4); ctx.stroke();
    }
  }
  if (evActive('rain')){
    ctx.strokeStyle='rgba(110,160,255,.4)'; ctx.lineWidth=2; ctx.lineCap='round';
    for (let i=0;i<12;i++){
      const xx = (i*83)%W;
      const yy = ((tNow*430 + i*97) % (H+40)) - 20;
      ctx.beginPath(); ctx.moveTo(xx,yy); ctx.lineTo(xx-3,yy+12); ctx.stroke();
    }
  }
  if (evActive('night')){
    const p = lastPointer || {x:shX, y:shY-80};
    const gr = ctx.createRadialGradient(p.x,p.y,R*2.2,p.x,p.y,R*6.5);
    gr.addColorStop(0,'rgba(25,14,45,0)');
    gr.addColorStop(1,'rgba(25,14,45,.88)');
    ctx.fillStyle=gr;
    ctx.fillRect(0,0,W,H);
  }
  if (evActive('sun')){
    const gr = ctx.createLinearGradient(0,0,0,120);
    gr.addColorStop(0,'rgba(255,215,110,.28)'); gr.addColorStop(1,'rgba(255,215,110,0)');
    ctx.fillStyle=gr; ctx.fillRect(0,0,W,120);
  }

  // popups de score
  ctx.font = `800 ${Math.round(R*0.95)}px Nunito, sans-serif`;
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
function banner(txt){
  const el=$('banner');
  el.textContent=txt;
  el.classList.remove('show'); void el.offsetWidth;
  el.classList.add('show');
}
function syncHud(){
  $('lvlNum').textContent = levelIndex+1;
  $('scoreNum').textContent = score;
  $('coinsGame').textContent = save.coins;
  $('coinsNum').textContent = save.coins;
  if (boss){
    $('dropLabel').textContent='👊';
    $('dropNum').textContent=boss.atkIn;
    $('dropStat').classList.toggle('hot', boss.atkIn<=1);
  } else {
    $('dropLabel').textContent='⬇';
    $('dropNum').textContent=shotsUntilDrop;
    $('dropStat').classList.toggle('hot', shotsUntilDrop<=2);
  }
  $('btnMute').textContent = save.muted ? '🔇' : '🔊';
  $('gaugeFill').style.width = gauge+'%';
  $('gaugeTxt').textContent = loadedSpecial ? SPECIALS[loadedSpecial].icon+' prêt !' : 'Jus '+Math.round(gauge)+'%';
  $('gaugeWrap').classList.toggle('full', gauge>=100 && !loadedSpecial);
  const chips=[];
  if (activeEvent){
    const E=EVENTS[activeEvent.id];
    chips.push(`<div class="chip ${E.bad?'bad':''}">${E.icon} ${activeEvent.left}</div>`);
  } else if (pendingEvent){
    const E=EVENTS[pendingEvent];
    chips.push(`<div class="chip ${E.bad?'bad':''}">${E.icon} arrive…</div>`);
  }
  $('chips').innerHTML = chips.join('');
  drawNextPreview();
}

/* ---------- Jauge & tirs spéciaux ---------- */
function buildSpecRow(container, withCost, onPick, selected){
  container.textContent='';
  for (const [id,S] of Object.entries(SPECIALS)){
    const b=document.createElement('button');
    b.className='spec'+(selected===id?' sel':'');
    b.innerHTML=`<span class="sicon">${S.icon}</span>
      <span class="sbody"><span class="sname">${S.name}</span><span class="sdesc">${S.desc}</span></span>
      ${withCost?`<span class="scost">🪙 ${S.cost}</span>`:''}`;
    if (withCost && save.coins < S.cost && selected!==id) b.disabled=true;
    b.addEventListener('click', ()=>onPick(id));
    container.appendChild(b);
  }
}
$('gaugeWrap').addEventListener('click', ()=>{
  if (state!=='playing') return;
  if (loadedSpecial){ gauge=100; loadedSpecial=null; syncHud(); return; }
  if (gauge<100) return;
  buildSpecRow($('chooseRow'), false, id=>{
    loadedSpecial=id; gauge=0; ovChoose.hidden=true; sfx.special(); syncHud();
  });
  ovChoose.hidden=false;
});
$('btnChooseCancel').addEventListener('click', ()=>{ ovChoose.hidden=true; });

/* ---------- Entrées ---------- */
function setAim(px,py){
  lastPointer={x:px,y:py};
  let a = Math.atan2(py-shY, px-shX);
  const lim = 0.22;
  if (a > -lim && a <= Math.PI/2) a = -lim;
  else if ((a > Math.PI/2 && a <= Math.PI) || a < -Math.PI+lim) a = -Math.PI+lim;
  aimAngle=a;
}
cv.addEventListener('pointerdown', e=>{
  if (state!=='playing') return;
  aiming=true; cv.setPointerCapture(e.pointerId);
  const r=cv.getBoundingClientRect(); setAim(e.clientX-r.left, e.clientY-r.top);
});
cv.addEventListener('pointermove', e=>{
  if (!aiming) return;
  const r=cv.getBoundingClientRect(); setAim(e.clientX-r.left, e.clientY-r.top);
});
cv.addEventListener('pointerup', ()=>{
  if (!aiming) return;
  aiming=false;
  if (state==='playing') shoot();
});
document.addEventListener('keydown', e=>{
  if (state!=='playing') return;
  if (e.key==='ArrowLeft'){ aimAngle=Math.max(-Math.PI+0.22, aimAngle-0.06); }
  else if (e.key==='ArrowRight'){ aimAngle=Math.min(-0.22, aimAngle+0.06); }
  else if (e.key===' '||e.key==='ArrowUp'){ e.preventDefault(); shoot(); }
  else if (e.key==='Escape'){ pauseGame(); }
});

/* ---------- Boutons ---------- */
$('btnPause').addEventListener('click', pauseGame);
$('btnResume').addEventListener('click', resumeGame);
$('btnSwap').addEventListener('click', ()=>{
  if (state!=='playing' || bullet || loadedSpecial) return;
  [cur,nxt]=[nxt,cur]; sfx.swap(); syncHud();
});
$('btnMute').addEventListener('click', ()=>{
  save.muted=!save.muted; Storage.save(save); syncHud();
});
function toMenu(then){
  state='home'; cancelAnimationFrame(rafId); rafId=0;
  Storage.save(save);
  gameEl.hidden=true; homeEl.hidden=false;
  ovPause.hidden=ovWin.hidden=ovLose.hidden=ovChoose.hidden=true;
  renderHome(then);
}
for (const id of ['btnMenu','btnMenu1','btnMenu2','btnMenu3']) $(id).addEventListener('click', ()=>toMenu());
for (const id of ['btnRestart1','btnRestart2','btnRestart3']) $(id).addEventListener('click', ()=>startLevel(levelIndex));
$('btnNext').addEventListener('click', ()=>{ const n=levelIndex+1; toMenu(()=>openLevel(n)); });

/* ---------- Carte du verger ---------- */
function starsHtml(n){
  return [1,2,3].map(k=>`<span class="${k<=n?'on':'off'}">★</span>`).join('');
}
const WCOL = [
  {bg:['#effbe4','#d2eebc'], road:'#fff3dc', edge:'#e0c193'},
  {bg:['#f7fbff','#d9e9fa'], road:'#ffffff', edge:'#b5d1ee'},
  {bg:['#f3e8fa','#dac6ec'], road:'#f8f0fd', edge:'#c3a8dc'},
];
const MS=92, MG=84, MBOT=96, MTOP=250;
const MAP={W:0,H:0,pts:[],seg:[],bands:[],deco:[]};
let lastMapW=0, mapRaf=0, heroStage=0, evoThen=null;

function rng(seed){
  return ()=>{
    seed=seed+0x6D2B79F5|0;
    let t=Math.imul(seed^seed>>>15,1|seed);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}

function mapLayout(){
  const W=$('mapScroll').clientWidth || 360;
  const amp=Math.min(W*0.3,150);
  const yb=i=>MBOT + i*MS + LEVELS[i].w*MG;
  const H=yb(LEVELS.length-1) + MTOP;
  const pts=LEVELS.map((L,i)=>({
    x: L.boss ? W/2 : W/2 + Math.sin(i*1.1+0.4)*amp,
    y: H - yb(i)
  }));
  const seg=[];
  for (let i=0;i<pts.length-1;i++){
    const p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(pts.length-1,i+2)];
    const s=[];
    for (let k=0;k<=20;k++){
      const t=k/20, t2=t*t, t3=t2*t;
      const cr=(a,b,c,d)=>0.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);
      s.push({x:cr(p0.x,p1.x,p2.x,p3.x), y:cr(p0.y,p1.y,p2.y,p3.y)});
    }
    seg.push(s);
  }
  const bands=WORLDS.map((_,w)=>{
    const f=LEVELS.findIndex(L=>L.w===w);
    const l=f + LEVELS.filter(L=>L.w===w).length - 1;
    const bottom = w===0 ? H : (pts[f].y + pts[f-1].y)/2;
    const top = w===WORLDS.length-1 ? 0 : (pts[l].y + pts[l+1].y)/2;
    return {top,bottom,first:f,last:l};
  });
  Object.assign(MAP,{W,H,pts,seg,bands});
  MAP.deco=makeDeco();
  lastMapW=W;
}

function makeDeco(){
  const rnd=rng(42), out=[];
  MAP.bands.forEach((b,w)=>{
    const n=Math.round((b.bottom-b.top)/46);
    for (let k=0;k<n;k++){
      for (let tries=0;tries<14;tries++){
        const x=16+rnd()*(MAP.W-32), y=b.top+26+rnd()*(b.bottom-b.top-52);
        if (y < MTOP-30 && Math.abs(x-MAP.W/2) < 120) continue;
        let ok=true;
        for (const s of MAP.seg){
          for (const p of s){ if ((p.x-x)**2+(p.y-y)**2 < 50*50){ ok=false; break; } }
          if (!ok) break;
        }
        if (ok) for (const d of out) if ((d.x-x)**2+(d.y-y)**2 < 36*36){ ok=false; break; }
        if (!ok) continue;
        out.push({x,y,w,kind:rnd()*3|0,s:0.85+rnd()*0.45});
        break;
      }
    }
  });
  out.sort((a,b)=>a.y-b.y);
  return out;
}

/* décor de chaque monde */
const DECO = [
  [ // Le Potager : buisson à baies, fleur, carotte
    (g,x,y,s)=>{
      g.fillStyle='#78cc6a';
      for (const [dx,dy,r] of [[-9,2,10],[9,2,10],[0,-6,12]]){ g.beginPath(); g.arc(x+dx*s,y+dy*s,r*s,0,7); g.fill(); }
      g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.arc(x-3*s,y-11*s,3.5*s,0,7); g.fill();
      g.fillStyle='#ff5d7a';
      for (const [dx,dy] of [[-8,0],[6,-5],[10,4]]){ g.beginPath(); g.arc(x+dx*s,y+dy*s,2.6*s,0,7); g.fill(); }
    },
    (g,x,y,s)=>{
      g.strokeStyle='#5fb860'; g.lineWidth=2*s;
      g.beginPath(); g.moveTo(x,y+4*s); g.lineTo(x,y+15*s); g.stroke();
      g.fillStyle=['#ffb3cf','#fff3a0','#c9b3ff'][Math.abs(Math.floor(x*7+y))%3];
      for (let k=0;k<5;k++){ const a=k*1.2566; g.beginPath(); g.arc(x+Math.cos(a)*5*s,y+Math.sin(a)*5*s,4*s,0,7); g.fill(); }
      g.fillStyle='#ffcf2e'; g.beginPath(); g.arc(x,y,3.2*s,0,7); g.fill();
    },
    (g,x,y,s)=>{
      g.fillStyle='#c79d6e'; g.beginPath(); g.ellipse(x,y+7*s,13*s,4.5*s,0,0,7); g.fill();
      g.fillStyle='#4fbf5f';
      for (const a of [-0.5,0,0.5]){
        g.save(); g.translate(x,y-4*s); g.rotate(a);
        g.beginPath(); g.ellipse(0,-7*s,2.6*s,7*s,0,0,7); g.fill(); g.restore();
      }
      g.fillStyle='#ff9124'; g.beginPath(); g.ellipse(x,y+2*s,6.5*s,6*s,0,Math.PI,0); g.fill();
      g.fillRect(x-6.5*s,y+2*s,13*s,4*s);
    },
  ],
  [ // Les Cimes Givrées : sapin enneigé, bonhomme de neige, congère
    (g,x,y,s)=>{
      g.fillStyle='#8a6240'; g.fillRect(x-2.5*s,y+8*s,5*s,6*s);
      for (const [dy,w] of [[6,15],[-3,12],[-11,8]]){
        g.fillStyle='#3f9a74';
        g.beginPath(); g.moveTo(x-w*s,y+(dy+5)*s); g.lineTo(x+w*s,y+(dy+5)*s); g.lineTo(x,y+(dy-9)*s); g.closePath(); g.fill();
        g.fillStyle='#fff';
        g.beginPath(); g.moveTo(x-w*0.45*s,y+(dy-2.5)*s); g.lineTo(x+w*0.45*s,y+(dy-2.5)*s); g.lineTo(x,y+(dy-9)*s); g.closePath(); g.fill();
      }
    },
    (g,x,y,s)=>{
      g.fillStyle='#fff'; g.strokeStyle='#c4dbf2'; g.lineWidth=1.5*s;
      g.beginPath(); g.arc(x,y+6*s,10*s,0,7); g.fill(); g.stroke();
      g.beginPath(); g.arc(x,y-8*s,7.5*s,0,7); g.fill(); g.stroke();
      g.fillStyle=FACE_DARK;
      for (const sx of [-1,1]){ g.beginPath(); g.arc(x+sx*2.8*s,y-9*s,1.3*s,0,7); g.fill(); }
      g.fillStyle='#ff9124'; g.beginPath(); g.moveTo(x,y-7.5*s); g.lineTo(x+5*s,y-6.5*s); g.lineTo(x,y-5.5*s); g.fill();
      g.fillStyle='rgba(255,120,165,.45)';
      for (const sx of [-1,1]){ g.beginPath(); g.arc(x+sx*4.6*s,y-6*s,1.6*s,0,7); g.fill(); }
      g.fillStyle='#ff6fa5'; g.fillRect(x-7*s,y-2.5*s,14*s,3*s);
    },
    (g,x,y,s)=>{
      g.fillStyle='#fff'; g.beginPath(); g.ellipse(x,y+5*s,16*s,7*s,0,Math.PI,0); g.fill();
      g.fillStyle='rgba(150,190,235,.45)'; g.beginPath(); g.ellipse(x+4*s,y+5*s,10*s,2.5*s,0,0,Math.PI); g.fill();
      sparkle(g,x-9*s,y-10*s,3.5*s,'#9cc8f5'); sparkle(g,x+8*s,y-14*s,2.5*s,'#9cc8f5');
    },
  ],
  [ // Les Racines Pourries : champignon violet, trio de champignons, racines
    (g,x,y,s)=>{
      g.fillStyle='#f5e6d3'; g.beginPath(); g.roundRect(x-3.5*s,y-2*s,7*s,12*s,3*s); g.fill();
      g.fillStyle='#b267d6'; g.beginPath(); g.ellipse(x,y-2*s,12*s,9*s,0,Math.PI,0); g.closePath(); g.fill();
      g.fillStyle='rgba(255,255,255,.85)';
      for (const [dx,dy,r] of [[-5,-6,2],[3,-8,1.6],[6,-4,1.4]]){ g.beginPath(); g.arc(x+dx*s,y+dy*s,r*s,0,7); g.fill(); }
    },
    (g,x,y,s)=>{
      for (const [dx,dy,k] of [[-7,3,0.7],[0,0,1],[7,4,0.6]]){
        const cx=x+dx*s, cy=y+dy*s;
        g.fillStyle='#f5e6d3'; g.fillRect(cx-1.8*s*k,cy,3.6*s*k,8*s*k);
        g.fillStyle='#ff6b81'; g.beginPath(); g.ellipse(cx,cy,7*s*k,6*s*k,0,Math.PI,0); g.closePath(); g.fill();
        g.fillStyle='#fff'; g.beginPath(); g.arc(cx-2*s*k,cy-3*s*k,1.3*s*k,0,7); g.fill();
      }
    },
    (g,x,y,s)=>{
      g.strokeStyle='#8f6a62'; g.lineWidth=4*s; g.lineCap='round';
      g.beginPath(); g.moveTo(x-14*s,y+6*s); g.bezierCurveTo(x-6*s,y-8*s,x+2*s,y+10*s,x+12*s,y-4*s); g.stroke();
      g.lineWidth=2.5*s;
      g.beginPath(); g.moveTo(x-2*s,y+2*s); g.quadraticCurveTo(x+2*s,y+12*s,x+8*s,y+10*s); g.stroke();
      g.fillStyle='rgba(150,165,95,.55)'; g.beginPath(); g.arc(x+12*s,y-5*s,3.5*s,0,7); g.fill();
    },
  ],
];

function drawWorldTree(g,x,healed,d){
  const halo=g.createRadialGradient(x,90,10,x,90,160);
  halo.addColorStop(0, healed?'rgba(255,236,160,.8)':'rgba(110,80,135,.35)');
  halo.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=halo; g.fillRect(x-170,0,340,250);
  g.fillStyle=healed?'#b07d4f':'#6f5a66';
  g.beginPath();
  g.moveTo(x-30,MTOP-6); g.quadraticCurveTo(x-12,MTOP-60,x-20,120);
  g.lineTo(x+20,120); g.quadraticCurveTo(x+12,MTOP-60,x+30,MTOP-6); g.closePath(); g.fill();
  const lc=healed?['#a6e897','#4fb862']:['#a99dba','#75688a'];
  for (const [dx,dy,r] of [[-62,98,40],[62,98,40],[-34,64,46],[34,64,46],[0,104,48],[0,44,42]]){
    const gr=g.createRadialGradient(x+dx-r*.35,dy-r*.35,r*.15,x+dx,dy,r);
    gr.addColorStop(0,lc[0]); gr.addColorStop(1,lc[1]);
    g.fillStyle=gr; g.beginPath(); g.arc(x+dx,dy,r,0,7); g.fill();
  }
  if (healed){
    const spots=[[-60,92],[-30,52],[4,32],[34,62],[66,96],[-8,100],[26,112],[-40,120]];
    spots.forEach(([dx,dy],k)=>{
      const sp=makeSprite(k%TYPES.length, 11*d, false);
      g.drawImage(sp, x+dx-11*SPAD, dy-11*SPAD, 22*SPAD, 22*SPAD);
    });
    for (const [dx,dy] of [[-96,40],[92,30],[-80,150],[86,150]]) sparkle(g,x+dx,dy,7,'#ffc93c');
  } else {
    g.fillStyle='rgba(140,155,90,.55)';
    for (const [dx,dy,r] of [[-50,80,14],[40,50,11],[60,110,12],[-20,120,10],[10,30,9]]){
      g.beginPath(); g.arc(x+dx,dy,r,0,7); g.fill();
    }
    for (const sx of [-1,1]){
      g.fillStyle='#ffe066'; g.beginPath(); g.ellipse(x+sx*15,82,7,4.5,sx*0.25,0,7); g.fill();
      g.fillStyle='#3a2433'; g.beginPath(); g.ellipse(x+sx*15,82,1.6,4,0,0,7); g.fill();
    }
  }
}

function drawMap(){
  const c=$('mapCv'), d=Math.min(window.devicePixelRatio||1,2);
  const {W,H}=MAP;
  c.width=Math.round(W*d); c.height=Math.round(H*d);
  c.style.width=W+'px'; c.style.height=H+'px';
  const g=c.getContext('2d'); g.setTransform(d,0,0,d,0,0);
  for (let w=WORLDS.length-1; w>=0; w--){
    const b=MAP.bands[w], C=WCOL[w];
    const gr=g.createLinearGradient(0,b.top,0,b.bottom);
    gr.addColorStop(0,C.bg[0]); gr.addColorStop(1,C.bg[1]);
    g.fillStyle=gr;
    g.beginPath();
    if (w===WORLDS.length-1) g.rect(0,0,W,b.bottom+12);
    else {
      g.moveTo(0,b.bottom+12); g.lineTo(0,b.top);
      for (let x=0;x<=W+8;x+=8) g.lineTo(x, b.top + Math.sin(x/38 + w*2)*7);
      g.lineTo(W,b.bottom+12);
    }
    g.fill();
  }
  drawWorldTree(g, W/2, !!save.stars[LEVELS.length-1], d);
  for (const dd of MAP.deco) DECO[dd.w][dd.kind](g,dd.x,dd.y,dd.s);
  // route (bordure puis chaussée), avec un départ sous le niveau 1
  const p0=MAP.pts[0];
  const paths=[[{x:p0.x,y:H+20},p0]].concat(MAP.seg);
  g.lineCap='round'; g.lineJoin='round';
  for (const pass of [0,1]){
    paths.forEach((s,k)=>{
      const C=WCOL[LEVELS[Math.max(0,k-1)].w];
      g.strokeStyle=pass?C.road:C.edge;
      g.lineWidth=pass?18:26;
      g.beginPath(); s.forEach((p,j)=>j?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)); g.stroke();
    });
  }
  const cur=save.unlocked-1;
  MAP.seg.forEach((s,i)=>{
    const done=i<cur;
    g.fillStyle=done?'#ff8fb8':'rgba(150,120,140,.28)';
    for (let k=4;k<s.length-3;k+=4){ g.beginPath(); g.arc(s[k].x,s[k].y,done?3.2:2.4,0,7); g.fill(); }
  });
}

function buildMapNodes(){
  const inner=$('mapInner');
  inner.style.height=MAP.H+'px';
  inner.querySelectorAll('.mnode,.mstars,.wlabel').forEach(e=>e.remove());
  const cur=save.unlocked-1;
  const d=Math.min(window.devicePixelRatio||1,2.5);
  LEVELS.forEach((L,i)=>{
    const p=MAP.pts[i], locked=i>cur, st=save.stars[i]||0;
    const b=document.createElement('button');
    b.className='mnode'+(L.boss?' boss':'')+(locked?' locked':'')+(st?' done':'')+(i===cur&&!st?' cur':'');
    b.style.left=p.x+'px'; b.style.top=p.y+'px';
    b.title=(i+1)+'. '+L.name;
    b.setAttribute('aria-label',(i+1)+'. '+L.name+(locked?' (verrouillé)':''));
    if (L.boss){
      const sp=makeMisc(CHAR_DRAW[L.boss], 18*d, undefined, L.boss);
      const c=document.createElement('canvas');
      c.width=sp.width; c.height=sp.height; c.getContext('2d').drawImage(sp,0,0);
      b.appendChild(c);
    } else b.textContent = locked ? '🔒' : String(i+1);
    if (locked) b.disabled=true;
    else b.addEventListener('click', ()=>{ if (!mapRaf) openLevel(i); });
    inner.appendChild(b);
    if (!locked){
      const s=document.createElement('div'); s.className='mstars';
      s.style.left=p.x+'px'; s.style.top=(p.y+(L.boss?38:31))+'px';
      s.innerHTML=starsHtml(st);
      inner.appendChild(s);
    }
  });
  WORLDS.forEach((Wd,w)=>{
    const b=MAP.bands[w];
    const el=document.createElement('div'); el.className='wlabel';
    el.textContent=Wd.icon+' '+Wd.name;
    el.style.top=(w===0 ? MAP.H-40 : b.bottom)+'px';
    if (MAP.pts[b.first].x > MAP.W/2) el.style.left='10px'; else el.style.right='10px';
    inner.appendChild(el);
  });
}

/* ---------- Pépin sur la carte ---------- */
function heroR(){ return 22*PEPIN_STAGES[heroStage].scale; }
function heroOff(){ return 22 + heroR()*0.96; }
function heroPosAt(i){ const p=MAP.pts[i]; return {x:p.x, y:p.y-heroOff()}; }
function placeHero(x,y){ const h=$('heroWrap'); h.style.left=x+'px'; h.style.top=y+'px'; }
function drawHero(step){
  const c=$('heroCv'), d=Math.min(window.devicePixelRatio||1,2.5), px=Math.round(84*d);
  if (c.width!==px){ c.width=c.height=px; }
  const g=c.getContext('2d'); g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,84,84);
  const im=IMG['pepin'+heroStage];
  if (im){
    // marche : léger balancement du sprite à la place des petits pieds animés
    const s=heroR()*2.75;
    g.save(); g.translate(42,42); g.rotate((step||0)*0.12);
    g.drawImage(im,-s/2,-s/2,s,s); g.restore();
    return;
  }
  drawPepin(g,42,heroR(),{},heroStage,step||0);
}
function walkHero(from,to,done){
  const pts=[];
  for (let i=from;i<to;i++) pts.push(...MAP.seg[i].slice(i===from?0:1));
  const L=[0];
  for (let k=1;k<pts.length;k++) L.push(L[k-1]+Math.hypot(pts[k].x-pts[k-1].x, pts[k].y-pts[k-1].y));
  const total=L[L.length-1];
  const reduce=window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur=reduce ? 1 : Math.min(3200, 950*(to-from));
  const hw=$('heroWrap'), sc=$('mapScroll');
  hw.classList.remove('idle');
  const t0=performance.now();
  const frame=now=>{
    const k=Math.min(1,(now-t0)/dur);
    const e=k<.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2;
    const dist=e*total;
    let j=1; while (j<L.length-1 && L[j]<dist) j++;
    const f=(dist-L[j-1])/((L[j]-L[j-1])||1);
    const x=pts[j-1].x+(pts[j].x-pts[j-1].x)*f, y=pts[j-1].y+(pts[j].y-pts[j-1].y)*f;
    const ph=dist/20;
    placeHero(x, y-heroOff()-Math.abs(Math.sin(ph))*7);
    drawHero(Math.sin(ph));
    sc.scrollTop=Math.max(0, y - sc.clientHeight*0.55);
    if (k<1) mapRaf=requestAnimationFrame(frame);
    else { mapRaf=0; drawHero(0); hw.classList.add('idle'); if (done) done(); }
  };
  mapRaf=requestAnimationFrame(frame);
}
function updateHeroTag(){
  const done=Object.keys(save.stars).length;
  $('heroTag').textContent='🍒 '+PEPIN_STAGES[heroStage].name+' · '+done+'/'+LEVELS.length+' niveaux libérés';
}
function drawPepinInto(c,st){
  const d=Math.min(window.devicePixelRatio||1,2.5);
  c.width=c.height=Math.round(96*d); c.style.width=c.style.height='96px';
  const g=c.getContext('2d'); g.setTransform(d,0,0,d,0,0);
  const im=IMG['pepin'+st], s=26*PEPIN_STAGES[st].scale*2.75;
  if (im){ g.drawImage(im,48-s/2,48-s/2,s,s); return; }
  drawPepin(g,48,26*PEPIN_STAGES[st].scale,{},st,0);
}
function maybeEvolve(then){
  const st=pepinStage(), seen=save.stageSeen||0;
  if (st<=seen){ if (then) then(); return; }
  drawPepinInto($('evoOld'), seen);
  drawPepinInto($('evoNew'), st);
  $('evoName').textContent=PEPIN_STAGES[st].name;
  $('evoDesc').textContent=PEPIN_STAGES[st].desc;
  ovEvolve.hidden=false;
  sfx.win();
  evoThen=()=>{
    save.stageSeen=st; Storage.save(save);
    heroStage=st; updateHeroTag();
    const i=save.unlocked-1, hp=heroPosAt(i);
    placeHero(hp.x,hp.y); drawHero(0);
    if (then) then();
  };
}
$('btnEvo').addEventListener('click', ()=>{
  ovEvolve.hidden=true;
  const f=evoThen; evoThen=null;
  if (f) f();
});

function renderHome(then){
  $('coinsNum').textContent=save.coins;
  mapLayout(); drawMap(); buildMapNodes();
  const target=save.unlocked-1;
  const pos=typeof save.pos==='number' ? Math.min(save.pos,target) : target;
  heroStage=Math.min(save.stageSeen||0, pepinStage());
  updateHeroTag();
  const hp=heroPosAt(pos); placeHero(hp.x,hp.y); drawHero(0);
  $('heroWrap').classList.add('idle');
  const sc=$('mapScroll'); sc.scrollTop=Math.max(0, MAP.pts[pos].y - sc.clientHeight*0.55);
  cancelAnimationFrame(mapRaf); mapRaf=0;
  const finish=()=>{ save.pos=target; Storage.save(save); maybeEvolve(then); };
  if (pos<target){
    mapRaf=-1;
    setTimeout(()=>walkHero(pos,target,finish), 400);
  } else finish();
}
let plSelected=null, plIndex=0;
function openLevel(i){
  if (i>=LEVELS.length){ toMenu(); return; }
  plIndex=i; plSelected=null;
  const L=LEVELS[i];
  $('plName').textContent=(L.boss?'👑 ':'')+(i+1)+'. '+L.name;
  $('plStory').textContent=L.story;
  $('plStars').innerHTML=starsHtml(save.stars[i]||0);
  $('plBest').innerHTML=save.best[i]?('Record : <b>'+save.best[i]+'</b>'):'Jamais terminé';
  $('plCoins').textContent=save.coins;
  const rebuild=()=>buildSpecRow($('plBoosters'), true, id=>{
    plSelected = (plSelected===id)?null:id;
    rebuild();
  }, plSelected);
  rebuild();
  if (!gameEl.hidden){ state='home'; cancelAnimationFrame(rafId); rafId=0; gameEl.hidden=true; homeEl.hidden=false; renderHome(); }
  ovWin.hidden=true;
  ovLevel.hidden=false;
}
$('btnPlClose').addEventListener('click', ()=>{ ovLevel.hidden=true; });
$('btnPlay').addEventListener('click', ()=>{
  if (plSelected){
    save.coins -= SPECIALS[plSelected].cost;
    Storage.save(save);
  }
  ovLevel.hidden=true;
  startLevel(plIndex, plSelected);
});

/* ---------- Dialogues ---------- */
let dSeq=null, dIdx=0, dCb=null, dKey=null;
function showDialog(key, cb){
  dSeq=DIALOGS[key]; dIdx=0; dCb=cb; dKey=key;
  ovDialog.hidden=false;
  renderDialogLine();
}
function renderDialogLine(){
  const [who,text]=dSeq[dIdx];
  $('dName').textContent=CHARS[who].name;
  $('dText').textContent=text;
  const c=$('dFace'), g=c.getContext('2d');
  const d=Math.min(window.devicePixelRatio||1,2.5);
  c.width=c.height=76*d; c.style.width=c.style.height='76px';
  g.setTransform(d,0,0,d,0,0);
  const sp=makeMisc(CHAR_DRAW[who], 26*d, who==='pepin'?{}:undefined,
                    who==='pepin' ? 'pepin'+pepinStage() : who);
  g.drawImage(sp, 38-26*1.6, 38-26*1.6, 52*1.6, 52*1.6);
}
$('dcard').addEventListener('click', ()=>{
  dIdx++;
  if (dIdx < dSeq.length){ renderDialogLine(); return; }
  ovDialog.hidden=true;
  save.seen[dKey]=1; Storage.save(save);
  const cb=dCb; dSeq=null; dCb=null;
  if (cb) cb();
});

/* ---------- Redimensionnement ---------- */
new ResizeObserver(()=>{ resize(); if(state!=='home') render(performance.now()/1000); }).observe(cv);
window.addEventListener('resize', resize);
new ResizeObserver(()=>{
  const w=$('mapScroll').clientWidth;
  if (state!=='home' || !w || w===lastMapW || mapRaf) return;
  mapLayout(); drawMap(); buildMapNodes();
  const i=Math.min(typeof save.pos==='number'?save.pos:save.unlocked-1, save.unlocked-1);
  const hp=heroPosAt(i); placeHero(hp.x,hp.y);
}).observe($('mapScroll'));

/* ---------- Démarrage (compatible mise à jour à chaud) ---------- */
function serialize(){
  if (state==='home') return {screen:'home'};
  return {
    screen:'playing', level:levelIndex, score, shots:shotsUntilDrop,
    cur, nxt, gauge, loadedSpecial,
    bossHp: boss?boss.hp:null, bossAtk: boss?boss.atkIn:null,
    grid: rows.map(r=>({s:r.shifted?1:0, c:r.cells.map(cell=>cell?Object.assign({},cell):null)}))
  };
}
function boot(data){
  renderHome();
  if (data && data.screen==='playing' && Array.isArray(data.grid)){
    const i=Math.min(data.level||0, LEVELS.length-1);
    // reconstruit sans rejouer les dialogues
    levelIndex=i; const L=LEVELS[i];
    boss = L.boss ? {key:L.boss, def:BOSSES[L.boss], hp:data.bossHp||BOSSES[L.boss].hp, atkIn:data.bossAtk||BOSSES[L.boss].every, flash:0} : null;
    rows = data.grid.map(r=>({shifted:!!r.s, cells:r.c.map(cell=>cell?Object.assign({},cell):null)}));
    score=data.score||0; shotsUntilDrop=data.shots||L.drop;
    cur=data.cur||0; nxt=data.nxt||0;
    gauge=data.gauge||0; loadedSpecial=data.loadedSpecial||null;
    bullet=null; falling=[]; particles=[]; chunks=[]; ringsFx=[]; popups=[]; bolts=[];
    homeEl.hidden=true; gameEl.hidden=false;
    state='playing';
    applyWorldBg();
    resize(); syncHud(); startLoop();
  }
}

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

window.claude?.hot?.snapshot?.(serialize);
const start = data => loadImages(()=>{
  if (data){ $('intro').hidden=true; boot(data); }   // rechargement à chaud : pas d'intro
  else runIntro(()=>boot(null));
});
(window.claude?.hot?.ready) ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? null);
