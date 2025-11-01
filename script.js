const gallery = document.getElementById('gallery');
const editor = document.getElementById('editor');
const editBtn = document.getElementById('editBtn');
const addPhotoBtn = document.getElementById('addPhoto');
const introScreen = document.getElementById('intro-screen');
const enterBtn = document.getElementById('enterBtn');
const mainContent = document.getElementById('main-content');
const spotifyPlayer = document.getElementById('spotify-player');

const splashScreen = document.getElementById('splash-screen');

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeLightboxBtn = document.querySelector('.close-lightbox');

const musicLinkInput = document.getElementById('musicLinkInput');

const bgImageInput = document.getElementById('bgImageInput');
const changeBgBtn = document.getElementById('changeBgBtn');
const removeBgBtn = document.getElementById('removeBgBtn');

const paginationControls = document.getElementById('pagination-controls');

const lightboxPrevBtn = document.getElementById('lightbox-prev');
const lightboxNextBtn = document.getElementById('lightbox-next');

let photos = [];
let currentPage = 1;
const photosPerPage = 4;
let currentLightboxIndex = 0; 

// NOVAS CHAVES DO CLOUDINARY
const CLOUD_NAME = "dnzugrzdn";
const UPLOAD_PRESET = "inteiramente-sua";

const bgGradient = "linear-gradient(to bottom right, rgba(142, 30, 92, 0.8), rgba(216, 108, 163, 0.8))";
const bgGradientSolid = "linear-gradient(to bottom right, #8e1e5c, #d86ca3)";

function applyBackground(imageUrl) {
  const bgValue = imageUrl ? `${bgGradient}, url(${imageUrl})` : bgGradientSolid;

  document.body.style.background = bgValue;
  splashScreen.style.background = bgValue;
  introScreen.style.background = bgValue;
  
  const styles = {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };
  
  Object.assign(document.body.style, styles);
  Object.assign(splashScreen.style, styles);
  Object.assign(introScreen.style, styles);
}

async function loadSettings() {
  try {
    const doc = await settingsDoc.get();
    if (doc.exists && doc.data().backgroundImageUrl) {
      applyBackground(doc.data().backgroundImageUrl);
    } else {
      removeBackground(); 
    }
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    removeBackground();
  }
}

async function removeBackground() {
  applyBackground(null);
  
  try {
    await settingsDoc.set({ backgroundImageUrl: null }, { merge: true });
    alert("Fundo removido com sucesso!");
  } catch (error) {
    console.error("Erro ao remover fundo:", error);
    alert("Erro ao remover fundo do Firebase.");
  }
}

async function loadPhotos() {
  try {
    const snapshot = await photosCollection.orderBy('timestamp', 'desc').get();
    
    photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    renderGalleryAndPagination(); 
  } catch (error) {
    console.error("Erro ao carregar fotos:", error);
    alert("Erro ao carregar fotos da nuvem.");
  }
}

async function deletePhoto(photoId) {
  try {
    await photosCollection.doc(photoId).delete();
    
    // Tenta remover o arquivo da imagem do Cloudinary (opcional, mas bom)
    // O Cloudinary é mais complexo para deletar via frontend, então
    // vamos focar em remover a entrada do banco de dados (que esconde a foto).
    
    await loadPhotos(); 
  } catch (error) {
    console.error("Erro ao deletar foto:", error);
    alert("Erro ao deletar foto da nuvem.");
  }
}

function renderGalleryAndPagination() {
  gallery.innerHTML = '';
  paginationControls.innerHTML = '';

  const totalPages = Math.ceil(photos.length / photosPerPage);

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  if (currentPage < 1) {
    currentPage = 1;
  }

  const startIndex = (currentPage - 1) * photosPerPage;
  const endIndex = startIndex + photosPerPage;
  const photosToShow = photos.slice(startIndex, endIndex);

  photosToShow.forEach(photo => {
    const originalIndex = photos.findIndex(p => p.id === photo.id);
    const div = document.createElement('div');
    div.className = 'photo';
    
    const musicIconHTML = photo.musicLink 
      ? `<a href="${photo.musicLink}" target="_blank" class="music-link-icon">🎵</a>` 
      : '';

    div.innerHTML = `
      <button class="delete-btn" data-id="${photo.id}">×</button>
      <img src="${photo.url}" alt="${photo.caption}" data-id="${photo.id}" data-index-in-page="${originalIndex}">
      <div class="caption">${photo.caption} ${musicIconHTML}</div>`;
    
    gallery.appendChild(div);
  });

  setupPagination(totalPages);
  setupLightboxListeners();
}

function showLightboxPhoto(index) {
  currentLightboxIndex = index;
  const photo = photos[index];

  if (!photo) return;

  lightboxImg.src = photo.url;
  lightboxCaption.innerHTML = `<div>${photo.caption}</div>`; 

  if (photo.musicLink) {
    lightboxCaption.innerHTML += `<a href="${photo.musicLink}" target="_blank" class="lightbox-music-link">Ouvir música 🎵</a>`;
  }
  
  lightboxPrevBtn.disabled = (index === 0);
  lightboxNextBtn.disabled = (index === photos.length - 1);
}

function setupLightboxListeners() {
  document.querySelectorAll('.photo img').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation(); 
      
      const photoId = e.target.getAttribute('data-id');
      const originalIndex = photos.findIndex(p => p.id === photoId);
      
      showLightboxPhoto(originalIndex);
      
      lightbox.classList.add('visible');
    });
  });

  document.querySelectorAll('.music-link-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
}

function setupPagination(totalPages) {
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '←';
  prevBtn.className = 'nav-btn';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderGalleryAndPagination();
    }
  });
  paginationControls.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.className = 'page-btn';
    if (i === currentPage) {
      pageBtn.classList.add('active');
    }
    pageBtn.addEventListener('click', () => {
      currentPage = i;
      renderGalleryAndPagination();
    }
    );
    paginationControls.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '→';
  nextBtn.className = 'nav-btn';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderGalleryAndPagination();
    }
  });
  paginationControls.appendChild(nextBtn);
}

function changePage(newPage) {
  currentPage = newPage;
  renderGalleryAndPagination();
}

enterBtn.addEventListener('click', () => {
  introScreen.classList.add('fade-out');
  
  setTimeout(() => {
    introScreen.style.display = 'none';
    splashScreen.classList.remove('hidden');
    
    const spotifySrc = spotifyPlayer.getAttribute('data-src');
    spotifyPlayer.setAttribute('src', spotifySrc);

    setTimeout(() => {
      splashScreen.classList.add('fade-out');

      setTimeout(() => {
        splashScreen.style.display = 'none';
        mainContent.classList.remove('hidden');
        loadPhotos(); 
      }, 1000);
    }, 3000);
  }, 1000);
});

editBtn.addEventListener('click', () => {
  const senha = prompt("Digite a senha para editar:");
  if (senha === "meuamorzinho") {
    editor.classList.toggle('hidden');
    mainContent.classList.toggle('edit-mode-active');
  } else {
    alert("Senha incorreta 💔");
  }
});

addPhotoBtn.addEventListener('click', () => {
  const fileInput = document.getElementById('imageInput');
  const captionInput = document.getElementById('captionInput');
  const file = fileInput.files[0];
  const caption = captionInput.value;
  const musicLink = musicLinkInput.value;

  if (!file) {
    alert("Selecione uma imagem 💞");
    return;
  }
  if (!caption) {
    alert("Adicione uma legenda! 💞");
    return;
  }

  addPhotoBtn.disabled = true;
  addPhotoBtn.textContent = 'Enviando...';

  const reader = new FileReader();
  reader.onload = e => {
    resizeAndUpload(e.target.result, file.type, caption, musicLink, addPhotoBtn);
  };
  reader.readAsDataURL(file);
});

async function uploadToCloudinary(base64Image) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  
  const formData = new FormData();
  formData.append('file', base64Image);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (data.secure_url) {
    return data.secure_url;
  } else {
    throw new Error('Cloudinary upload failed: ' + (data.error ? data.error.message : 'Unknown error'));
  }
}

function resizeAndUpload(dataURL, mimeType, caption, musicLink, button) {
  const MAX_WIDTH = 1920;
  const MAX_HEIGHT = 1080;
  
  const img = new Image();
  img.src = dataURL;
  
  img.onload = async () => {
    try {
        // 1. Redimensionamento local
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = width * (MAX_HEIGHT / height);
            height = MAX_HEIGHT;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        
        // 2. Faz o Upload para o Cloudinary
        const downloadURL = await uploadToCloudinary(resizedBase64);

        // 3. Salva a referência no Firestore
        await photosCollection.add({
            url: downloadURL,
            caption: caption,
            musicLink: musicLink,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert("Foto adicionada com sucesso! (Visível para todos)");
        
        document.getElementById('imageInput').value = '';
        document.getElementById('captionInput').value = '';
        musicLinkInput.value = '';
        
        currentPage = 1;
        await loadPhotos();
    } catch (error) {
        console.error("Erro ao subir a foto:", error);
        alert("Erro ao enviar a foto para a nuvem. Verifique o console para detalhes.");
    } finally {
        button.disabled = false;
        button.textContent = 'Adicionar';
    }
  };
}

gallery.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    if (!confirm("Tem certeza que quer apagar esta foto? Esta ação não pode ser desfeita.")) {
      return;
    }
    const photoId = e.target.getAttribute('data-id');
    deletePhoto(photoId);
  }
});

lightboxPrevBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (currentLightboxIndex > 0) {
    showLightboxPhoto(currentLightboxIndex - 1);
  }
});

lightboxNextBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (currentLightboxIndex < photos.length - 1) {
    showLightboxPhoto(currentLightboxIndex + 1);
  }
});

closeLightboxBtn.addEventListener('click', () => {
  lightbox.classList.remove('visible');
});

lightbox.addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') {
    lightbox.classList.remove('visible');
  }
});

changeBgBtn.addEventListener('click', async () => {
  const file = bgImageInput.files[0];
  if (!file) {
    alert("Selecione uma imagem de fundo.");
    return;
  }

  changeBgBtn.disabled = true;
  changeBgBtn.textContent = 'Enviando...';

  const reader = new FileReader();
  reader.onload = async e => {
    try {
        const MAX_BG_WIDTH = 1920;
        const resizedUrl = await new Promise(resolve => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > MAX_BG_WIDTH) {
                    height = height * (MAX_BG_WIDTH / width);
                    width = MAX_BG_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                
                // Upload do fundo para Cloudinary
                const base64Image = canvas.toDataURL('image/jpeg', 0.6);
                const downloadURL = await uploadToCloudinary(base64Image);
                resolve(downloadURL);
            };
            img.src = e.target.result;
        });

        // Salva a URL no Firestore (settings)
        await settingsDoc.set({ backgroundImageUrl: resizedUrl }, { merge: true });
        
        applyBackground(resizedUrl);
        alert("Fundo alterado com sucesso! Visível para todos.");
        bgImageInput.value = '';
    } catch (error) {
        console.error("Erro ao alterar fundo:", error);
        alert("Erro ao alterar fundo.");
    } finally {
        changeBgBtn.disabled = false;
        changeBgBtn.textContent = 'Salvar Fundo';
    }
  };
  reader.readAsDataURL(file);
});


removeBgBtn.addEventListener('click', () => {
  if (confirm("Tem certeza que quer remover o fundo personalizado?")) {
    removeBackground();
  }
});

document.addEventListener('DOMContentLoaded', () => {
   loadSettings(); 
});