/* ============================================================
   FitPro · Application transformation 90 jours
   Stockage local · Pas de dépendance externe
   ============================================================ */

const LS_KEY = 'fitpro_v1';

const DEFAULT_DATA = {
  profile: {
    name: 'Champion',
    age: 27,
    sex: 'm',
    height: 176,
    startWeight: 95,
    goalWeight: 80,
    activity: 1.375,
    deficit: 22,
  },
  weights: [],   // {date, weight, waist, note}
  habits: {},    // { 'YYYY-MM-DD': { water:0, steps:0, sleep:0, checks:{}, workoutDone:false } }
};

let DATA = load();

function load(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return {...structuredClone(DEFAULT_DATA), ...parsed,
      profile:{...DEFAULT_DATA.profile, ...(parsed.profile||{})},
      habits:parsed.habits||{}};
  }catch(e){ return structuredClone(DEFAULT_DATA); }
}
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(DATA)); }
function todayKey(){ return new Date().toISOString().slice(0,10); }
function getHabit(d=todayKey()){
  if(!DATA.habits[d]) DATA.habits[d] = {water:0,steps:0,sleep:0,checks:{},workoutDone:false};
  return DATA.habits[d];
}

/* ============================================================
   MEAL & WORKOUT DATA
   ============================================================ */
const MEALS = [
  { id:'breakfast', title:'Petit déjeuner', time:'8h', kcal:380, options:[
      { name:'Option 1 — Protéiné', items:['3 œufs (brouillés/à la coque)','1 tranche de pain complet','Café/thé sans sucre'] },
      { name:'Option 2 — Énergie', items:['60 g flocons d\'avoine','200 ml lait écrémé','1 banane','Cannelle'] },
      { name:'Option 3 — Express', items:['Yaourt grec 0% (200g)','30 g flocons d\'avoine','1 c.à.c miel','Fruits rouges'] },
  ]},
  { id:'lunch', title:'Déjeuner', time:'13h', kcal:600, options:[
      { name:'Base universelle', items:['150 g protéine (poulet / thon / steak 5%)','Légumes à volonté','100 g riz / pommes de terre / quinoa','1 c.à.s huile d\'olive','Eau plate'] },
      { name:'Variante poisson', items:['180 g saumon ou cabillaud','Brocolis vapeur','100 g riz basmati','Citron + herbes'] },
      { name:'Salade complète', items:['150 g poulet grillé','Salade verte + tomates + concombre','30 g feta','Pois chiches 80 g','Vinaigrette légère'] },
  ]},
  { id:'snack', title:'Collation', time:'16h', kcal:180, options:[
      { name:'Option 1', items:['Yaourt grec 0% (150g)','15 g amandes'] },
      { name:'Option 2', items:['1 pomme','15 g noix'] },
      { name:'Option 3 (post-sport)', items:['Shake protéine (25 g)','1 banane'] },
  ]},
  { id:'dinner', title:'Dîner', time:'20h', kcal:500, options:[
      { name:'Léger & efficace', items:['Poisson / omelette 3 œufs / poulet','Légumes vapeur ou poêlés','Salade verte','Si grosse faim : 50 g riz'] },
      { name:'Soupe + protéine', items:['Soupe maison (légumes)','150 g blanc de poulet','1 yaourt nature'] },
      { name:'Bowl veggie', items:['200 g tofu / 2 œufs','Lentilles 80 g cru','Légumes rôtis','Avocat ¼'] },
  ]},
];

const WEEK = [
  { day:'Lundi',    icon:'💪', workout:'Haut du corps + 20 min marche', dur:'~50 min' },
  { day:'Mardi',    icon:'🚶', workout:'Marche rapide',                 dur:'45 min' },
  { day:'Mercredi', icon:'🦵', workout:'Jambes + abdos',                dur:'~45 min' },
  { day:'Jeudi',    icon:'🚶', workout:'Marche rapide',                 dur:'45 min' },
  { day:'Vendredi', icon:'🔥', workout:'Full body',                     dur:'~50 min' },
  { day:'Samedi',   icon:'🧘', workout:'Marche 1h + gainage',           dur:'1 h' },
  { day:'Dimanche', icon:'☘️', workout:'Repos actif (marche douce)',    dur:'30 min' },
];

const SHOPPING = [
  'Œufs (×30)','Poulet blanc 1.5 kg','Thon en boîte (eau) ×6','Saumon / cabillaud',
  'Steak haché 5%','Yaourt grec 0% ×10','Lait écrémé 2 L','Flocons d\'avoine 1 kg',
  'Riz basmati / complet','Quinoa','Patates douces','Légumes verts (brocoli, courgette, épinards)',
  'Salade + tomates + concombre','Pommes / bananes / fruits rouges','Amandes 250 g',
  'Huile d\'olive vierge','Citrons','Café / thé','Eau minérale 6 L','Épices (cumin, paprika, herbes)',
];

const TODAY_CHECKS = [
  {id:'pesee',     label:'⚖️ Pesée du matin'},
  {id:'eau',       label:'💧 2,5 L d\'eau'},
  {id:'pas',       label:'👟 8 000+ pas'},
  {id:'proteines', label:'🍗 Protéine à chaque repas'},
  {id:'legumes',   label:'🥦 Légumes à midi & soir'},
  {id:'sport',     label:'🏋️ Séance sport ou marche'},
  {id:'sucre',     label:'🚫 Aucun sucre / soda'},
  {id:'sommeil',   label:'😴 Coucher avant 23h'},
];

/* ============================================================
   CALCULATIONS
   ============================================================ */
function calcBMI(w,h){ return +(w / Math.pow(h/100,2)).toFixed(1); }
function bmiCategory(b){
  if(b<18.5) return 'Insuffisant';
  if(b<25)   return 'Normal ✅';
  if(b<30)   return 'Surpoids';
  if(b<35)   return 'Obésité I';
  return 'Obésité II+';
}
function calcBMR(p,w){
  // Mifflin-St Jeor
  return Math.round(p.sex==='m'
    ? 10*w + 6.25*p.height - 5*p.age + 5
    : 10*w + 6.25*p.height - 5*p.age - 161);
}
function calcTDEE(p,w){ return Math.round(calcBMR(p,w)*p.activity); }
function calcTarget(p,w){
  const t = Math.round(calcTDEE(p,w) * (1 - p.deficit/100));
  return Math.max(t, 1700);
}
function currentWeight(){
  if(DATA.weights.length===0) return DATA.profile.startWeight;
  return DATA.weights[DATA.weights.length-1].weight;
}
function startWeight(){
  return DATA.weights.length ? DATA.weights[0].weight : DATA.profile.startWeight;
}

/* ============================================================
   TABS
   ============================================================ */
document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

/* ============================================================
   TOAST
   ============================================================ */
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard(){
  const p = DATA.profile;
  const w = currentWeight();
  const sw = startWeight();
  document.getElementById('greetName').textContent = p.name;
  document.getElementById('greetDate').textContent =
    new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  document.getElementById('kpiWeight').textContent = w.toFixed(1);
  document.getElementById('kpiGoal').textContent = p.goalWeight;
  const bmi = calcBMI(w,p.height);
  document.getElementById('kpiBmi').textContent = bmi;
  document.getElementById('kpiBmiCat').textContent = bmiCategory(bmi);
  document.getElementById('kpiCal').textContent = calcTarget(p,w);
  document.getElementById('kpiTdee').textContent = calcTDEE(p,w);

  const delta = +(w - sw).toFixed(1);
  const dEl = document.getElementById('kpiWeightDelta');
  if(delta < 0) dEl.innerHTML = `▼ ${Math.abs(delta)} kg perdus 🎉`;
  else if(delta > 0) dEl.innerHTML = `▲ +${delta} kg`;
  else dEl.textContent = 'Démarrage';

  document.getElementById('kpiToGo').textContent =
    w > p.goalWeight ? `${(w-p.goalWeight).toFixed(1)} kg restants` : 'Objectif atteint ✅';

  // Progress
  document.getElementById('progStart').textContent = sw.toFixed(1) + ' kg';
  document.getElementById('progNow').textContent = w.toFixed(1) + ' kg';
  document.getElementById('progGoal').textContent = p.goalWeight + ' kg';
  const total = sw - p.goalWeight;
  const done  = sw - w;
  const pct   = total>0 ? Math.max(0, Math.min(100, (done/total)*100)) : 0;
  document.getElementById('progFill').style.width = pct + '%';
  document.getElementById('progPct').textContent = pct.toFixed(0) + '%';

  document.getElementById('miniLost').textContent = Math.max(0, sw-w).toFixed(1);
  document.getElementById('miniDays').textContent = DATA.weights.length;
  // avg per week
  let avg = 0;
  if(DATA.weights.length >= 2){
    const first = new Date(DATA.weights[0].date);
    const last  = new Date(DATA.weights[DATA.weights.length-1].date);
    const weeks = Math.max(1,(last-first)/(7*864e5));
    avg = ((DATA.weights[0].weight - w)/weeks);
  }
  document.getElementById('miniAvg').textContent = avg.toFixed(2);

  // streak
  document.getElementById('streakNum').textContent = computeStreak();

  // chart small
  drawChart('weightChart', DATA.weights.slice(-30));
  document.getElementById('weightSpan').textContent =
    DATA.weights.length ? `30 derniers jours` : 'Aucune donnée';

  // checklist
  const ul = document.getElementById('todayChecklist');
  const habit = getHabit();
  ul.innerHTML = TODAY_CHECKS.map(c=>{
    const done = habit.checks[c.id];
    return `<li data-ck="${c.id}" class="${done?'done':''}"><div class="ck">✓</div>${c.label}</li>`;
  }).join('');
  ul.querySelectorAll('li').forEach(li=>{
    li.addEventListener('click',()=>{
      const id = li.dataset.ck;
      const h = getHabit();
      h.checks[id] = !h.checks[id];
      save(); renderDashboard();
    });
  });

  // today meals
  document.getElementById('todayMeals').innerHTML = MEALS.map(m=>`
    <div class="today-meal">
      <div>
        <div class="today-meal-name">${m.title}</div>
        <div class="today-meal-cal">${m.time} · ${m.options[0].name}</div>
      </div>
      <div class="meal-cal">${m.kcal} kcal</div>
    </div>`).join('');
}

function computeStreak(){
  // consecutive days with at least one check or weight
  let streak = 0;
  for(let i=0;i<365;i++){
    const d = new Date(); d.setDate(d.getDate()-i);
    const k = d.toISOString().slice(0,10);
    const h = DATA.habits[k];
    const hasW = DATA.weights.some(x=>x.date===k);
    const hasH = h && (Object.values(h.checks||{}).some(Boolean) || h.water>0 || h.steps>0);
    if(hasW || hasH) streak++; else break;
  }
  return streak;
}

/* ============================================================
   WEIGHT CHART (vanilla canvas)
   ============================================================ */
function drawChart(id, points){
  const canvas = document.getElementById(id);
  if(!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth, H = canvas.clientHeight || 220;
  canvas.width = W*dpr; canvas.height = H*dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);

  if(!points || points.length===0){
    ctx.fillStyle = '#8a93b8';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Aucune pesée enregistrée — commence aujourd\'hui !', W/2, H/2);
    return;
  }

  const pad = {l:40,r:14,t:14,b:28};
  const xs = (i)=> pad.l + (W-pad.l-pad.r) * (points.length===1?0.5: i/(points.length-1));
  const values = points.map(p=>p.weight);
  const min = Math.min(...values, DATA.profile.goalWeight) - 1;
  const max = Math.max(...values, DATA.profile.startWeight) + 1;
  const ys = (v)=> pad.t + (H-pad.t-pad.b) * (1 - (v-min)/(max-min));

  // grid
  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.lineWidth = 1;
  for(let i=0;i<=4;i++){
    const y = pad.t + (H-pad.t-pad.b)*i/4;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
    ctx.fillStyle = '#8a93b8'; ctx.font = '11px Inter'; ctx.textAlign = 'right';
    ctx.fillText((max - (max-min)*i/4).toFixed(1), pad.l-6, y+4);
  }

  // goal line
  const gy = ys(DATA.profile.goalWeight);
  ctx.setLineDash([6,4]);
  ctx.strokeStyle = 'rgba(16,185,129,.6)';
  ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(W-pad.r, gy); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#10b981'; ctx.font = '11px Inter'; ctx.textAlign='left';
  ctx.fillText('Objectif '+DATA.profile.goalWeight+' kg', pad.l+6, gy-6);

  // area
  const grad = ctx.createLinearGradient(0,pad.t,0,H-pad.b);
  grad.addColorStop(0,'rgba(99,102,241,.5)');
  grad.addColorStop(1,'rgba(99,102,241,0)');
  ctx.beginPath();
  ctx.moveTo(xs(0), H-pad.b);
  points.forEach((p,i)=> ctx.lineTo(xs(i), ys(p.weight)));
  ctx.lineTo(xs(points.length-1), H-pad.b);
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // line
  ctx.beginPath();
  points.forEach((p,i)=>{
    const x=xs(i), y=ys(p.weight);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.strokeStyle = '#a5b4fc'; ctx.lineWidth = 2.5; ctx.stroke();

  // points
  points.forEach((p,i)=>{
    ctx.beginPath();
    ctx.arc(xs(i), ys(p.weight), 4, 0, Math.PI*2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2; ctx.stroke();
  });

  // x labels (first / mid / last)
  ctx.fillStyle = '#8a93b8'; ctx.font = '11px Inter'; ctx.textAlign='center';
  const showIdx = points.length<=6 ? points.map((_,i)=>i) : [0, Math.floor(points.length/2), points.length-1];
  showIdx.forEach(i=>{
    const d = new Date(points[i].date);
    ctx.fillText(d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'}), xs(i), H-8);
  });
}

/* ============================================================
   WEIGHT TAB
   ============================================================ */
function renderWeight(){
  document.getElementById('weightDate').value = todayKey();
  const tbody = document.querySelector('#weightTable tbody');
  const sorted = [...DATA.weights].sort((a,b)=> a.date.localeCompare(b.date));
  tbody.innerHTML = sorted.slice().reverse().map((w,idx,arr)=>{
    const next = arr[idx+1]; // older
    let delta = '—';
    if(next){
      const d = +(w.weight - next.weight).toFixed(1);
      delta = d===0 ? '0' : (d<0 ? `<span class="delta-down">▼ ${Math.abs(d)}</span>` : `<span class="delta-up">▲ +${d}</span>`);
    }
    return `<tr>
      <td>${new Date(w.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}</td>
      <td><strong>${w.weight.toFixed(1)} kg</strong></td>
      <td>${delta}</td>
      <td>${w.waist?w.waist+' cm':'—'}</td>
      <td>${w.note||'—'}</td>
      <td><button class="row-del" data-date="${w.date}">✕</button></td>
    </tr>`;
  }).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px">Aucune entrée — fais ta première pesée !</td></tr>`;

  document.getElementById('historyCount').textContent = DATA.weights.length + ' entrée' + (DATA.weights.length>1?'s':'');
  drawChart('weightChartFull', sorted);

  tbody.querySelectorAll('.row-del').forEach(b=>{
    b.addEventListener('click',()=>{
      DATA.weights = DATA.weights.filter(x=>x.date!==b.dataset.date);
      save(); renderWeight(); renderDashboard();
      toast('Entrée supprimée');
    });
  });
}

document.getElementById('saveWeight').addEventListener('click',()=>{
  const date = document.getElementById('weightDate').value;
  const weight = parseFloat(document.getElementById('weightInput').value);
  const waist = parseFloat(document.getElementById('waistInput').value) || null;
  const note = document.getElementById('weightNote').value.trim();
  if(!date || !weight){ toast('⚠️ Date et poids requis'); return; }
  DATA.weights = DATA.weights.filter(x=>x.date!==date);
  DATA.weights.push({date,weight,waist,note});
  DATA.weights.sort((a,b)=>a.date.localeCompare(b.date));
  // mark check
  getHabit(date).checks.pesee = true;
  save();
  document.getElementById('weightInput').value = '';
  document.getElementById('waistInput').value = '';
  document.getElementById('weightNote').value = '';
  toast('✅ Pesée enregistrée');
  renderWeight(); renderDashboard();
});

/* ============================================================
   NUTRITION
   ============================================================ */
function renderNutrition(){
  const p = DATA.profile;
  const w = currentWeight();
  const target = calcTarget(p,w);
  document.getElementById('nutriCal').textContent = target;
  // macros (35/40/25)
  const prot = Math.round(target*.35/4);
  const carb = Math.round(target*.40/4);
  const fat  = Math.round(target*.25/9);
  document.getElementById('macroP').textContent = prot+' g';
  document.getElementById('macroC').textContent = carb+' g';
  document.getElementById('macroF').textContent = fat+' g';

  document.getElementById('mealGrid').innerHTML = MEALS.map(m=>`
    <div class="meal">
      <div class="meal-head">
        <div>
          <div class="meal-title">${m.title}</div>
          <div class="meal-time">⏰ ${m.time}</div>
        </div>
        <div class="meal-cal">~${m.kcal} kcal</div>
      </div>
      <div class="meal-options">
        ${m.options.map(o=>`
          <div class="meal-opt">
            <strong>${o.name}</strong>
            <ul>${o.items.map(i=>`<li>${i}</li>`).join('')}</ul>
          </div>`).join('')}
      </div>
    </div>`).join('');

  document.getElementById('shoppingList').innerHTML =
    SHOPPING.map(s=>`<li>${s}</li>`).join('');
}

/* ============================================================
   WORKOUT
   ============================================================ */
function renderWorkout(){
  // current weekday (1=Lundi)
  const dow = (new Date().getDay()+6)%7; // 0..6 Mon..Sun
  document.getElementById('weekGrid').innerHTML = WEEK.map((d,i)=>{
    // doneness: track per actual date — simplification : per current week
    const date = mondayPlus(i);
    const h = DATA.habits[date];
    const done = h && h.workoutDone;
    return `<div class="day ${i===dow?'today':''} ${done?'done':''}" data-i="${i}" data-date="${date}">
      <div class="day-name">${d.day}${i===dow?' · Aujourd\'hui':''}</div>
      <div class="day-icon">${d.icon}</div>
      <div class="day-workout">${d.workout}</div>
      <div class="day-dur">${d.dur}</div>
      <div class="day-check">✓ Fait</div>
    </div>`;
  }).join('');
  document.querySelectorAll('#weekGrid .day').forEach(el=>{
    el.addEventListener('click',()=>{
      const date = el.dataset.date;
      const h = getHabit(date);
      h.workoutDone = !h.workoutDone;
      h.checks.sport = h.workoutDone;
      save(); renderWorkout(); renderDashboard();
    });
  });
}
function mondayPlus(offset){
  const d = new Date();
  const dow = (d.getDay()+6)%7;
  d.setDate(d.getDate() - dow + offset);
  return d.toISOString().slice(0,10);
}

/* ============================================================
   HABITS
   ============================================================ */
function renderHabits(){
  const h = getHabit();
  // water
  document.getElementById('waterCount').textContent = h.water||0;
  const wg = document.getElementById('waterGlasses');
  wg.innerHTML = '';
  for(let i=0;i<10;i++){
    const g = document.createElement('div');
    g.className = 'glass' + (i<h.water?' full':'');
    g.addEventListener('click',()=>{
      const cur = getHabit();
      cur.water = (i < cur.water) ? i : i+1;
      cur.checks.eau = cur.water >= 8;
      save(); renderHabits(); renderDashboard();
    });
    wg.appendChild(g);
  }
  // steps
  document.getElementById('stepsToday').textContent = (h.steps||0).toLocaleString('fr-FR');
  document.getElementById('stepsBar').style.width = Math.min(100,(h.steps||0)/10000*100)+'%';
  // sleep
  document.getElementById('sleepToday').textContent = h.sleep||0;
  document.getElementById('sleepBar').style.width = Math.min(100,(h.sleep||0)/8*100)+'%';
}
document.getElementById('saveSteps').addEventListener('click',()=>{
  const v = parseInt(document.getElementById('stepsInput').value);
  if(!v){ toast('⚠️ Entre un nombre'); return; }
  const h = getHabit(); h.steps = v;
  h.checks.pas = v>=8000;
  save(); document.getElementById('stepsInput').value='';
  toast('✅ Pas enregistrés'); renderHabits(); renderDashboard();
});
document.getElementById('saveSleep').addEventListener('click',()=>{
  const v = parseFloat(document.getElementById('sleepInput').value);
  if(!v){ toast('⚠️ Entre un nombre'); return; }
  const h = getHabit(); h.sleep = v;
  h.checks.sommeil = v>=7;
  save(); document.getElementById('sleepInput').value='';
  toast('✅ Sommeil enregistré'); renderHabits(); renderDashboard();
});

/* ============================================================
   PROFILE
   ============================================================ */
function renderProfile(){
  const p = DATA.profile;
  document.getElementById('pName').value = p.name;
  document.getElementById('pAge').value = p.age;
  document.getElementById('pSex').value = p.sex;
  document.getElementById('pHeight').value = p.height;
  document.getElementById('pStart').value = p.startWeight;
  document.getElementById('pGoal').value = p.goalWeight;
  document.getElementById('pActivity').value = p.activity;
  document.getElementById('pDeficit').value = p.deficit;

  const w = currentWeight();
  document.getElementById('cBmi').textContent = calcBMI(w,p.height) + ' · ' + bmiCategory(calcBMI(w,p.height));
  document.getElementById('cBmr').textContent = calcBMR(p,w) + ' kcal';
  document.getElementById('cTdee').textContent = calcTDEE(p,w) + ' kcal';
  document.getElementById('cTarget').textContent = calcTarget(p,w) + ' kcal';
  document.getElementById('cProt').textContent = Math.round(w*1.8) + ' g';
  document.getElementById('cWater').textContent = (Math.round(w*0.033*10)/10) + ' L';
}
document.getElementById('saveProfile').addEventListener('click',()=>{
  DATA.profile = {
    name: document.getElementById('pName').value || 'Champion',
    age: +document.getElementById('pAge').value || 27,
    sex: document.getElementById('pSex').value,
    height: +document.getElementById('pHeight').value || 176,
    startWeight: +document.getElementById('pStart').value || 95,
    goalWeight: +document.getElementById('pGoal').value || 80,
    activity: +document.getElementById('pActivity').value || 1.375,
    deficit: +document.getElementById('pDeficit').value || 22,
  };
  save(); renderAll(); toast('✅ Profil enregistré');
});

/* ============================================================
   EXPORT / RESET
   ============================================================ */
document.getElementById('exportBtn').addEventListener('click',()=>{
  const blob = new Blob([JSON.stringify(DATA,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fitpro-${todayKey()}.json`;
  a.click();
  toast('📁 Données exportées');
});
document.getElementById('resetBtn').addEventListener('click',()=>{
  if(!confirm('Tout réinitialiser ? Cette action est irréversible.')) return;
  localStorage.removeItem(LS_KEY);
  DATA = load();
  renderAll();
  toast('🔄 Données réinitialisées');
});

/* ============================================================
   INIT
   ============================================================ */
function renderAll(){
  renderDashboard();
  renderWeight();
  renderNutrition();
  renderWorkout();
  renderHabits();
  renderProfile();
}
window.addEventListener('resize',()=>{ renderDashboard(); renderWeight(); });
renderAll();
