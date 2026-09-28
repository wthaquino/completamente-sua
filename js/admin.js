/* ==================================================================
   ADMINISTRAÇÃO   [🔥 FIREBASE AUTH] [📷 FOTOS] [☁️ CLOUDINARY]
   Login, lembranças (criar/editar/apagar) e fundo da página
   ================================================================== */

let modoEdicao = false;
const isAdmin = () => auth.currentUser?.email === ADMIN_EMAIL;

function setModoEdicao(ligado) {
  modoEdicao = ligado;
  document.body.classList.toggle('edit-mode', ligado);
  $('editor').classList.toggle('hidden', !ligado);
  $('editBtn').textContent = ligado ? 'Fechar Edição' : 'Modo Edição';
  atualizarModoMapa();                                   // map.js
  if (ligado) $('editor').scrollIntoView({ behavior: 'smooth' });
}


/* ─── Login / logout ─── */
$('editBtn').onclick = () => {
  if (isAdmin()) return setModoEdicao(!modoEdicao);
  $('senhaInput').value = '';
  openModal('login-modal');
  setTimeout(() => $('senhaInput').focus(), 50);
};

async function fazerLogin() {
  const ok = await executar($('confirmLoginBtn'), 'Verificando...', 'Chave mestra incorreta 💔', () =>
    auth.signInWithEmailAndPassword(ADMIN_EMAIL, $('senhaInput').value));
  if (!ok) return;
  closeModal('login-modal');
  setModoEdicao(true);
  showToast('Modo de edição liberado! ✨');
}

$('confirmLoginBtn').onclick   = fazerLogin;
$('senhaInput').onkeydown      = (e) => e.key === 'Enter' && fazerLogin();
$('forgotPasswordBtn').onclick = () => showToast(DICA_SENHA);

$('logoutBtn').onclick = async () => {
  await auth.signOut();
  setModoEdicao(false);
  showToast('Você saiu do modo edição.');
};


/* ─── Link de música: vazio é ok; inválido bloqueia ─── */
function lerLinkMusica(id) {
  const valor = $(id).value.trim();
  if (!valor) return '';
  const url = safeUrl(valor);
  if (!url) showToast('Link da música inválido 🎵');
  return url;                                            // null = inválido
}


/* ─── Nova lembrança: redimensiona → Cloudinary → Firestore ─── */
$('addPhoto').onclick = async () => {
  const file    = $('imageInput').files[0];
  const caption = $('captionInput').value.trim();
  if (!file)    return showToast('Selecione uma imagem 💞');
  if (!caption) return showToast('Adicione uma legenda! 💞');
  const musicLink = lerLinkMusica('musicLinkInput');
  if (musicLink === null) return;

  const ok = await executar($('addPhoto'), 'Enviando...', 'Erro no upload.', async () => {
    const url = await uploadToCloudinary(await redimensionarImagem(file, FOTO_MAX_PX, 0.8));
    await photosCollection.add({
      url, caption, musicLink,
      unlockDate: $('unlockDateInput').value || null,
      likes: 0,
      timestamp: FieldValue.serverTimestamp()
    });
  });
  if (!ok) return;

  ['imageInput', 'captionInput', 'musicLinkInput', 'unlockDateInput'].forEach(id => $(id).value = '');
  showToast('Memória guardada! 💖');
  createHeartShower();
  currentPage = 1;
  loadPhotos();
};


/* ─── Apagar (a imagem continua no Cloudinary; limpe pelo painel dele) ─── */
async function excluirFoto(id) {
  if (!isAdmin() || !confirm('Apagar lembrança?')) return;
  try {
    await photosCollection.doc(id).delete();
    showToast('Apagada.');
    loadPhotos();
  } catch {
    showToast('Erro ao apagar.');
  }
}


/* ─── Editar ─── */
function abrirEdicaoFoto(id) {
  const photo = photos.find(p => p.id === id);
  if (!isAdmin() || !photo) return;
  $('editPhotoId').value         = id;
  $('editCaptionInput').value    = photo.caption    || '';
  $('editMusicLinkInput').value  = photo.musicLink  || '';
  $('editUnlockDateInput').value = photo.unlockDate || '';
  openModal('edit-photo-modal');
}

$('saveEditBtn').onclick = async () => {
  const caption = $('editCaptionInput').value.trim();
  if (!caption) return showToast('Legenda vazia!');
  const musicLink = lerLinkMusica('editMusicLinkInput');
  if (musicLink === null) return;

  const ok = await executar($('saveEditBtn'), 'Salvando...', 'Erro ao salvar.', () =>
    photosCollection.doc($('editPhotoId').value).update({
      caption, musicLink,
      unlockDate: $('editUnlockDateInput').value || null
    }));
  if (!ok) return;

  closeModal('edit-photo-modal');
  showToast('Atualizada! ✨');
  loadPhotos();
};


/* ==================================================================
   FUNDO DA PÁGINA   [☁️ CLOUDINARY] [🔥 settings/appSettings]
   ================================================================== */
function applyBackground(imageUrl) {
  const url = safeUrl(imageUrl || '');
  const bg  = url
    ? `linear-gradient(to bottom right, rgba(142,30,92,.8), rgba(216,108,163,.8)), url("${url}")`
    : '';                                                // vazio = degradê padrão do CSS
  document.body.style.backgroundImage = bg;
  $('intro-screen').style.backgroundImage = bg;
}

async function loadSettings() {
  try {
    const doc = await settingsDoc.get();
    applyBackground(doc.data()?.backgroundImageUrl);
  } catch (e) {
    console.error(e);
  }
}

$('changeBgBtn').onclick = async () => {
  const file = $('bgImageInput').files[0];
  if (!file) return showToast('Selecione uma imagem.');

  let url;
  const ok = await executar($('changeBgBtn'), 'Aplicando...', 'Erro ao trocar o fundo.', async () => {
    url = await uploadToCloudinary(await redimensionarImagem(file, FUNDO_MAX_PX, 0.6));
    await settingsDoc.set({ backgroundImageUrl: url }, { merge: true });
  });
  if (!ok) return;

  applyBackground(url);
  $('bgImageInput').value = '';
  showToast('Fundo alterado!');
};

$('removeBgBtn').onclick = async () => {
  if (!confirm('Remover fundo?')) return;
  const ok = await executar($('removeBgBtn'), 'Removendo...', 'Erro ao remover fundo.', () =>
    settingsDoc.set({ backgroundImageUrl: null }, { merge: true }));
  if (!ok) return;
  applyBackground(null);
  showToast('Fundo removido!');
};
