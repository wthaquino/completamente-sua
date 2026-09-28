/* ==================================================================
   GATINHO (TAMAGOTCHI) + PRESENTES + DIÁRIO SECRETO
   [💾 LOCAL] antes de PET_DATA_COMPARTILHADO · [🔥 pet/nossoGatinho] depois
   ================================================================== */

const STATUS = ['fome', 'energia', 'diversao', 'higiene'];
let petStats = { fome: 100, energia: 100, diversao: 100, higiene: 100 };
let salvarTimer;
const compartilhado = () => new Date() >= PET_DATA_COMPARTILHADO;

const FALAS = {
  feliz:    ["Amo quando vocês vêm me ver! 💕", "O amor de vocês me deixa com o coração quentinho.", "Vocês formam uma dupla melhor que Booth e Brennan! 🦴🕵️‍♂️💕", "Miau! Como foi o dia hoje?"],
  fome:     ["Minha barriguinha tá roncando...", "Tem um sachê aí pra mim? 🐟", "Acho que vou desmaiar de fome 😿"],
  energia:  ["Zzz... Só mais 5 minutinhos...", "Tô piscando devagarzinho 🥱", "Preciso de um colinho pra dormir."],
  diversao: ["Tô me sentindo tão sozinho 🧶", "Brinca comigo? Por favorzinho!", "Miau tristinho..."],
  higiene:  ["Eca, pisei na lama...", "Acho que preciso de um banho 🛁", "Tô fedidinho, miau."]
};

const PRESENTES = [
  "O gatinho encontrou um vale-pizza com borda recheada pra próxima maratona de Bones! 🍕🦴",
  "Miau! Achei um vale-viagem pra próxima vez que pegar a estrada para São José do Rio Preto. 🛣️💕",
  "Você desbloqueou um cafuné virtual infinito! 🥰",
  "Vale 1 beijo super especial! 💋",
  "Vale pedir para ele fazer uma receita de massa fresquinha esse fim de semana! 🍝",
  "Miau! Achei esse bilhetinho: 'Você é a melhor parte do meu dia'. 💖"
];

// [status, quanto muda, fala]
const ACOES = {
  'btn-alimentar': [{ fome: +30 },                  "Nhom nhom... Que delícia! 🐟"],
  'btn-dormir':    [{ energia: +40 },               "Boa noite... Sonhando com sachês 💤"],
  'btn-brincar':   [{ diversao: +35, energia: -10 }, "Pega o ratinho! Pega! 🧶🐾"],
  'btn-banho':     [{ higiene: +100 },              "Tô limpinho e cheiroso de novo! 🛁✨"]
};


/* ─── Carregar / salvar ─── */
function aplicarStats(dados) {
  STATUS.forEach(k => {
    const n = Number(dados?.[k]);
    if (!isNaN(n)) petStats[k] = Math.min(100, Math.max(0, n));
  });
}

async function carregarPet() {
  try { aplicarStats(JSON.parse(localStorage.getItem('nossoGatinho'))); } catch {}
  if (compartilhado()) {
    try { aplicarStats((await petDoc.get()).data()?.stats); } catch (e) { console.error(e); }
  }
  atualizarPet();
}

function salvarPet() {
  try { localStorage.setItem('nossoGatinho', JSON.stringify(petStats)); } catch {}
  if (!compartilhado()) return;
  clearTimeout(salvarTimer);                              // grava 3s depois da última mudança
  salvarTimer = setTimeout(() =>
    petDoc.set({ stats: petStats, atualizadoEm: FieldValue.serverTimestamp() }).catch(console.error), 3000);
}

function mudar(variacao) {
  Object.entries(variacao).forEach(([k, v]) => aplicarStats({ [k]: petStats[k] + v }));
  atualizarPet();
  salvarPet();
}


/* ─── Tela ─── */
function atualizarPet() {
  STATUS.forEach(k => $(`bar-${k}`).style.width = petStats[k] + '%');
  $('pet-display').textContent = STATUS.some(k => petStats[k] < 30) ? '😿' : '🐈';
  $('btn-presente-gato').classList.toggle('hidden', !STATUS.every(k => petStats[k] >= 90));
}

function falar(texto) {
  const balao = $('pet-speech');
  balao.textContent = texto;
  balao.style.animation = 'none';
  void balao.offsetWidth;
  balao.style.animation = '';
}


/* ─── Eventos ─── */
Object.entries(ACOES).forEach(([id, [variacao, fala]]) => {
  $(id).onclick = () => { mudar(variacao); falar(fala); };
});

$('btn-presente-gato').onclick = () => {
  $('gift-message').textContent = sortear(PRESENTES);
  openModal('gift-modal');
  mudar({ energia: -15 });                                // não dá pra abrir infinitas vezes
};

$('pet-fab').onclick = async () => {
  if (compartilhado()) await carregarPet();
  const baixo = STATUS.find(k => petStats[k] < 30);
  falar(sortear(FALAS[baixo || 'feliz']));
  openModal('tamagotchi-modal');
};

// O tempo passando (1 min com a página aberta)
setInterval(() => mudar({ fome: -2, energia: -1, diversao: -2, higiene: -1 }), 60000);

// Easter egg: 5 cliques em 2s no gato → diário secreto
let cliques = 0;
$('pet-display').onclick = () => {
  if (++cliques === 1) setTimeout(() => cliques = 0, 2000);
  if (cliques === 5) openModal('cat-diary-modal');
};
