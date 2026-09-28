/* ==================================================================
   INICIALIZAÇÃO + [🎵 MÚSICA DE FUNDO]
   ================================================================== */

const musica = $('music-player');
musica.src = MUSICA_FUNDO_URL;

loadSettings();          // fundo (admin.js)
carregarPinosDoBanco();  // mapa (map.js)
carregarPet();           // gatinho (pet.js)

$('enterBtn').onclick = () => {
  $('intro-screen').classList.add('fade-out');
  createHeartShower();

  // O navegador só deixa tocar som depois de um clique — por isso fica aqui
  musica.volume = MUSICA_VOLUME;
  musica.play().catch(() => {});

  setTimeout(() => {
    $('intro-screen').classList.add('hidden');
    document.body.classList.remove('intro');
    $('main-content').classList.remove('hidden');
    loadPhotos();        // galeria (gallery.js)
  }, 1000);
};
