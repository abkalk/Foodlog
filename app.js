async function aiEstimateAndAdd() {
  const text = document.getElementById('aiText').value.trim();
  const note = document.getElementById('aiNote');
  if (!text) return;

  note.textContent = "Estimating…";

  const res = await fetch("<VERSION_PREFIX>-<WORKER_NAME>.alkuwari-aziz10.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      context: { weightKg: 90, bmr: 1833, waterTargetMl: 4000 }
    })
  });

  const data = await res.json();

  // If water-only
  if ((data?.totals?.water_ml || 0) > 0 && (data?.totals?.calories || 0) === 0) {
    // add water entry using your existing logic:
    // (simplest) just alert + you manually add for now, or wire into your water add function
  }

  // Add as ONE combined food entry (totals)
  const cal = Number(data?.totals?.calories || 0);
  const p = Number(data?.totals?.protein_g || 0);
  const c = Number(data?.totals?.carbs_g || 0);
  const f = Number(data?.totals?.fats_g || 0);
  const chol = Number(data?.totals?.cholesterol_mg || 0);

  // Fill fields then trigger your existing addEntry() function
  document.getElementById('type').value = 'food';
  document.getElementById('desc').value = text;
  document.getElementById('cal').value = cal;
  document.getElementById('p').value = p;
  document.getElementById('c').value = c;
  document.getElementById('f').value = f;
  document.getElementById('chol').value = chol;

  note.textContent = data?.assumptions?.length
    ? `Added. Assumptions: ${data.assumptions.join(" | ")}`
    : "Added.";

  // call your existing addEntry()
  // If your addEntry is in scope, call it directly; otherwise connect it to a button click
  // addEntry();
}

document.getElementById('aiBtn')?.addEventListener('click', aiEstimateAndAdd);

const BMR = 1833;
const WATER_TARGET_ML = 4000;

// Game settings (you can tweak these anytime)
const CAL_CAP = 1200;         // daily calories target cap
const PROTEIN_TARGET = 120;   // grams
const MIN_QUESTS_FOR_STREAK = 3;

const els = {
  todayLabel: document.getElementById('todayLabel'),
  type: document.getElementById('type'),
  template: document.getElementById('template'),
  desc: document.getElementById('desc'),
  cal: document.getElementById('cal'),
  p: document.getElementById('p'),
  c: document.getElementById('c'),
  f: document.getElementById('f'),
  chol: document.getElementById('chol'),
  waterMl: document.getElementById('waterMl'),
  suppMg: document.getElementById('suppMg'),
  actCal: document.getElementById('actCal'),
  foodFields: document.getElementById('foodFields'),
  waterFields: document.getElementById('waterFields'),
  suppFields: document.getElementById('suppFields'),
  activityFields: document.getElementById('activityFields'),
  addBtn: document.getElementById('addBtn'),
  recent: document.getElementById('recent'),
  tCal: document.getElementById('tCal'),
  tP: document.getElementById('tP'),
  tC: document.getElementById('tC'),
  tF: document.getElementById('tF'),
  tChol: document.getElementById('tChol'),
  tWater: document.getElementById('tWater'),
  tAct: document.getElementById('tAct'),
  defNow: document.getElementById('defNow'),
  endDayBtn: document.getElementById('endDayBtn'),
  lastSummary: document.getElementById('lastSummary'),

  // HUD
  hudLine: document.getElementById('hudLine'),
  lvl: document.getElementById('lvl'),
  xp: document.getElementById('xp'),
  streak: document.getElementById('streak'),
  questsDone: document.getElementById('questsDone'),
  quests: document.getElementById('quests'),
  badges: document.getElementById('badges'),
};

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}

function loadDay() {
  const key = `day:${todayKey()}`;
  return JSON.parse(localStorage.getItem(key) || '{"entries":[],"totals":{"cal":0,"p":0,"c":0,"f":0,"chol":0,"water":0,"act":0}}');
}

function saveDay(data) {
  const key = `day:${todayKey()}`;
  localStorage.setItem(key, JSON.stringify(data));
}

function loadGame() {
  return JSON.parse(localStorage.getItem('game') || '{"xp":0,"streak":0,"lastEnded":null,"counters":{"waterHits":0,"proteinHits":0,"deficitHits":0,"daysEnded":0}}');
}

function saveGame(g) {
  localStorage.setItem('game', JSON.stringify(g));
}

function setFieldsByType() {
  const t = els.type.value;
  els.foodFields.style.display = (t === 'food') ? 'block' : 'none';
  els.waterFields.style.display = (t === 'water') ? 'block' : 'none';
  els.suppFields.style.display = (t === 'supp') ? 'block' : 'none';
  els.activityFields.style.display = (t === 'activity') ? 'block' : 'none';
}

function fmt(n, digits=0){ return Number(n || 0).toFixed(digits); }

function applyTemplate(v){
  els.desc.value = '';
  els.cal.value = '';
  els.p.value = '';
  els.c.value = '';
  els.f.value = '';
  els.chol.value = '';
  els.waterMl.value = '';
  els.suppMg.value = '';
  els.actCal.value = '';

  if (!v) return;

  if (v === 'protein_shake') {
    els.type.value = 'food';
    setFieldsByType();
    els.desc.value = 'Protein shake (1 bottle)';
    els.cal.value = 230;
    els.p.value = 45;
    els.c.value = 6;
    els.f.value = 4;
    els.chol.value = 35;
  }
  if (v === 'berberine_1000') {
    els.type.value = 'supp';
    setFieldsByType();
    els.desc.value = 'Berberine';
    els.suppMg.value = 1000;
  }
  if (v === 'water_330') {
    els.type.value = 'water';
    setFieldsByType();
    els.desc.value = 'Water';
    els.waterMl.value = 330;
  }
}

function addEntry() {
  const d = loadDay();
  const t = els.type.value;
  const ts = Date.now();

  let entryText = '';
  if (t === 'food') {
    const cal = Number(els.cal.value || 0);
    const p = Number(els.p.value || 0);
    const c = Number(els.c.value || 0);
    const f = Number(els.f.value || 0);
    const chol = Number(els.chol.value || 0);
    const desc = els.desc.value || 'Food';

    d.totals.cal += cal;
    d.totals.p += p;
    d.totals.c += c;
    d.totals.f += f;
    d.totals.chol += chol;

    entryText = `${desc}: ${cal} kcal • P${p} C${c} F${f} • Chol ${chol}mg`;
  }

  if (t === 'water') {
    const ml = Number(els.waterMl.value || 0);
    const desc = els.desc.value || 'Water';
    d.totals.water += ml;
    const remaining = Math.max(0, WATER_TARGET_ML - d.totals.water);
    entryText = `${desc}: +${ml} ml (Remaining ${remaining} ml)`;
  }

  if (t === 'supp') {
    const mg = Number(els.suppMg.value || 0);
    const desc = els.desc.value || 'Supplement';
    entryText = mg ? `${desc}: ${mg} mg` : `${desc}`;
  }

  if (t === 'activity') {
    const kcal = Number(els.actCal.value || 0);
    const desc = els.desc.value || 'Activity';
    d.totals.act += kcal;
    entryText = `${desc}: +${kcal} kcal burned`;
  }

  d.entries.push({ ts, type: t, text: entryText });
  saveDay(d);

  // XP: reward logging consistency (max 10/day)
  const g = loadGame();
  const todayLogCount = d.entries.length;
  if (todayLogCount <= 10) g.xp += 10;
  saveGame(g);

  els.template.value = '';
  render();
}

function computeQuests(d) {
  const q = [
    { key:'water', name:`Hydration: ${WATER_TARGET_ML} ml`, done: d.totals.water >= WATER_TARGET_ML },
    { key:'cal', name:`Calories under ${CAL_CAP}`, done: d.totals.cal > 0 && d.totals.cal <= CAL_CAP },
    { key:'protein', name:`Protein ≥ ${PROTEIN_TARGET}g`, done: d.totals.p >= PROTEIN_TARGET },
    { key:'activity', name:`Activity logged`, done: d.totals.act > 0 },
    { key:'log', name:`Log day (≥3 entries)`, done: d.entries.length >= 3 },
  ];
  return q;
}

function renderBadges(g) {
  const badges = [];
  const waterBeast = g.counters.waterHits >= 3;
  const proteinLocked = g.counters.proteinHits >= 5;
  const deficitKing = g.counters.deficitHits >= 3;
  const consistency7 = g.streak >= 7;

  badges.push({ name:'Hydration Beast', on: waterBeast });
  badges.push({ name:'Protein Locked', on: proteinLocked });
  badges.push({ name:'Deficit King', on: deficitKing });
  badges.push({ name:'Consistency x7', on: consistency7 });

  els.badges.innerHTML = badges.map(b => `<span class="badge ${b.on ? 'on':''}">${b.on ? '🏅' : '🔒'} ${b.name}</span>`).join('');
}

function render() {
  const d = loadDay();
  const g = loadGame();

  els.todayLabel.textContent = `Today: ${todayKey()} • Water target: ${WATER_TARGET_ML} ml • Cal cap: ${CAL_CAP} • Protein target: ${PROTEIN_TARGET}g`;

  const last = d.entries[d.entries.length - 1];
  els.recent.textContent = last ? `${new Date(last.ts).toLocaleTimeString()} — ${last.text}` : 'No entries yet.';

  els.tCal.textContent = fmt(d.totals.cal);
  els.tP.textContent = fmt(d.totals.p, 1);
  els.tC.textContent = fmt(d.totals.c, 1);
  els.tF.textContent = fmt(d.totals.f, 1);
  els.tChol.textContent = fmt(d.totals.chol);
  els.tWater.textContent = fmt(d.totals.water);
  els.tAct.textContent = fmt(d.totals.act);

  const deficitNow = (BMR + d.totals.act) - d.totals.cal;
  els.defNow.textContent = `${deficitNow >= 0 ? '−' : '+'}${Math.abs(Math.round(deficitNow))} kcal`;
  els.defNow.className = deficitNow >= 0 ? 'ok' : 'danger';

  // HUD
  const level = Math.floor(g.xp / 250) + 1;
  els.lvl.textContent = level;
  els.xp.textContent = g.xp;
  els.streak.textContent = g.streak;

  const quests = computeQuests(d);
  const doneCount = quests.filter(x => x.done).length;
  els.questsDone.textContent = doneCount;

  els.quests.innerHTML = quests.map(q => `
    <div class="check">
      <span>${q.done ? '✅' : '⬜️'}</span>
      <span>${q.name}</span>
    </div>
  `).join('');

  els.hudLine.textContent = `Deficit now: ${Math.round(deficitNow)} kcal • Water remaining: ${Math.max(0, WATER_TARGET_ML - d.totals.water)} ml`;

  renderBadges(g);

  const lastSummary = JSON.parse(localStorage.getItem('lastSummary') || 'null');
  if (lastSummary) {
    els.lastSummary.textContent =
      `${lastSummary.date} — Intake ${lastSummary.intake} kcal, Burn ${lastSummary.burn} kcal, Deficit ${lastSummary.deficit} kcal, Water ${lastSummary.water} ml, Quests ${lastSummary.questsDone}/5, XP +${lastSummary.xpEarned}`;
  }
}

function awardXPForDay(d) {
  // XP for quests completion
  const quests = computeQuests(d);
  let xp = 0;
  if (quests.find(q=>q.key==='water').done) xp += 50;
  if (quests.find(q=>q.key==='cal').done) xp += 50;
  if (quests.find(q=>q.key==='protein').done) xp += 50;
  if (quests.find(q=>q.key==='activity').done) xp += 30;
  if (quests.find(q=>q.key==='log').done) xp += 20;
  return { xp, questsDone: quests.filter(q=>q.done).length };
}

function endDay() {
  const d = loadDay();
  const burn = BMR + d.totals.act;
  const intake = d.totals.cal;
  const deficit = burn - intake;

  const g = loadGame();
  const { xp, questsDone } = awardXPForDay(d);

  // streak logic: if you ended today and completed enough quests
  const prev = g.lastEnded;
  const today = todayKey();

  // count badges
  if (d.totals.water >= WATER_TARGET_ML) g.counters.waterHits += 1;
  if (d.totals.p >= PROTEIN_TARGET) g.counters.proteinHits += 1;
  if (deficit >= 1200) g.counters.deficitHits += 1;

  if (questsDone >= MIN_QUESTS_FOR_STREAK) {
    // if ended yesterday, keep streak; otherwise reset to 1
    if (prev) {
      const prevDate = new Date(prev);
      const todayDate = new Date(today);
      const diffDays = Math.round((todayDate - prevDate) / (1000*60*60*24));
      g.streak = (diffDays === 1) ? (g.streak + 1) : 1;
    } else {
      g.streak = 1;
    }
  } else {
    // ended day but didn't meet minimum quests -> streak doesn't grow
    // keep as-is (or set to 0 if you want harsher)
  }

  g.xp += xp;
  g.lastEnded = today;
  g.counters.daysEnded += 1;
  saveGame(g);

  const summary = {
    date: today,
    intake: Math.round(intake),
    burn: Math.round(burn),
    deficit: Math.round(deficit),
    water: Math.round(d.totals.water),
    questsDone,
    xpEarned: xp
  };
  localStorage.setItem('lastSummary', JSON.stringify(summary));

  alert(
    `Day Saved ✅\n` +
    `Intake: ${summary.intake} kcal\n` +
    `Burn: ${summary.burn} kcal\n` +
    `Deficit: ${summary.deficit} kcal\n` +
    `Water: ${summary.water} ml\n` +
    `Quests: ${summary.questsDone}/5\n` +
    `XP +${summary.xpEarned} (Level ${Math.floor(loadGame().xp/250)+1})`
  );

  render();
}

els.type.addEventListener('change', setFieldsByType);
els.template.addEventListener('change', (e)=>applyTemplate(e.target.value));
els.addBtn.addEventListener('click', addEntry);
els.endDayBtn.addEventListener('click', endDay);

setFieldsByType();
render();
