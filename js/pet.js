/* ==================================================================
   TAMAGOTCHI (O GATINHO) + PRESENTES + DIÁRIO SECRETO
   ------------------------------------------------------------------
   [💾 LOCAL]     antes de PET_DATA_COMPARTILHADO (config.js): cada
                  aparelho tem o seu gato, salvo no localStorage.
   [🔥 FIREBASE]  a partir dessa data: o gato é o mesmo para vocês duas,
                  salvo no documento pet/nossoGatinho.

   CORRIGIDO: antes, a partir de 29/10 o gato simplesmente parava de
   salvar (o trecho do Firebase estava vazio).
   ================================================================== */

const PET_STORAGE_KEY = 'nossoGatinho';
let petStats = { fome: 100, energia: 100, diversao: 100, higiene: 100 };
let salvarRemotoTimer;

function petCompartilhado() {
  return new Date() >= PET_DATA_COMPARTILHADO;
}


/* ─── Falas ─── */
const frasesFelizes = [
  "Amo quando vocês vêm me ver! 💕",
  "O amor de vocês me deixa com o coração quentinho.",
  "Vocês formam uma dupla melhor que Booth e Brennan! 🦴🕵️‍♂️💕",
  "Miau! Como foi o dia hoje?"
];
const frasesFome   = ["Minha barriguinha tá roncando...", "Tem um sachê aí pra mim? 🐟", "Acho que vou desmaiar de fome 😿"];
const frasesSono   = ["Zzz... Só mais 5 minutinhos...", "Tô piscando devagarzinho 🥱", "Preciso de um colinho pra dormir."];
const frasesTriste = ["Tô me sentindo tão sozinho 🧶", "Brinca comigo? Por favorzinho!", "Miau tristinho..."];
const frasesSujo   = ["Eca, pisei na lama...", "Acho que preciso de um banho 🛁", "Tô fedidinho, miau."];

/* ─── Presentes (aparecem quando tudo está >= 90%) ─── */
const recompensasDoGato = [
  "O gatinho encontrou um vale-pizza com borda recheada pra próxima maratona de Bones! 🍕🦴",
  "Miau! Achei um vale-viagem pra próxima vez que pegar a estrada para São José do Rio Preto. 🛣️💕",
  "Você desbloqueou um cafuné virtual infinito! 🥰",
  "Vale 1 beijo super especial! 💋",
  "Vale pedir para ele fazer uma receita de massa fresquinha esse fim de semana! 🍝",
  "Miau! Achei esse bilhetinho: 'Você é a melhor parte do meu dia'. 💖"
];


/* ─── Carregar e salvar ─── */

// Garante que os valores são números de 0 a 100
function validarStats(dados) {
  const limpo = { ...petStats };
  ['fome', 'energia', 'diversao', 'higiene'].forEach(k => {
    const n = Number(dados?.[k]);
    if (!isNaN(n)) limpo[k] = Math.min(100, Math.max(0, n));
  });
  return limpo;
}

function lerLocal() {
  try {
    const salvo = localStorage.getItem(PET_STORAGE_KEY);
    return salvo ? JSON.parse(salvo) : null;
  } catch {
    return null;
  }
}

async function carregarPet() {
  let dados = lerLocal();

  if (petCompartilhado()) {
    try {
      const doc = await petDoc.get();
      if (doc.exists) dados = doc.data().stats;
    } catch (error) {
      console.error('Não consegui carregar o gato do Firebase:', error);
    }
  }

  if (dados) petStats = validarStats(dados);
  atualizarBarrasPet();
}

function salvarPet() {
  try { localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(petStats)); } catch { /* modo anônimo */ }

  if (petCompartilhado()) {
    // Espera 3s sem mudanças antes de gravar (evita gravar a cada clique)
    clearTimeout(salvarRemotoTimer);
    salvarRemotoTimer = setTimeout(() => {
      petDoc.set({
        stats: petStats,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(error => console.error('Erro ao salvar o gato:', error));
    }, 3000);
  }
}


/* ─── Tela ─── */
function algumStatusBaixo() {
  return Object.values(petStats).some(v => v < 30);
}

function atualizarBarrasPet() {
  $('bar-fome').style.width     = petStats.fome     + '%';
  $('bar-energia').style.width  = petStats.energia  + '%';
  $('bar-diversao').style.width = petStats.diversao + '%';
  $('bar-higiene').style.width  = petStats.higiene  + '%';

  $('pet-display').textContent = algumStatusBaixo() ? '😿' : '🐈';

  const tudoAlto = Object.values(petStats).every(v => v >= 90);
  $('btn-presente-gato').classList.toggle('hidden', !tudoAlto);
}

function falar(texto) {
  const balao = $('pet-speech');
  balao.textContent = texto;
  balao.style.animation = 'none';
  void balao.offsetWidth;
  balao.style.animation = '';
}

function atualizarFalaPet() {
  if      (petStats.fome     < 30) falar(sortear(frasesFome));
  else if (petStats.energia  < 30) falar(sortear(frasesSono));
  else if (petStats.diversao < 30) falar(sortear(frasesTriste));
  else if (petStats.higiene  < 30) falar(sortear(frasesSujo));
  else                             falar(sortear(frasesFelizes));
}


/* ─── Ações ─── */
function acaoPet(alterar, fala) {
  alterar();
  atualizarBarrasPet();
  salvarPet();
  falar(fala);
}

$('btn-alimentar').addEventListener('click', () => acaoPet(
  () => { petStats.fome = Math.min(100, petStats.fome + 30); },
  "Nhom nhom... Que delícia! 🐟"
));

$('btn-dormir').addEventListener('click', () => acaoPet(
  () => { petStats.energia = Math.min(100, petStats.energia + 40); },
  "Boa noite... Sonhando com sachês 💤"
));

$('btn-brincar').addEventListener('click', () => acaoPet(
  () => {
    petStats.diversao = Math.min(100, petStats.diversao + 35);
    petStats.energia  = Math.max(0,   petStats.energia  - 10);
  },
  "Pega o ratinho! Pega! 🧶🐾"
));

$('btn-banho').addEventListener('click', () => acaoPet(
  () => { petStats.higiene = 100; },
  "Tô limpinho e cheiroso de novo! 🛁✨"
));

// Presente — gasta energia para não abrir infinitas vezes
$('btn-presente-gato').addEventListener('click', () => {
  $('gift-message').textContent = sortear(recompensasDoGato);
  openModal('gift-modal');
  petStats.energia = Math.max(0, petStats.energia - 15);
  atualizarBarrasPet();
  salvarPet();
});


/* ─── O tempo passando (a cada 1 minuto com a página aberta) ─── */
setInterval(() => {
  petStats.fome     = Math.max(0, petStats.fome     - 2);
  petStats.energia  = Math.max(0, petStats.energia  - 1);
  petStats.diversao = Math.max(0, petStats.diversao - 2);
  petStats.higiene  = Math.max(0, petStats.higiene  - 1);
  atualizarBarrasPet();
  salvarPet();
}, 60000);


/* ─── Abrir o gato (botão flutuante) ─── */
$('pet-fab').addEventListener('click', async () => {
  if (petCompartilhado()) await carregarPet();   // pega o estado mais novo
  atualizarFalaPet();
  openModal('tamagotchi-modal');
});


/* ─── Easter egg: 5 cliques rápidos no gato → diário secreto ─── */
let cliquesNoGato = 0;
let timerCliques;

$('pet-display').addEventListener('click', () => {
  cliquesNoGato++;

  if (cliquesNoGato === 1) {
    timerCliques = setTimeout(() => { cliquesNoGato = 0; }, 2000);
  }

  if (cliquesNoGato >= 5) {
    clearTimeout(timerCliques);
    cliquesNoGato = 0;
    openModal('cat-diary-modal');
  }
});
