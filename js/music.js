/* ==================================================================
   [🎵 MÚSICA] PLAYER DE FUNDO
   ------------------------------------------------------------------
   O MP3 fica no Cloudinary (URL em config.js → MUSICA_FUNDO_URL).
   Os navegadores só deixam tocar som depois de um clique do usuário,
   por isso tocarMusicaDeFundo() é chamada no botão "Entrar" (main.js).

   Os links do Spotify de cada foto são outra coisa: ficam no campo
   "musicLink" da foto (ver gallery.js e admin.js).
   ================================================================== */

const musicPlayer = $('music-player');
musicPlayer.src = MUSICA_FUNDO_URL;

function tocarMusicaDeFundo() {
  musicPlayer.volume = MUSICA_VOLUME_INICIAL;
  musicPlayer.play().catch(() => {
    console.log('O navegador bloqueou o autoplay — use o botão ▶ do player.');
  });
}
