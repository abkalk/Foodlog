const BMR = 1833;
const WATER_TARGET_ML = 4000;

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
};

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0,10); // YYYY-MM-DD
}

function loadDay() {
  const key = `day:${todayKey()}`;
  return JSON.parse(localStorage.getItem(key) || '{"entries":[],"totals":{"cal":0,"p":0,"c":0,"f":0,"chol":0,"water":0,"act":0}}');
}

function saveDay(data) {
  const key = `day:${todayKey()}`;
  localStorage.setItem(key, JSON.stringify(data));
}

function setFieldsByType() {
  const t = els.type.value;
  els.foodFields.style.display = (t === 'food') ? 'block' : 'none';
  els.waterFields.style.display = (t === 'water') ? 'block' : 'none';
  els.suppFields.style.display = (t === 'supp') ? 'block' : 'none';
  els.activityFields.style.display = (t === 'activity') ? 'block' : 'none';
}

function fmt(n, digits=0){ return Number(n || 0).toFixed(digits); }

function render() {
  const d = loadDay();
  els.todayLabel.textContent = `Today: ${todayKey()} • Water target: ${WATER_TARGET_ML} ml`;
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

  const lastSummary = JSON.parse(localStorage.getItem('lastSummary') || 'null');
  if (lastSummary) {
    els.lastSummary.textContent =
      `${lastSummary.date} — Intake ${lastSummary.intake} kcal, Burn ${lastSummary.burn} kcal, Deficit ${lastSummary.deficit} kcal, Water ${lastSummary.water} ml`;
  }
}

function applyTemplate(v){
  // reset
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

  // reset template dropdown
  els.template.value = '';
  render();
}

function endDay() {
  const d = loadDay();
  const burn = BMR + d.totals.act;
  const intake = d.totals.cal;
  const deficit = burn - intake;

  const summary = {
    date: todayKey(),
    intake: Math.round(intake),
    burn: Math.round(burn),
    deficit: Math.round(deficit),
    water: Math.round(d.totals.water),
  };
  localStorage.setItem('lastSummary', JSON.stringify(summary));
  alert(`Saved Day Summary:\nIntake: ${summary.intake} kcal\nBurn: ${summary.burn} kcal\nDeficit: ${summary.deficit} kcal\nWater: ${summary.water} ml`);
  render();
}

els.type.addEventListener('change', setFieldsByType);
els.template.addEventListener('change', (e)=>applyTemplate(e.target.value));
els.addBtn.addEventListener('click', addEntry);
els.endDayBtn.addEventListener('click', endDay);

setFieldsByType();
render();
