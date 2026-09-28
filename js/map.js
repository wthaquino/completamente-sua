/* ==================================================================
   MAPA + ENIGMAS   [🔥 FIREBASE map_pins]
   A resposta é salva só como hash (SHA-256).
   ================================================================== */

let mapPins = [];
let pinoAtual = null;
const mapa = $('mapa-dinamico-container');

$('openMapBtn').onclick = () => {
  $('enigma-modal').classList.add('hidden');
  openModal('map-modal');
};
$('closeEnigmaBtn').onclick = () => $('enigma-modal').classList.add('hidden');


async function carregarPinosDoBanco() {
  try {
    const snap = await mapPinsCollection.orderBy('data_criacao', 'desc').get();
    mapPins = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(e);
  }

  mapa.querySelectorAll('.map-pin:not(.map-pin--preview)').forEach(p => p.remove());
  mapa.append(...mapPins.map(pino => {
    const pin = el('button', { className: 'map-pin', title: pino.cidade, ariaLabel: pino.cidade });
    Object.assign(pin.style, { top: pino.posicao_top, left: pino.posicao_left });
    pin.onclick = (e) => { e.stopPropagation(); abrirEnigma(pino); };
    return pin;
  }));

  renderizarListaDePinos();
}


/* ─── Enigma ─── */
function abrirEnigma(pino) {
  pinoAtual = pino;
  $('enigma-title').textContent    = '📍 ' + pino.cidade;
  $('enigma-question').textContent = pino.pergunta;
  $('enigma-answer').value = $('enigma-feedback').textContent = '';
  $('enigma-form').classList.remove('hidden');
  $('enigma-success').classList.add('hidden');
  $('enigma-modal').classList.remove('hidden');
}

async function resolverEnigma() {
  const tentativa = normalizarResposta($('enigma-answer').value);
  if (!pinoAtual || !tentativa) return;

  const certo = pinoAtual.resposta_hash
    ? await sha256(tentativa) === pinoAtual.resposta_hash
    : tentativa === normalizarResposta(pinoAtual.resposta_certa);   // pinos antigos (ainda não convertidos)

  if (!certo) {
    $('enigma-feedback').textContent = 'Humm... resposta errada. Tente de novo! 🤔';
    $('enigma-modal').classList.remove('shake');
    void $('enigma-modal').offsetWidth;                              // reinicia a animação
    $('enigma-modal').classList.add('shake');
    return;
  }

  const recompensa = safeUrl(pinoAtual.recompensa_url || '');
  $('enigma-form').classList.add('hidden');
  $('enigma-success').classList.remove('hidden');
  $('enigma-reward-img').classList.toggle('hidden', !recompensa);
  if (recompensa) $('enigma-reward-img').src = recompensa;
  createHeartShower();
}

$('btn-resolver-enigma').onclick = resolverEnigma;
$('enigma-answer').onkeydown = (e) => e.key === 'Enter' && resolverEnigma();


/* ==================================================================
   PAINEL ADMIN — tocar no mapa (modo edição) preenche a posição
   ================================================================== */
function atualizarModoMapa() {
  mapa.classList.toggle('picking', modoEdicao);
  $('map-admin-hint').classList.toggle('hidden', !modoEdicao);
}

mapa.onclick = (e) => {
  if (!modoEdicao) return;
  const r = mapa.getBoundingClientRect();
  const top  = ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%';
  const left = ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%';
  $('pin-top').value  = top;
  $('pin-left').value = left;

  const preview = mapa.querySelector('.map-pin--preview') || mapa.appendChild(el('div', { className: 'map-pin map-pin--preview' }));
  Object.assign(preview.style, { top, left });
  showToast(`Posição escolhida: ${top} / ${left} 📍`);
};

// "70", "70%" ou "70,5%" → "70.5%" (null se fora de 0–100)
function normalizarPosicao(valor) {
  const n = parseFloat(valor.replace(',', '.'));
  return n >= 0 && n <= 100 ? `${n}%` : null;
}

function renderizarListaDePinos() {
  $('lista-pinos').replaceChildren(...(mapPins.length
    ? mapPins.map(pino => el('div', { className: 'pin-item' },
        el('span', { textContent: '📍 ' + pino.cidade }),
        el('div', {},
          el('button', { className: 'pin-edit',   textContent: 'Editar', onclick: () => editarPino(pino) }),
          el('button', { className: 'pin-delete', textContent: 'X', ariaLabel: 'Apagar pino', onclick: () => deletarPino(pino.id) })
        )))
    : [el('span', { className: 'muted', textContent: 'Nenhum pino cadastrado ainda.' })]));
}

const CAMPOS_PINO = ['pin-id', 'pin-cidade', 'pin-pergunta', 'pin-resposta', 'pin-top', 'pin-left', 'pin-recompensa'];

function editarPino(pino) {
  const valores = [pino.id, pino.cidade, pino.pergunta, '', pino.posicao_top, pino.posicao_left, pino.recompensa_url || ''];
  CAMPOS_PINO.forEach((id, i) => $(id).value = valores[i]);
  $('pin-resposta').placeholder = 'Deixe vazio para manter a resposta atual';
  $('btn-salvar-pin').textContent = 'Atualizar Pino ✏️';
  $('btn-cancelar-edicao-pin').classList.remove('hidden');
  $('pin-cidade').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function limparFormularioPino() {
  CAMPOS_PINO.forEach(id => $(id).value = '');
  $('pin-resposta').placeholder = 'Resposta Correta (Ex: 21/04/2026)';
  $('btn-salvar-pin').textContent = 'Salvar Novo Pino 💾';
  $('btn-cancelar-edicao-pin').classList.add('hidden');
  mapa.querySelector('.map-pin--preview')?.remove();
}

$('btn-cancelar-edicao-pin').onclick = limparFormularioPino;

async function deletarPino(id) {
  if (!confirm('Tem certeza que deseja apagar este pino para sempre?')) return;
  try {
    await mapPinsCollection.doc(id).delete();
    showToast('Pino excluído!');
    carregarPinosDoBanco();
  } catch {
    showToast('Erro ao excluir o pino.');
  }
}

$('btn-salvar-pin').onclick = async () => {
  const id         = $('pin-id').value;
  const resposta   = $('pin-resposta').value.trim();
  const recompensa = $('pin-recompensa').value.trim();
  const dados = {
    cidade:         $('pin-cidade').value.trim(),
    pergunta:       $('pin-pergunta').value.trim(),
    posicao_top:    normalizarPosicao($('pin-top').value),
    posicao_left:   normalizarPosicao($('pin-left').value),
    recompensa_url: safeUrl(recompensa) || ''
  };

  if (!dados.cidade || !dados.pergunta || !dados.posicao_top || !dados.posicao_left || (!id && !resposta)) {
    return showToast('Preencha lugar, pergunta, resposta e posições (0–100%).');
  }
  if (recompensa && !dados.recompensa_url) return showToast('Link da recompensa inválido.');

  if (resposta) dados.resposta_hash = await sha256(normalizarResposta(resposta));

  const ok = await executar($('btn-salvar-pin'), 'Processando... ⏳', 'Erro ao salvar o pino.', () =>
    id ? mapPinsCollection.doc(id).update(resposta ? { ...dados, resposta_certa: FieldValue.delete() } : dados)
       : mapPinsCollection.add({ ...dados, data_criacao: FieldValue.serverTimestamp() }));
  if (!ok) return;

  showToast(id ? 'Pino atualizado! ✨' : 'Novo pino adicionado! 🎉');
  limparFormularioPino();
  carregarPinosDoBanco();
};
