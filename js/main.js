/* ==================================================================
   INICIALIZAÇÃO — o que acontece ao abrir a página e ao clicar "Entrar"
   ================================================================== */

// Ao abrir: fundo, pinos do mapa e o gatinho
loadSettings();          // background.js
carregarPinosDoBanco();  // map.js
carregarPet();           // pet.js

// Ao clicar em "Entrar"
$('enterBtn').addEventListener('click', () => {
  $('intro-screen').classList.add('fade-out');
  createHeartShower();
  tocarMusicaDeFundo();  // [🎵 MÚSICA] precisa acontecer dentro do clique

  setTimeout(() => {
    $('intro-screen').classList.add('hidden');
    document.body.classList.remove('intro');
    $('main-content').classList.remove('hidden');
    loadPhotos();        // [📷 FOTOS] gallery.js
  }, 1000);
});
