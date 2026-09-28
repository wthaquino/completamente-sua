/* ==================================================================
   UTILITÁRIOS — funções pequenas usadas por vários arquivos
   ================================================================== */

// Atalho para document.getElementById
function $(id) {
  return document.getElementById(id);
}

// Sorteia um item de uma lista
function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}


/* ─── Mensagem rápida (toast) ─── */
let toastTimer;
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}


/* ─── Modais ───
   openModal('id') / closeModal('id').
   Qualquer botão com data-close="id" fecha aquele modal.
   Clicar no fundo escuro fecha também. Esc fecha o último aberto. */
function openModal(id)  { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

document.addEventListener('click', (e) => {
  const closer = e.target.closest('[data-close]');
  if (closer) {
    closeModal(closer.dataset.close);
    return;
  }
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const abertos = document.querySelectorAll('.modal-overlay.open');
  if (abertos.length) abertos[abertos.length - 1].classList.remove('open');
});


/* ─── Chuva de corações ─── */
function createHeartShower() {
  const emojis = ['❤️', '💖', '💕', '✨', '😍'];
  for (let i = 0; i < 40; i++) {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = sortear(emojis);
    heart.style.left              = Math.random() * 100 + 'vw';
    heart.style.animationDuration = (Math.random() * 3 + 3) + 's';
    heart.style.animationDelay    = Math.random() * 1.5 + 's';
    heart.style.fontSize          = (Math.random() * 1.5 + 1) + 'rem';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 7000);
  }
}


/* ─── Datas ───
   CORRIGIDO: antes usava toISOString() (UTC), o que abria as cápsulas
   3h antes no Brasil. Agora usa o fuso do aparelho.                  */
function hojeLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function dataBr(isoDate) {
  return isoDate.split('-').reverse().join('/');
}


/* ─── Segurança de links ───
   Só aceita http/https. Bloqueia "javascript:" e similares (XSS).    */
function safeUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : null;
  } catch {
    return null;
  }
}


/* ─── Texto de resposta dos enigmas ───
   Ignora maiúsculas, acentos e espaços extras: "São Paulo " = "sao paulo" */
function normalizarResposta(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Gera o "hash" SHA-256 de um texto (a resposta não fica legível no banco)
async function sha256(texto) {
  const bytes = new TextEncoder().encode(texto);
  const hash  = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}


/* ─── [☁️ CLOUDINARY] ─── */

// Envia uma imagem (dataURL) e devolve a URL pública
async function uploadToCloudinary(dataUrl) {
  const formData = new FormData();
  formData.append('file', dataUrl);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
  const data = await res.json();

  if (data.secure_url) return data.secure_url;
  throw new Error(data.error?.message || 'Falha no upload');
}

// Versão borrada e pequena de uma foto do Cloudinary (usada nas cápsulas).
// Assim a foto real não aparece no código da página antes da hora.
function cloudinaryBlurUrl(url) {
  if (!url || !url.includes('/image/upload/')) return null;
  return url.replace('/image/upload/', '/image/upload/e_blur:2000,q_20,w_300/');
}


/* ─── Imagens ───
   Lê um arquivo e devolve um JPEG redimensionado (dataURL).
   CORRIGIDO: antes fotos em pé ficavam com no máx. 1080px de altura. */
function redimensionarImagem(file, maxLargura, maxAltura, qualidade) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const escala = Math.min(1, maxLargura / img.width, maxAltura / img.height);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Deixa um botão em "carregando" enquanto uma tarefa roda
async function comBotaoOcupado(botao, textoOcupado, tarefa) {
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = textoOcupado;
  try {
    return await tarefa();
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}
