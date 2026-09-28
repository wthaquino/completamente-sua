/* ==================================================================
   CONFIGURAÇÃO — chaves, URLs e ajustes do site
   ================================================================== */

// [🔥 FIREBASE] — quem protege os dados são as regras (firestore.rules)
firebase.initializeApp({
  apiKey:            "AIzaSyBnx2V3kPc9U94qJoEsV-eIaoAChR7ety0",
  authDomain:        "inteiramene-sua.firebaseapp.com",
  projectId:         "inteiramene-sua",
  storageBucket:     "inteiramene-sua.firebasestorage.app",
  messagingSenderId: "801226819273",
  appId:             "1:801226819273:web:107cc21e7e687a1d7a2f18"
});

const db         = firebase.firestore();
const auth       = firebase.auth();
const FieldValue = firebase.firestore.FieldValue;

const photosCollection  = db.collection("photos");                      // [📷] lembranças
const mapPinsCollection = db.collection("map_pins");                    // pinos do mapa
const settingsDoc       = db.collection("settings").doc("appSettings");  // fundo
const petDoc            = db.collection("pet").doc("nossoGatinho");     // gatinho

const ADMIN_EMAIL = "admin@nossocantinho.com";
const DICA_SENHA  = "Dica: É como eu te chamo carinhosamente 💕";

// [☁️ CLOUDINARY]
const CLOUD_NAME    = "doplrv465";
const UPLOAD_PRESET = "meudengo";

// [🎵 MÚSICA]
const MUSICA_FUNDO_URL = "https://res.cloudinary.com/doplrv465/video/upload/v1779205456/VELUDO_MARROM_-_Liniker_fl8j91.mp3";
const MUSICA_VOLUME    = 0.5;

// [📷 FOTOS]
const FOTOS_POR_PAGINA = 4;
const FOTO_MAX_PX      = 1920;   // lado maior da foto enviada
const FUNDO_MAX_PX     = 1920;

// Gatinho: antes desta data cada aparelho tem o seu; depois, é compartilhado
const PET_DATA_COMPARTILHADO = new Date("2026-10-29T00:00:00");
