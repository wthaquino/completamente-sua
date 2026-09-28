/* ==================================================================
   UTILITÁRIOS
   ================================================================== */

const $ = (id) => document.getElementById(id);
const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];

// Cria um elemento: el('a', { href, textContent, dataset: {...} }, filho1, filho2)
function el(tag, props = {}, ...filhos) {
  const { dataset, ...resto } = props;
  const e = Object.assign(document.createElement(tag), resto);
  if (dataset) Object.assign(e.dataset, dataset);
  e.append(...filhos);
  return e;
}

// Deixa o botão "carregando", roda a tarefa e mostra `erro` se falhar.
// Devolve true se deu certo.
async function executar(botao, textoOcupado, erro, tarefa) {
  const original = botao.textContent;
  botao.disabled = true;
  botao.textContent = textoOcupado;
  try {
    await tarefa();
    return true;
  } catch (e) {
    console.error(e);
    showToast(erro);
    return false;
  } finally {
    botao.disabled = false;
    botao.textContent = original;
  }
}


/* ─── Toast ─── */
let toastTimer;
function showToast(msg) {
  $('toast').textContent = msg;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3500);
}


/* ─── Modais: data-close="id" fecha; clique no fundo e Esc também ─── */
const openModal  = (id) => $(id).classList.add('open');
const closeModal = (id) => $(id).classList.remove('open');

document.addEventListener('click', (e) => {
  const fechar = e.target.closest('[data-close]');
  if (fechar) closeModal(fechar.dataset.close);
  else if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') [...document.querySelectorAll('.modal-overlay.open')].pop()?.classList.remove('open');
});


/* ─── Chuva de corações ─── */
function createHeartShower() {
  for (let i = 0; i < 40; i++) {
    const h = el('div', { className: 'floating-heart', textContent: sortear(['❤️', '💖', '💕', '✨', '😍']) });
    Object.assign(h.style, {
      left:              Math.random() * 100 + 'vw',
      animationDuration: Math.random() * 3 + 3 + 's',
      animationDelay:    Math.random() * 1.5 + 's',
      fontSize:          Math.random() * 1.5 + 1 + 'rem'
    });
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 7000);
  }
}


/* ─── Datas (fuso do aparelho, não UTC) ─── */
function hojeLocal() {
  const d = new Date();
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map(n => String(n).padStart(2, '0')).join('-');
}
const dataBr = (iso) => iso.split('-').reverse().join('/');


/* ─── Links: só http/https (bloqueia "javascript:") ─── */
function safeUrl(url) {
  try {
    const u = new URL(url.trim());
    return ['http:', 'https:'].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}


/* ─── Enigmas: ignora maiúsculas, acentos e espaços; salva só o hash ─── */
const normalizarResposta = (t) =>
  (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

async function sha256(texto) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}


/* ─── [☁️ CLOUDINARY] ─── */
async function uploadToCloudinary(dataUrl) {
  const form = new FormData();
  form.append('file', dataUrl);
  form.append('upload_preset', UPLOAD_PRESET);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Falha no upload');
  return data.secure_url;
}

// Versão pequena e borrada (cápsulas): a foto real não vai para a página
const cloudinaryBlurUrl = (url) =>
  url?.includes('/image/upload/') ? url.replace('/image/upload/', '/image/upload/e_blur:2000,q_20,w_300/') : null;

// Lê um arquivo de imagem e devolve um JPEG redimensionado (dataURL)
function redimensionarImagem(file, maxPx, qualidade) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const escala = Math.min(1, maxPx / img.width, maxPx / img.height);
      const canvas = el('canvas', { width: Math.round(img.width * escala), height: Math.round(img.height * escala) });
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', qualidade));
    };
    img.src = URL.createObjectURL(file);
  });
}
