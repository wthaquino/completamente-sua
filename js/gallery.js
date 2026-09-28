/* ==================================================================
   [📷 FOTOS] GALERIA DE LEMBRANÇAS   ·   [🔥 FIREBASE photos]
   ------------------------------------------------------------------
   Fluxo:  loadPhotos()  →  processPhotos()  →  renderGallery()
           (Firestore)      (filtro/ordem)      (desenha a página)
   ================================================================== */

let photos         = [];   // tudo que veio do Firestore
let filteredPhotos = [];   // depois do filtro + ordenação
let currentPage    = 1;
let currentSortOrder  = 'desc';  // 'desc' | 'asc'
let currentFilterType = 'all';   // 'all' | 'unlocked' | 'locked'

const gallery            = $('gallery');
const paginationControls = $('pagination-controls');


/* ─── Regras da cápsula do tempo ─── */
function isPhotoLocked(photo) {
  return Boolean(photo.unlockDate) && photo.unlockDate > hojeLocal();
}


/* ─── 1. Carregar do Firestore ─── */
async function loadPhotos() {
  try {
    const snapshot = await photosCollection.orderBy('timestamp', 'desc').get();
    photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    processPhotos();
    renderGallery();
  } catch (error) {
    console.error('Erro ao carregar fotos:', error);
    showToast('Erro ao carregar fotos.');
  }
}


/* ─── 2. Filtrar e ordenar ─── */
function processPhotos() {
  filteredPhotos = photos.filter(photo => {
    const locked = isPhotoLocked(photo);
    if (currentFilterType === 'unlocked') return !locked;
    if (currentFilterType === 'locked')   return locked;
    return true;
  });

  filteredPhotos.sort((a, b) => {
    const timeA = a.timestamp ? a.timestamp.toMillis() : Date.now();
    const timeB = b.timestamp ? b.timestamp.toMillis() : Date.now();
    return currentSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });
}


/* ─── 3. Desenhar ─── */
function renderGallery() {
  gallery.innerHTML = '';
  paginationControls.innerHTML = '';

  if (filteredPhotos.length === 0) {
    const vazio = document.createElement('div');
    vazio.className = 'gallery-empty';
    vazio.textContent = 'Nenhuma memória encontrada.';
    gallery.appendChild(vazio);
    return;
  }

  const totalPages = Math.ceil(filteredPhotos.length / FOTOS_POR_PAGINA);
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const inicio = (currentPage - 1) * FOTOS_POR_PAGINA;
  filteredPhotos
    .slice(inicio, inicio + FOTOS_POR_PAGINA)
    .forEach((photo, i) => gallery.appendChild(criarCardFoto(photo, inicio + i, i)));

  renderPagination(totalPages);
}

/* Cria UM card. CORRIGIDO: textos entram com textContent (antes era
   innerHTML, que permitia injetar código pela legenda) e o link de
   música passa por safeUrl().                                        */
function criarCardFoto(photo, indexNaLista, ordemAnimacao) {
  const locked = isPhotoLocked(photo);

  const card = document.createElement('div');
  card.className = 'photo' + (locked ? ' locked' : '');
  card.style.animationDelay = `${ordemAnimacao * 0.15}s`;

  // Botões do modo edição (ações tratadas em admin.js)
  card.append(
    criarBotaoAdmin('delete', '×',  'Apagar lembrança', photo.id),
    criarBotaoAdmin('edit',   '✏️', 'Editar lembrança', photo.id)
  );

  // Imagem — CORRIGIDO: a cápsula usa uma versão borrada vinda do
  // Cloudinary; a URL da foto real não vai para a página.
  const src = locked ? cloudinaryBlurUrl(photo.url) : photo.url;
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = locked ? 'Lembrança trancada' : 'Lembrança';
    img.loading = 'lazy';
    img.dataset.action = 'open';
    img.dataset.index  = indexNaLista;
    card.appendChild(img);
  } else {
    card.classList.add('no-preview');
  }

  if (locked) {
    const cadeado = document.createElement('div');
    cadeado.className = 'lock-icon';
    cadeado.textContent = '🔒';
    card.appendChild(cadeado);
  }

  // Legenda
  const caption = document.createElement('div');
  caption.className = 'caption';

  const content = document.createElement('div');
  content.className = 'caption-content';

  const texto = document.createElement('span');
  texto.textContent = locked
    ? `Mistério... Disponível em ${dataBr(photo.unlockDate)} ⏳`
    : photo.caption;
  content.appendChild(texto);

  // [🎵 MÚSICA] link do Spotify da foto
  const musica = safeUrl(photo.musicLink);
  if (!locked && musica) {
    const link = document.createElement('a');
    link.href = musica;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'music-link-icon';
    link.textContent = '🎵';
    link.setAttribute('aria-label', 'Ouvir a música desta lembrança');
    content.appendChild(link);
  }
  caption.appendChild(content);

  // Curtidas
  const like = document.createElement('div');
  like.className = 'like-container';
  like.innerHTML = `<button class="like-btn" data-action="like" aria-label="Curtir">❤️</button><span class="like-count"></span>`;
  like.querySelector('.like-btn').dataset.id = photo.id;
  like.querySelector('.like-count').textContent = photo.likes || 0;
  caption.appendChild(like);

  card.appendChild(caption);
  return card;
}

function criarBotaoAdmin(tipo, simbolo, rotulo, photoId) {
  const btn = document.createElement('button');
  btn.className = `card-admin-btn ${tipo}`;
  btn.textContent = simbolo;
  btn.setAttribute('aria-label', rotulo);
  btn.dataset.action = tipo;
  btn.dataset.id = photoId;
  return btn;
}


/* ─── Paginação ─── */
function goToPage(page) {
  currentPage = page;
  renderGallery();
  $('gallery-controls').scrollIntoView({ behavior: 'smooth' });
}

function renderPagination(totalPages) {
  if (totalPages <= 1) return;

  const criar = (html, classe, desativado, aoClicar) => {
    const b = document.createElement('button');
    b.innerHTML = html;
    b.className = classe;
    b.disabled = desativado;
    b.onclick = aoClicar;
    paginationControls.appendChild(b);
    return b;
  };

  criar('&#10094;', 'nav-btn', currentPage === 1, () => goToPage(currentPage - 1));
  for (let i = 1; i <= totalPages; i++) {
    criar(String(i), 'page-btn' + (i === currentPage ? ' active' : ''), false, () => goToPage(i));
  }
  criar('&#10095;', 'nav-btn', currentPage === totalPages, () => goToPage(currentPage + 1));
}


/* ─── Botões de filtro / ordenação ─── */
document.querySelectorAll('.control-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const { sort, filter } = btn.dataset;

    if (sort) {
      currentSortOrder = sort;
      document.querySelectorAll('[data-sort]').forEach(b => b.classList.toggle('active', b === btn));
    }
    if (filter) {
      currentFilterType = filter;
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b === btn));
    }

    currentPage = 1;
    processPhotos();
    renderGallery();
  });
});


/* ─── Cliques dentro da galeria (um listener só) ─── */
gallery.addEventListener('click', (e) => {
  const alvo = e.target.closest('[data-action]');
  if (!alvo) return;

  switch (alvo.dataset.action) {
    case 'open':   abrirLightbox(Number(alvo.dataset.index)); break;
    case 'like':   curtirFoto(alvo);                          break;
    case 'delete': excluirFoto(alvo.dataset.id);              break;  // admin.js
    case 'edit':   abrirEdicaoFoto(alvo.dataset.id);          break;  // admin.js
  }
});


/* ─── Curtir ───
   Atualiza a tela na hora e grava no Firestore (desfaz se falhar).
   As regras do Firestore só deixam visitantes somarem +1 em "likes". */
async function curtirFoto(btn) {
  const photoId  = btn.dataset.id;
  const contador = btn.nextElementSibling;
  const atual    = parseInt(contador.textContent, 10) || 0;

  btn.classList.add('pop');
  setTimeout(() => btn.classList.remove('pop'), 300);
  contador.textContent = atual + 1;

  try {
    await photosCollection.doc(photoId).update({ likes: firebase.firestore.FieldValue.increment(1) });
    const photo = photos.find(p => p.id === photoId);
    if (photo) photo.likes = atual + 1;
  } catch (error) {
    contador.textContent = atual;
    showToast('Erro ao curtir :(');
  }
}


/* ==================================================================
   LIGHTBOX (FOTO EM TELA CHEIA)   [📷 FOTOS] [🎵 MÚSICA]
   CORRIGIDO: as setas agora pulam as fotos trancadas.
   Extra: setas do teclado e arrastar para o lado no celular.
   ================================================================== */
let lightboxIndex = 0;

function indiceLiberado(inicio, direcao) {
  for (let i = inicio; i >= 0 && i < filteredPhotos.length; i += direcao) {
    if (!isPhotoLocked(filteredPhotos[i])) return i;
  }
  return -1;
}

function abrirLightbox(index) {
  const photo = filteredPhotos[index];
  if (!photo) return;

  if (isPhotoLocked(photo)) {
    showToast('Essa lembrança ainda está trancada! ⏳');
    return;
  }

  lightboxIndex = index;
  $('lightbox-img').src = photo.url;

  const legenda = $('lightbox-caption');
  legenda.innerHTML = '';
  const texto = document.createElement('div');
  texto.textContent = photo.caption;
  legenda.appendChild(texto);

  const musica = safeUrl(photo.musicLink);   // [🎵 MÚSICA]
  if (musica) {
    const link = document.createElement('a');
    link.href = musica;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'lightbox-music-link';
    link.textContent = 'Ouvir música 🎵';
    legenda.appendChild(link);
  }

  $('lightbox-prev').disabled = indiceLiberado(index - 1, -1) === -1;
  $('lightbox-next').disabled = indiceLiberado(index + 1, +1) === -1;

  openModal('lightbox');
}

function navegarLightbox(direcao) {
  const destino = indiceLiberado(lightboxIndex + direcao, direcao);
  if (destino !== -1) abrirLightbox(destino);
}

$('lightbox-prev').addEventListener('click', (e) => { e.stopPropagation(); navegarLightbox(-1); });
$('lightbox-next').addEventListener('click', (e) => { e.stopPropagation(); navegarLightbox(+1); });

document.addEventListener('keydown', (e) => {
  if (!$('lightbox').classList.contains('open')) return;
  if (e.key === 'ArrowLeft')  navegarLightbox(-1);
  if (e.key === 'ArrowRight') navegarLightbox(+1);
});

// Arrastar para o lado (celular)
let toqueInicioX = null;
$('lightbox').addEventListener('touchstart', (e) => { toqueInicioX = e.touches[0].clientX; }, { passive: true });
$('lightbox').addEventListener('touchend', (e) => {
  if (toqueInicioX === null) return;
  const distancia = e.changedTouches[0].clientX - toqueInicioX;
  toqueInicioX = null;
  if (Math.abs(distancia) > 50) navegarLightbox(distancia < 0 ? +1 : -1);
});
