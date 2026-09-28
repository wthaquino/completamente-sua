/* ==================================================================
   ROLETA DA NOITE — sorteia comida + tela + atividade
   Para mudar as opções, edite as três listas abaixo.
   ================================================================== */

const listaComidas    = ["Pizza de Borda Recheada 🍕", "Rodada de Esfirras 🥟", "Suflê Quentinho 🍮", "Delivery Especial 🥡", "Massa Fresquinha 🍝"];
const listaTelas      = ["Maratona de Bones 🦴", "Filme de Terror 👻", "Vídeos Engraçados 😂", "Série Nova 🍿"];
const listaAtividades = ["Cafuné até dormir 🐈", "Tentar resolver o Cubo Mágico 🧊", "Planejar a ida pra Rio Preto 🛣️", "Dormir agarradinho 💤"];

const roletaResultado = $('roleta-resultado');
const btnGirar        = $('btn-girar-roleta');

function mostrarNaRoleta(linhas, classe) {
  roletaResultado.innerHTML = '';
  linhas.forEach(texto => {
    const el = document.createElement('div');
    el.className = classe;
    el.textContent = texto;
    roletaResultado.appendChild(el);
  });
}

$('openRoletaBtn').addEventListener('click', () => {
  mostrarNaRoleta(['Clique no botão abaixo para sortear o nosso encontro perfeito!'], 'placeholder');
  btnGirar.textContent = 'Girar Roleta 🎲';
  openModal('roleta-modal');
});

btnGirar.addEventListener('click', () => {
  btnGirar.disabled = true;
  btnGirar.textContent = 'Girando... 🔄';
  mostrarNaRoleta(['🎰 🎰 🎰'], 'spinning');

  setTimeout(() => {
    mostrarNaRoleta([
      '🍽️ ' + sortear(listaComidas),
      '📺 ' + sortear(listaTelas),
      '🐾 ' + sortear(listaAtividades)
    ], 'item');

    btnGirar.disabled = false;
    btnGirar.textContent = 'Girar de Novo 🎲';
    createHeartShower();
  }, 1500);
});
