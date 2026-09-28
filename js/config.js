/* ==================================================================
   CONFIGURAÇÃO — tudo que é chave, URL ou data ajustável fica aqui
   ================================================================== */

/* ─── [🔥 FIREBASE] ─────────────────────────────────────────────────
   A apiKey do Firebase pode ser pública. Quem protege os dados são as
   regras do Firestore → cole o conteúdo de firestore.rules no console
   (Firestore Database > Regras > Publicar).                           */
const firebaseConfig = {
  apiKey:            "AIzaSyBnx2V3kPc9U94qJoEsV-eIaoAChR7ety0",
  authDomain:        "inteiramene-sua.firebaseapp.com",
  projectId:         "inteiramene-sua",
  storageBucket:     "inteiramene-sua.firebasestorage.app",
  messagingSenderId: "801226819273",
  appId:             "1:801226819273:web:107cc21e7e687a1d7a2f18"
};

firebase.initializeApp(firebaseConfig);
const db   = firebase.firestore();
const auth = firebase.auth();

// Coleções usadas pelo site
const photosCollection  = db.collection("photos");                      // [📷] url, caption, musicLink, unlockDate, likes, timestamp
const settingsDoc       = db.collection("settings").doc("appSettings");  // backgroundImageUrl
const mapPinsCollection = db.collection("map_pins");                    // cidade, pergunta, resposta_hash, posicao_top/left, recompensa_url, data_criacao
const petDoc            = db.collection("pet").doc("nossoGatinho");     // stats do gatinho (compartilhado)

// Usuário admin do Firebase Auth (a senha é a "chave mestra")
const ADMIN_EMAIL = "admin@nossocantinho.com";

// Texto do botão "Esqueci a senha" (deixe "" para não mostrar dica)
const DICA_SENHA = "Dica: É como eu te chamo carinhosamente 💕";


/* ─── [☁️ CLOUDINARY] ───────────────────────────────────────────────
   Upload "unsigned". No painel do Cloudinary, restrinja o preset
   (Settings > Upload > Upload presets > meudengo): formatos só de
   imagem, tamanho máximo e uma pasta fixa.                            */
const CLOUD_NAME    = "doplrv465";
const UPLOAD_PRESET = "meudengo";


/* ─── [🎵 MÚSICA] ───────────────────────────────────────────────────
   Música de fundo (MP3 hospedado no Cloudinary). Troque aqui.         */
const MUSICA_FUNDO_URL    = "https://res.cloudinary.com/doplrv465/video/upload/v1779205456/VELUDO_MARROM_-_Liniker_fl8j91.mp3";
const MUSICA_VOLUME_INICIAL = 0.5;


/* ─── [📷 FOTOS] ────────────────────────────────────────────────────*/
const FOTOS_POR_PAGINA  = 4;
const FOTO_LADO_MAXIMO  = 1920;   // px — lado maior da foto enviada
const FOTO_QUALIDADE    = 0.8;
const FUNDO_LARGURA_MAX = 1920;
const FUNDO_QUALIDADE   = 0.6;


/* ─── GATINHO ───────────────────────────────────────────────────────
   Antes desta data: cada aparelho tem o seu gato (localStorage).
   A partir dela: o gato passa a ser compartilhado pelo Firebase.      */
const PET_DATA_COMPARTILHADO = new Date("2026-10-29T00:00:00");
