/* ==================================================================
   MAPA INTERATIVO + ENIGMAS   [🔥 FIREBASE map_pins]
   ------------------------------------------------------------------
   Cada pino tem: cidade, pergunta, resposta_hash, posicao_top,
   posicao_left, recompensa_url (foto mostrada ao acertar).

   CORRIGIDO: a resposta agora é salva como "hash" (SHA-256), então
   não dá mais para ler a resposta pelo DevTools. Pinos antigos, que
   ainda têm "resposta_certa" em texto, continuam funcionando e são
   convertidos quando você edita e salva uma nova resposta.
   ================================================================== */

let mapPins    = [];
let pinoAtual  = null;
const mapaEl   = $('mapa-dinamico-container');


/* ─── Abrir / fechar ─── */
$('openMapBtn').addEventListener('click', () => {
  $('enigma-modal').classList.add('hidden');
  atualizarModoMapa();
  openModal('map-modal');
});

$('closeEnigmaBtn').addEventListener('click', () => {
  $('enigma-modal').classList.add('hidden');
});


/* ─── Carregar e desenhar ─── */
async function carregarPinosDoBanco() {
  try {
    const snapshot = await mapPinsCollection.orderBy('data_criacao', 'desc').get();
    mapPins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao carregar os pinos:', error);
    mapPins = [];
  }
  renderizarPinosNoMapa();
  renderizarListaDePinosEditor();
}

function renderizarPinosNoMapa() {
  mapaEl.querySelectorAll('.map-pin:not(.map-pin--preview)').forEach(p => p.remove());

  mapPins.forEach(pino => {
    const pin = document.createElement('button');
    pin.className = 'map-pin';
    pin.style.top  = pino.posicao_top;
    pin.style.left = pino.posicao_left;
    pin.setAttribute('aria-label', pino.cidade);
    pin.title = pino.cidade;
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirEnigma(pino);
    });
    mapaEl.appendChild(pin);
  });
}


/* ─── Enigma ─── */
function abrirEnigma(pino) {
  pinoAtual = pino;
  $('enigma-title').textContent    = '📍 ' + pino.cidade;
  $('enigma-question').textContent = pino.pergunta;
  $('enigma-answer').value         = '';
  $('enigma-feedback').textContent = '';
  $('enigma-form').classList.remove('hidden');
  $('enigma-success').classList.add('hidden');
  $('enigma-modal').classList.remove('hidden');
}

async function respostaEstaCerta(pino, tentativa) {
  const normalizada = normalizarResposta(tentativa);
  if (pino.resposta_hash)  return (await sha256(normalizada)) === pino.resposta_hash;
  if (pino.resposta_certa) return normalizada === normalizarResposta(pino.resposta_certa);  // pinos antigos
  return false;
}

async function resolverEnigma() {
  if (!pinoAtual) return;
  const tentativa = $('enigma-answer').value;
  if (!tentativa.trim()) return;

  if (await respostaEstaCerta(pinoAtual, tentativa)) {
    // CORRIGIDO: a foto de recompensa agora aparece
    $('enigma-form').classList.add('hidden');
    $('enigma-success').classList.remove('hidden');

    const recompensa = safeUrl(pinoAtual.recompensa_url);
    const img = $('enigma-reward-img');
    img.classList.toggle('hidden', !recompensa);
    if (recompensa) img.src = recompensa;

    createHeartShower();
  } else {
    $('enigma-feedback').textContent = 'Humm... resposta errada. Tente de novo! 🤔';
    const card = $('enigma-modal');
    card.classList.remove('shake');
    void card.offsetWidth;          // reinicia a animação
    card.classList.add('shake');
  }
}

$('btn-resolver-enigma').addEventListener('click', resolverEnigma);
$('enigma-answer').addEventListener('keydown', (e) => { if (e.key === 'Enter') resolverEnigma(); });


/* ==================================================================
   PAINEL ADMIN: criar, editar e apagar pinos
   ================================================================== */

// No modo edição, tocar no mapa preenche as posições do pino
function atualizarModoMapa() {
  mapaEl.classList.toggle('picking', modoEdicao);
  $('map-admin-hint').classList.toggle('hidden', !modoEdicao);
}

mapaEl.addEventListener('click', (e) => {
  if (!modoEdicao) return;
  const r    = mapaEl.getBoundingClientRect();
  const top  = ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%';
  const left = ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%';

  $('pin-top').value  = top;
  $('pin-left').value = left;

  let preview = mapaEl.querySelector('.map-pin--preview');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'map-pin map-pin--preview';
    mapaEl.appendChild(preview);
  }
  preview.style.top  = top;
  preview.style.left = left;
  showToast(`Posição escolhida: ${top} / ${left} 📍`);
});

// Aceita "70", "70%" ou "70,5%" → devolve "70.5%" (ou null se inválido)
function normalizarPosicao(valor) {
  const n = parseFloat(String(valor).replace(',', '.').replace('%', ''));
  return (isNaN(n) || n < 0 || n > 100) ? null : `${n}%`;
}

function renderizarListaDePinosEditor() {
  const lista = $('lista-pinos');
  lista.innerHTML = '';

  if (mapPins.length === 0) {
    const vazio = document.createElement('span');
    vazio.className = 'muted';
    vazio.textContent = 'Nenhum pino cadastrado ainda.';
    lista.appendChild(vazio);
    return;
  }

  mapPins.forEach(pino => {
    const item = document.createElement('div');
    item.className = 'pin-item';

    const nome = document.createElement('span');
    nome.textContent = '📍 ' + pino.cidade;

    const botoes = document.createElement('div');
    const editar = document.createElement('button');
    editar.className = 'pin-edit';
    editar.textContent = 'Editar';
    editar.addEventListener('click', () => prepararEdicaoPino(pino.id));

    const apagar = document.createElement('button');
    apagar.className = 'pin-delete';
    apagar.textContent = 'X';
    apagar.setAttribute('aria-label', 'Apagar pino');
    apagar.addEventListener('click', () => deletarPino(pino.id));

    botoes.append(editar, apagar);
    item.append(nome, botoes);
    lista.appendChild(item);
  });
}

function prepararEdicaoPino(id) {
  const pino = mapPins.find(p => p.id === id);
  if (!pino) return;

  $('pin-id').value         = pino.id;
  $('pin-cidade').value     = pino.cidade;
  $('pin-pergunta').value   = pino.pergunta;
  $('pin-resposta').value   = '';
  $('pin-resposta').placeholder = 'Deixe vazio para manter a resposta atual';
  $('pin-top').value        = pino.posicao_top;
  $('pin-left').value       = pino.posicao_left;
  $('pin-recompensa').value = pino.recompensa_url || '';

  $('btn-salvar-pin').textContent = 'Atualizar Pino ✏️';
  $('btn-cancelar-edicao-pin').classList.remove('hidden');
  $('pin-cidade').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function limparFormularioPino() {
  ['pin-id', 'pin-cidade', 'pin-pergunta', 'pin-resposta', 'pin-top', 'pin-left', 'pin-recompensa']
    .forEach(id => $(id).value = '');
  $('pin-resposta').placeholder = 'Resposta Correta (Ex: 21/04/2026)';
  $('btn-salvar-pin').textContent = 'Salvar Novo Pino 💾';
  $('btn-cancelar-edicao-pin').classList.add('hidden');
  mapaEl.querySelector('.map-pin--preview')?.remove();
}

$('btn-cancelar-edicao-pin').addEventListener('click', limparFormularioPino);

async function deletarPino(id) {
  if (!confirm('Tem certeza que deseja apagar este pino para sempre?')) return;
  try {
    await mapPinsCollection.doc(id).delete();
    showToast('Pino excluído!');
    carregarPinosDoBanco();
  } catch (error) {
    console.error('Erro ao deletar:', error);
    showToast('Erro de permissão ou conexão ao excluir.');
  }
}

$('btn-salvar-pin').addEventListener('click', async () => {
  const id         = $('pin-id').value;
  const cidade     = $('pin-cidade').value.trim();
  const pergunta   = $('pin-pergunta').value.trim();
  const resposta   = $('pin-resposta').value;
  const topPos     = normalizarPosicao($('pin-top').value);
  const leftPos    = normalizarPosicao($('pin-left').value);
  const recompensa = $('pin-recompensa').value.trim();

  if (!cidade || !pergunta || !topPos || !leftPos || (!id && !resposta.trim())) {
    return showToast('Preencha lugar, pergunta, resposta e posições (0–100%).');
  }
  if (recompensa && !safeUrl(recompensa)) {
    return showToast('Link da recompensa inválido.');
  }

  const dados = {
    cidade,
    pergunta,
    posicao_top:    topPos,
    posicao_left:   leftPos,
    recompensa_url: safeUrl(recompensa) || ''
  };

  if (resposta.trim()) {
    dados.resposta_hash = await sha256(normalizarResposta(resposta));
  }

  const salvou = await comBotaoOcupado($('btn-salvar-pin'), 'Processando... ⏳', async () => {
    try {
      if (id) {
        if (dados.resposta_hash) dados.resposta_certa = firebase.firestore.FieldValue.delete();
        await mapPinsCollection.doc(id).update(dados);
        showToast('Pino atualizado! ✨');
      } else {
        await mapPinsCollection.add({
          ...dados,
          data_criacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('Novo pino adicionado! 🎉');
      }
      return true;
    } catch (error) {
      console.error('Erro ao salvar pino:', error);
      showToast('Erro ao salvar o pino.');
      return false;
    }
  });

  if (!salvou) return;
  limparFormularioPino();
  carregarPinosDoBanco();
});
