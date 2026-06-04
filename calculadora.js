// Estado de selecciones
const sel = { especie: null, estado: null, distancia: null, ttha: null };
const labels = { especie: '', estado: '', distancia: '', ttha: '' };

function seleccionar(btn) {
  const group = btn.dataset.group;
  const val   = parseFloat(btn.dataset.val);

  // Desmarcar botones del mismo grupo
  document.querySelectorAll(`[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  sel[group]    = val;
  labels[group] = btn.querySelector('.sel-name').textContent.trim();

  actualizarFormula();
}

function actualizarFormula() {
  if (!sel.especie || !sel.estado || !sel.distancia) return;

  const precioTT = sel.especie * sel.estado * sel.distancia;
  const strip    = document.getElementById('formulaStrip');
  const eq       = document.getElementById('formulaEq');
  const res      = document.getElementById('formulaResult');

  eq.textContent  = `USD ${sel.especie} × ${sel.estado} × ${sel.distancia}`;
  res.textContent = `= USD ${precioTT.toFixed(2)} / TT`;
  strip.style.display = 'flex';
}

function fmt(n) {
  return n.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function calcular() {
  const ha = parseFloat(document.getElementById('hectareas').value) || 0;

  // Validaciones
  const faltante = !sel.especie   ? 'especie'
                 : !sel.estado    ? 'estado'
                 : !sel.distancia ? 'distancia'
                 : !sel.ttha      ? 'rendimiento (TT/ha)'
                 : !ha            ? 'hectáreas'
                 : null;

  if (faltante) {
    if (faltante === 'hectáreas') {
      const inp = document.getElementById('hectareas');
      inp.style.borderColor = '#c45050';
      inp.style.animation   = 'shake 0.35s ease';
      setTimeout(() => { inp.style.borderColor = ''; inp.style.animation = ''; }, 700);
    }
    return;
  }

  const precioTT    = sel.especie * sel.estado * sel.distancia;
  const produccion  = ha * sel.ttha;           // TT totales
  const valorHa     = sel.ttha * precioTT;     // USD por ha
  const valorTotal  = produccion * precioTT;   // USD total

  // Llenar resultados
  document.getElementById('resPrecioTT').textContent   = precioTT.toFixed(2);
  document.getElementById('resProduccion').textContent  = fmt(produccion);
  document.getElementById('resValorHa').textContent     = 'USD ' + fmt(valorHa);
  document.getElementById('resValorFinal').textContent  = 'USD ' + fmt(valorTotal);
  document.getElementById('resHa').textContent          = fmt(ha) + ' ha';

  // Resumen parámetros
  const summary = document.getElementById('paramsSummary');
  summary.innerHTML = `
    <span class="ps-tag">🌲 <strong>${labels.especie}</strong></span>
    <span class="ps-tag">🪵 <strong>${labels.estado}</strong></span>
    <span class="ps-tag">📍 <strong>${labels.distancia}</strong></span>
    <span class="ps-tag">⚖️ <strong>≈ ${sel.ttha} TT/ha</strong></span>
    <span class="ps-tag">📐 <strong>${fmt(ha)} ha</strong></span>
  `;

  // Medidor
  let pct, cat, label;
  if      (valorTotal < 80000)  { pct = (valorTotal / 80000) * 0.22;                              cat = 'low';       label = 'Valor bajo'; }
  else if (valorTotal < 350000) { pct = 0.22 + ((valorTotal - 80000)  / 270000) * 0.26;           cat = 'medium';    label = 'Valor medio'; }
  else if (valorTotal < 900000) { pct = 0.48 + ((valorTotal - 350000) / 550000) * 0.30;           cat = 'high';      label = 'Valor alto'; }
  else                          { pct = Math.min(0.78 + ((valorTotal - 900000) / 1200000) * 0.22, 1.0); cat = 'very-high'; label = 'Valor muy alto'; }

  const colors = {
    'low':       'linear-gradient(90deg,#e07070,#c45050)',
    'medium':    'linear-gradient(90deg,#d4a73a,#c9a84c)',
    'high':      'linear-gradient(90deg,#7ab87e,#5a8a5e)',
    'very-high': 'linear-gradient(90deg,#5a8a5e,#2d4a35)',
  };
  setTimeout(() => {
    document.getElementById('meterFill').style.width      = (pct * 100) + '%';
    document.getElementById('meterFill').style.background = colors[cat];
  }, 80);

  const badge = document.getElementById('meterBadge');
  badge.textContent   = label;
  badge.className     = 'meter-badge ' + cat;
  badge.style.display = 'inline-block';

  // Mostrar resultados
  const el = document.getElementById('results');
  el.classList.add('visible');
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

// Enter en hectáreas
document.getElementById('hectareas').addEventListener('keydown', e => { if (e.key === 'Enter') calcular(); });
document.getElementById('hectareas').addEventListener('input',   () => { document.getElementById('hectareas').style.borderColor = ''; });
