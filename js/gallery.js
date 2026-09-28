/* ==================================================================
   [📷 FOTOS] GALERIA   ·   [🔥 FIREBASE photos]
   loadPhotos() → processPhotos() → renderGallery()
   ================================================================== */

let photos = [];           // do Firestore, mais recentes primeiro
let filteredPhotos = [];   // após filtro + ordem
let currentPage = 1;
let ordem  = 'desc';       // 'desc' | 'asc'
let filtro = 'all';        // 'all' | 'unlocked' | 'locked'

const gallery = $('gallery');
const isPhotoLocked = (p) => Boolean(p.unlockDate) && p.unlockDate > hojeLocal();


async function loadPhotos() {
  try {
    const snap = await photosCollection.orderBy('timestamp', 'desc').get();
    photos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    processPhotos();
    renderGallery();
  } catch (e) {
    console.error(e);
    showToast('Erro ao carregar fotos.');
  }
}

function processPhotos() {
  filteredPhotos = photos.filter(p =>
    filtro === 'all' || (filtro === 'locked') === isPhotoLocked(p)
  );
  if (ordem === 'asc') filteredPhotos.reverse();
}

function renderGallery() {
  const paginas = Math.ceil(filteredPhotos.length / FOTOS_POR_PAGINA);
  currentPage = Math.min(Math.max(currentPage, 1), paginas || 1);
  const inicio = (currentPage - 1) * FOTOS_POR_PAGINA;

  gallery.replaceChildren(
    ...(filteredPhotos.length
      ? filteredPhotos.slice(inicio, inicio + FOTOS_POR_PAGINA).map((p, i) => criarCard(p, inicio + i, i))
      : [el('div', { className: 'gallery-empty', textContent: 'Nenhuma memória encontrada.' })])
  );
  renderPagination(paginas);
}

function criarCard(photo, index, ordemAnimacao) {
  const locked = isPhotoLocked(photo);
  const card = el('div', { className: 'photo' + (locked ? ' locked' : '') });
  card.style.animationDelay = `${ordemAnimacao * 0.15}s`;

  // Botões do modo edição (ações em admin.js)
  card.append(
    el('button', { className: 'card-admin-btn delete', textContent: '×',  ariaLabel: 'Apagar', dataset: { action: 'delete', id: photo.id } }),
    el('button', { className: 'card-admin-btn edit',   textContent: '✏️', ariaLabel: 'Editar', dataset: { action: 'edit',   id: photo.id } })
  );

  const src = locked ? cloudinaryBlurUrl(photo.url) : photo.url;
  if (src) card.append(el('img', { src, alt: 'Lembrança', loading: 'lazy', dataset: { action: 'open', index } }));
  else     card.classList.add('no-preview');

  if (locked) card.append(el('div', { className: 'lock-icon', textContent: '🔒' }));

  const legenda = el('div', { className: 'caption-content' },
    el('span', { textContent: locked ? `Mistério... Disponível em ${dataBr(photo.unlockDate)} ⏳` : photo.caption })
  );
  const musica = safeUrl(photo.musicLink);                     // [🎵 MÚSICA]
  if (!locked && musica) {
    legenda.append(el('a', { href: musica, target: '_blank', rel: 'noopener', className: 'music-link-icon', textContent: '🎵', ariaLabel: 'Ouvir música' }));
  }

  card.append(el('div', { className: 'caption' },
    legenda,
    el('div', { className: 'like-container' },
      el('button', { className: 'like-btn', textContent: '❤️', ariaLabel: 'Curtir', dataset: { action: 'like', id: photo.id } }),
      el('span',   { className: 'like-count', textContent: photo.likes || 0 })
    )
  ));
  return card;
}

function renderPagination(paginas) {
  const ir = (p) => { currentPage = p; renderGallery(); $('gallery-controls').scrollIntoView({ behavior: 'smooth' }); };
  const botao = (html, className, disabled, onclick) => Object.assign(el('button', { className, disabled, onclick }), { innerHTML: html });

  $('pagination-controls').replaceChildren(...(paginas <= 1 ? [] : [
    botao('&#10094;', 'nav-btn', currentPage === 1, () => ir(currentPage - 1)),
    ...Array.from({ length: paginas }, (_, i) =>
      botao(i + 1, 'page-btn' + (i + 1 === currentPage ? ' active' : ''), false, () => ir(i + 1))),
    botao('&#10095;', 'nav-btn', currentPage === paginas, () => ir(currentPage + 1))
  ]));
}


/* ─── Filtros / ordenação ─── */
document.querySelectorAll('.control-btn').forEach(btn => btn.addEventListener('click', () => {
  const grupo = btn.dataset.sort ? 'sort' : 'filter';
  document.querySelectorAll(`[data-${grupo}]`).forEach(b => b.classList.toggle('active', b === btn));
  if (btn.dataset.sort) ordem  = btn.dataset.sort;
  else                  filtro = btn.dataset.filter;
  currentPage = 1;
  processPhotos();
  renderGallery();
}));


/* ─── Cliques nos cards ─── */
gallery.addEventListener('click', (e) => {
  const alvo = e.target.closest('[data-action]');
  if (!alvo) return;
  const { action, id, index } = alvo.dataset;
  if (action === 'open')   abrirLightbox(Number(index));
  if (action === 'like')   curtirFoto(alvo);
  if (action === 'delete') excluirFoto(id);        // admin.js
  if (action === 'edit')   abrirEdicaoFoto(id);    // admin.js
});

async function curtirFoto(btn) {
  const contador = btn.nextElementSibling;
  const atual = Number(contador.textContent) || 0;

  btn.classList.add('pop');
  setTimeout(() => btn.classList.remove('pop'), 300);
  contador.textContent = atual + 1;

  try {
    await photosCollection.doc(btn.dataset.id).update({ likes: FieldValue.increment(1) });
    const foto = photos.find(p => p.id === btn.dataset.id);
    if (foto) foto.likes = atual + 1;
  } catch {
    contador.textContent = atual;
    showToast('Erro ao curtir :(');
  }
}


/* ==================================================================
   LIGHTBOX — pula fotos trancadas; setas do teclado e swipe no celular
   ================================================================== */
let lightboxIndex = 0;

function indiceLiberado(de, passo) {
  for (let i = de; i >= 0 && i < filteredPhotos.length; i += passo) {
    if (!isPhotoLocked(filteredPhotos[i])) return i;
  }
  return -1;
}

function abrirLightbox(index) {
  const photo = filteredPhotos[index];
  if (!photo) return;
  if (isPhotoLocked(photo)) return showToast('Essa lembrança ainda está trancada! ⏳');

  lightboxIndex = index;
  $('lightbox-img').src = photo.url;

  const musica = safeUrl(photo.musicLink);                     // [🎵 MÚSICA]
  $('lightbox-caption').replaceChildren(
    el('div', { textContent: photo.caption }),
    ...(musica ? [el('a', { href: musica, target: '_blank', rel: 'noopener', className: 'lightbox-music-link', textContent: 'Ouvir música 🎵' })] : [])
  );

  $('lightbox-prev').disabled = indiceLiberado(index - 1, -1) === -1;
  $('lightbox-next').disabled = indiceLiberado(index + 1, +1) === -1;
  openModal('lightbox');
}

function navegarLightbox(passo) {
  const destino = indiceLiberado(lightboxIndex + passo, passo);
  if (destino !== -1) abrirLightbox(destino);
}

$('lightbox-prev').onclick = () => navegarLightbox(-1);
$('lightbox-next').onclick = () => navegarLightbox(+1);

document.addEventListener('keydown', (e) => {
  if (!$('lightbox').classList.contains('open')) return;
  if (e.key === 'ArrowLeft')  navegarLightbox(-1);
  if (e.key === 'ArrowRight') navegarLightbox(+1);
});

let toqueX = null;
$('lightbox').addEventListener('touchstart', (e) => { toqueX = e.touches[0].clientX; }, { passive: true });
$('lightbox').addEventListener('touchend', (e) => {
  const d = e.changedTouches[0].clientX - (toqueX ?? e.changedTouches[0].clientX);
  toqueX = null;
  if (Math.abs(d) > 50) navegarLightbox(d < 0 ? +1 : -1);
});
