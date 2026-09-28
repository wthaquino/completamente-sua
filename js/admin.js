/* ==================================================================
   ADMINISTRAÇÃO   [🔥 FIREBASE AUTH] [📷 FOTOS] [☁️ CLOUDINARY]
   ------------------------------------------------------------------
   - Login / logout (modo edição)
   - Nova lembrança: arquivo → redimensiona → Cloudinary → Firestore
   - Editar e apagar lembranças
   ================================================================== */

let modoEdicao = false;

function isAdmin() {
  return Boolean(auth.currentUser && auth.currentUser.email === ADMIN_EMAIL);
}

// Liga/desliga o painel e os botões dos cards
function setModoEdicao(ligado) {
  modoEdicao = ligado;
  document.body.classList.toggle('edit-mode', ligado);
  $('editor').classList.toggle('hidden', !ligado);
  $('editBtn').textContent = ligado ? 'Fechar Edição' : 'Modo Edição';
  if (typeof atualizarModoMapa === 'function') atualizarModoMapa();  // map.js
}


/* ─── Login ───
   CORRIGIDO: antes, logar de novo escondia o painel (toggle) e não
   havia como sair. Agora: se já está logado, o botão só abre/fecha o
   painel; o botão "Sair" desloga de verdade.                         */
$('editBtn').addEventListener('click', () => {
  if (isAdmin()) {
    setModoEdicao(!modoEdicao);
    if (modoEdicao) $('editor').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  $('senhaInput').value = '';
  openModal('login-modal');
  setTimeout(() => $('senhaInput').focus(), 50);
});

async function fazerLogin() {
  await comBotaoOcupado($('confirmLoginBtn'), 'Verificando...', async () => {
    try {
      await auth.signInWithEmailAndPassword(ADMIN_EMAIL, $('senhaInput').value);
      closeModal('login-modal');
      setModoEdicao(true);
      showToast('Modo de edição liberado! ✨');
      $('editor').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      showToast('Chave mestra incorreta 💔');
    }
  });
}

$('confirmLoginBtn').addEventListener('click', fazerLogin);
$('senhaInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') fazerLogin(); });

$('forgotPasswordBtn').addEventListener('click', () => {
  showToast(DICA_SENHA || 'Sem dica por aqui 😉');
});

$('logoutBtn').addEventListener('click', async () => {
  await auth.signOut();
  setModoEdicao(false);
  showToast('Você saiu do modo edição.');
});


/* ─── Nova lembrança ─── */
$('addPhoto').addEventListener('click', async () => {
  const file       = $('imageInput').files[0];
  const caption    = $('captionInput').value.trim();
  const musicLink  = $('musicLinkInput').value.trim();     // [🎵 MÚSICA]
  const unlockDate = $('unlockDateInput').value;

  if (!file)    return showToast('Selecione uma imagem 💞');
  if (!caption) return showToast('Adicione uma legenda! 💞');
  if (musicLink && !safeUrl(musicLink)) return showToast('Link da música inválido 🎵');

  await comBotaoOcupado($('addPhoto'), 'Enviando...', async () => {
    try {
      // 1) Redimensiona no aparelho
      const imagem = await redimensionarImagem(file, FOTO_LADO_MAXIMO, FOTO_LADO_MAXIMO, FOTO_QUALIDADE);

      // 2) [☁️ CLOUDINARY] Sobe a imagem
      const url = await uploadToCloudinary(imagem);

      // 3) [🔥 FIREBASE] Salva a lembrança
      await photosCollection.add({
        url,
        caption,
        musicLink:  safeUrl(musicLink) || '',
        unlockDate: unlockDate || null,
        likes:      0,
        timestamp:  firebase.firestore.FieldValue.serverTimestamp()
      });

      showToast('Memória guardada! 💖');
      createHeartShower();
      ['imageInput', 'captionInput', 'musicLinkInput', 'unlockDateInput'].forEach(id => $(id).value = '');

      currentPage = 1;
      await loadPhotos();
    } catch (error) {
      console.error('Erro no upload:', error);
      showToast('Erro no upload.');
    }
  });
});


/* ─── Apagar lembrança (chamado pela galeria) ───
   Observação: apaga o registro no Firestore. A imagem continua no
   Cloudinary (upload sem assinatura não pode apagar). Para limpar,
   use o Media Library do Cloudinary.                                 */
async function excluirFoto(photoId) {
  if (!isAdmin()) return;
  if (!confirm('Apagar lembrança?')) return;

  try {
    await photosCollection.doc(photoId).delete();
    showToast('Apagada.');
    await loadPhotos();
  } catch (error) {
    showToast('Erro ao apagar.');
  }
}


/* ─── Editar lembrança ─── */
function abrirEdicaoFoto(photoId) {
  if (!isAdmin()) return;
  const photo = photos.find(p => p.id === photoId);
  if (!photo) return;

  $('editPhotoId').value         = photo.id;
  $('editCaptionInput').value    = photo.caption    || '';
  $('editMusicLinkInput').value  = photo.musicLink  || '';
  $('editUnlockDateInput').value = photo.unlockDate || '';
  openModal('edit-photo-modal');
}

$('saveEditBtn').addEventListener('click', async () => {
  const id        = $('editPhotoId').value;
  const caption   = $('editCaptionInput').value.trim();
  const musicLink = $('editMusicLinkInput').value.trim();

  if (!caption) return showToast('Legenda vazia!');
  if (musicLink && !safeUrl(musicLink)) return showToast('Link da música inválido 🎵');

  await comBotaoOcupado($('saveEditBtn'), 'Salvando...', async () => {
    try {
      await photosCollection.doc(id).update({
        caption,
        musicLink:  safeUrl(musicLink) || '',
        unlockDate: $('editUnlockDateInput').value || null
      });
      showToast('Atualizada! ✨');
      closeModal('edit-photo-modal');
      await loadPhotos();
    } catch (error) {
      showToast('Erro ao salvar.');
    }
  });
});


/* ─── Mantém o login entre visitas (sem abrir o painel sozinho) ─── */
auth.onAuthStateChanged((user) => {
  if (!user && modoEdicao) setModoEdicao(false);
});
