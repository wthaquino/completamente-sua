/* ==================================================================
   FUNDO DA PÁGINA   [☁️ CLOUDINARY] [🔥 FIREBASE settings/appSettings]
   ================================================================== */

const BG_DEGRADE_TRANSPARENTE = "linear-gradient(to bottom right, rgba(142, 30, 92, 0.8), rgba(216, 108, 163, 0.8))";
const BG_DEGRADE_SOLIDO       = "linear-gradient(to bottom right, #8e1e5c, #d86ca3)";

function applyBackground(imageUrl) {
  const url   = safeUrl(imageUrl);
  const valor = url ? `${BG_DEGRADE_TRANSPARENTE}, url("${url}")` : BG_DEGRADE_SOLIDO;

  [document.body, $('intro-screen')].forEach(el => {
    el.style.backgroundImage    = valor;
    el.style.backgroundSize     = 'cover';
    el.style.backgroundPosition = 'center';
  });
}

/* CORRIGIDO: antes, quando não havia fundo salvo, esta função tentava
   GRAVAR no Firestore e mostrava um aviso a cada visita.
   Agora só aplica o degradê padrão.                                  */
async function loadSettings() {
  try {
    const doc = await settingsDoc.get();
    applyBackground(doc.exists ? doc.data().backgroundImageUrl : null);
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    applyBackground(null);
  }
}

// Novo fundo (só admin)
$('changeBgBtn').addEventListener('click', async () => {
  const file = $('bgImageInput').files[0];
  if (!file) return showToast('Selecione uma imagem.');

  await comBotaoOcupado($('changeBgBtn'), 'Aplicando...', async () => {
    try {
      const imagem = await redimensionarImagem(file, FUNDO_LARGURA_MAX, Infinity, FUNDO_QUALIDADE);
      const url    = await uploadToCloudinary(imagem);
      await settingsDoc.set({ backgroundImageUrl: url }, { merge: true });
      applyBackground(url);
      $('bgImageInput').value = '';
      showToast('Fundo alterado!');
    } catch (error) {
      showToast('Erro ao trocar o fundo.');
    }
  });
});

// Remover fundo (só admin)
$('removeBgBtn').addEventListener('click', async () => {
  if (!confirm('Remover fundo?')) return;
  try {
    await settingsDoc.set({ backgroundImageUrl: null }, { merge: true });
    applyBackground(null);
    showToast('Fundo removido com sucesso!');
  } catch (error) {
    showToast('Erro ao remover fundo.');
  }
});
