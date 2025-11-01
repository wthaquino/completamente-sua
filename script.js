const gallery = document.getElementById('gallery');
const editor = document.getElementById('editor');
const editBtn = document.getElementById('editBtn');
const addPhotoBtn = document.getElementById('addPhoto');
const introScreen = document.getElementById('intro-screen');
const enterBtn = document.getElementById('enterBtn');
const mainContent = document.getElementById('main-content');
const spotifyPlayer = document.getElementById('spotify-player');

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

let photos = JSON.parse(localStorage.getItem('photos')) || [];
let currentPage = 1;
const photosPerPage = 4;
let currentLightboxIndex = 0; 

const bgGradient = "linear-gradient(to bottom right, rgba(142, 30, 92, 0.8), rgba(216, 108, 163, 0.8))";
const bgGradientSolid = "linear-gradient(to bottom right, #8e1e5c, #d86ca3)";

function applyBackground(imageUrl) {
  const bgValue = `${bgGradient}, url(${imageUrl})`;
  document.body.style.background = bgValue;
  introScreen.style.background = bgValue;
  
  const styles = {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };
  
  Object.assign(document.body.style, styles);
  Object.assign(introScreen.style, styles);
}

function removeBackground() {
  const bgValue = bgGradientSolid;
  document.body.style.background = bgValue;
  introScreen.style.background = bgValue;
  
  const styles = {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };
  
  Object.assign(document.body.style, styles);
  Object.assign(introScreen.style, styles);

  localStorage.removeItem('backgroundImage');
}

function renderGalleryAndPagination() {
  gallery.innerHTML = '';
  paginationControls.innerHTML = '';

  const reversedPhotos = photos.slice().reverse();
  const totalPages = Math.ceil(reversedPhotos.length / photosPerPage);

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  if (currentPage < 1) {
    currentPage = 1;
  }

  const startIndex = (currentPage - 1) * photosPerPage;
  const endIndex = startIndex + photosPerPage;
  const photosToShow = reversedPhotos.slice(startIndex, endIndex);

  photosToShow.forEach(photo => {
    const originalIndex = photos.indexOf(photo);
    const div = document.createElement('div');
    div.className = 'photo';
    
    const musicIconHTML = photo.musicLink 
      ? `<a href="${photo.musicLink}" target="_blank" class="music-link-icon">🎵</a>` 
      : '';

    div.innerHTML = `
      <button class="delete-btn" data-index="${originalIndex}">×</button>
      <img src="${photo.src}" alt="${photo.caption}" data-original-index="${originalIndex}">
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

  lightboxImg.src = photo.src;
  lightboxCaption.innerHTML = `<div>${photo.caption}</div>`; 

  if (photo.musicLink) {
    lightboxCaption.innerHTML += `<a href="${photo.musicLink}" target="_blank" class="lightbox-music-link">Ouvir música 🎵</a>`;
  }
  
  const reversedPhotos = photos.slice().reverse();
  const reversedIndex = reversedPhotos.findIndex(p => photos.indexOf(p) === index);

  lightboxPrevBtn.disabled = (reversedIndex === 0);
  lightboxNextBtn.disabled = (reversedIndex === reversedPhotos.length - 1);
}

function setupLightboxListeners() {
  document.querySelectorAll('.photo img').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation(); 
      
      const originalIndex = parseInt(e.target.getAttribute('data-original-index'));
      
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
    });
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
  
  const spotifySrc = spotifyPlayer.getAttribute('data-src');
  spotifyPlayer.setAttribute('src', spotifySrc);

  setTimeout(() => {
    introScreen.style.display = 'none';
    mainContent.classList.remove('hidden');
    renderGalleryAndPagination();
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

  const MAX_WIDTH = 1920;
  const MAX_HEIGHT = 1080;

  const reader = new FileReader();
  
  reader.onload = e => {
    const img = new Image();
    img.src = e.target.result;
    
    img.onload = () => {
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
      
      const resizedSrc = canvas.toDataURL('image/jpeg', 0.8);

      const newPhoto = { src: resizedSrc, caption, musicLink };
      photos.push(newPhoto);
      localStorage.setItem('photos', JSON.stringify(photos));
      
      fileInput.value = '';
      captionInput.value = '';
      musicLinkInput.value = '';
      
      currentPage = 1;
      renderGalleryAndPagination();
    };
  };
  
  reader.readAsDataURL(file);
});

gallery.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    if (!confirm("Tem certeza que quer apagar esta foto?")) {
      return;
    }
    const index = e.target.getAttribute('data-index');
    photos.splice(index, 1);
    localStorage.setItem('photos', JSON.stringify(photos));
    
    renderGalleryAndPagination();
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

lightboxPrevBtn.addEventListener('click', (e) => {
  e.stopPropagation();

  const reversedPhotos = photos.slice().reverse();
  const currentReversedIndex = reversedPhotos.findIndex(p => photos.indexOf(p) === currentLightboxIndex);

  if (currentReversedIndex > 0) {
    const newReversedIndex = currentReversedIndex - 1;
    const newPhoto = reversedPhotos[newReversedIndex];
    showLightboxPhoto(photos.indexOf(newPhoto));
  }
});

lightboxNextBtn.addEventListener('click', (e) => {
  e.stopPropagation();

  const reversedPhotos = photos.slice().reverse();
  const currentReversedIndex = reversedPhotos.findIndex(p => photos.indexOf(p) === currentLightboxIndex);

  if (currentReversedIndex < reversedPhotos.length - 1) {
    const newReversedIndex = currentReversedIndex + 1;
    const newPhoto = reversedPhotos[newReversedIndex];
    showLightboxPhoto(photos.indexOf(newPhoto));
  }
});

changeBgBtn.addEventListener('click', () => {
  const file = bgImageInput.files[0];
  if (!file) {
    alert("Selecione uma imagem de fundo.");
    return;
  }
  
  const MAX_WIDTH = 1920;
  const MAX_HEIGHT = 1920; 

  const reader = new FileReader();
  reader.onload = e => {
     const img = new Image();
     img.src = e.target.result;
     img.onload = () => {
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
         
         const resizedSrc = canvas.toDataURL('image/jpeg', 0.8); 

         localStorage.setItem('backgroundImage', resizedSrc);
         applyBackground(resizedSrc);
         
         alert("Fundo alterado!");
         bgImageInput.value = '';
     };
  };
  reader.readAsDataURL(file);
});

removeBgBtn.addEventListener('click', () => {
  if (confirm("Tem certeza que quer remover o fundo personalizado?")) {
    removeBackground();
  }
});

document.addEventListener('DOMContentLoaded', () => {
   const savedBg = localStorage.getItem('backgroundImage');
   if (savedBg) {
     applyBackground(savedBg);
   }
   renderGalleryAndPagination();
});