/* ==================================================================
   ROLETA DA NOITE — edite as listas para mudar as opções
   ================================================================== */

const ROLETA = [
  ['🍽️', ["Pizza de Borda Recheada 🍕", "Rodada de Esfirras 🥟", "Suflê Quentinho 🍮", "Delivery Especial 🥡", "Massa Fresquinha 🍝"]],
  ['📺', ["Maratona de Bones 🦴", "Filme de Terror 👻", "Vídeos Engraçados 😂", "Série Nova 🍿"]],
  ['🐾', ["Cafuné até dormir 🐈", "Tentar resolver o Cubo Mágico 🧊", "Planejar a ida pra Rio Preto 🛣️", "Dormir agarradinho 💤"]]
];

const mostrarNaRoleta = (className, linhas) =>
  $('roleta-resultado').replaceChildren(...linhas.map(textContent => el('div', { className, textContent })));

$('openRoletaBtn').onclick = () => {
  mostrarNaRoleta('placeholder', ['Clique no botão abaixo para sortear o nosso encontro perfeito!']);
  $('btn-girar-roleta').textContent = 'Girar Roleta 🎲';
  openModal('roleta-modal');
};

$('btn-girar-roleta').onclick = () => {
  const btn = $('btn-girar-roleta');
  btn.disabled = true;
  btn.textContent = 'Girando... 🔄';
  mostrarNaRoleta('spinning', ['🎰 🎰 🎰']);

  setTimeout(() => {
    mostrarNaRoleta('item', ROLETA.map(([icone, opcoes]) => `${icone} ${sortear(opcoes)}`));
    btn.disabled = false;
    btn.textContent = 'Girar de Novo 🎲';
    createHeartShower();
  }, 1500);
};
