(async () => {

const __realGet = document.getElementById.bind(document);
const __dummies = {};
document.getElementById = function (id) {
  const el = __realGet(id);
  if (el) return el;
  return __dummies[id] || (__dummies[id] = document.createElement('div'));
};
const hasEl = (id) => !!__realGet(id);
const PAGE = document.body.dataset.page || 'home';
const goBack = () => { if (history.length > 1) history.back(); else location.href = 'index.html'; };
const goHome = () => { location.href = 'index.html'; };

const STORE_CONFIG = {
  adminEmail: "badajunuir@gmail.com",
  defaultStoreName: "🛍️ MAKAM",
  defaultPromoBanner: "🚚 توصيل سريع لـ 58 ولاية • الدفع نقداً عند الاستلام 💯",
  defaultCurrency: "دج",
  defaultPhone: "213661355287",
  defaultBlockedWilayas: "40",
  defaultCategories: ["إلكترونيات", "ملابس", "أحذية", "إكسسوارات"],
  firebase: {
    apiKey: "AIzaSyDLtdqwuVYO4kcmtXFyWKQSA9w8oPXbt3Q",
    authDomain: "makam2020-55171.firebaseapp.com",
    databaseURL: "https://makam2020-55171-default-rtdb.firebaseio.com",
    projectId: "makam2020-55171",
    storageBucket: "makam2020-55171.firebasestorage.app",
    messagingSenderId: "963087168890",
    appId: "1:963087168890:web:ce0f09cb19c3df8944d2c3",
    measurementId: "G-06KTBS0TNT"
  }
};



const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
const { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, where, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
const { getAuth, signInAnonymously, signInWithEmailAndPassword, signOut } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

const app = initializeApp(STORE_CONFIG.firebase);
const db = getFirestore(app);
const auth = getAuth(app);

let products = [];
let orders = [];
let settings = {
  storeName: STORE_CONFIG.defaultStoreName,
  promoBanner: STORE_CONFIG.defaultPromoBanner,
  currency: STORE_CONFIG.defaultCurrency,
  phone: STORE_CONFIG.defaultPhone,
  blockedWilayas: STORE_CONFIG.defaultBlockedWilayas,
  categories: [...STORE_CONFIG.defaultCategories],
  autoReplyEnabled: false,
  autoReplyText: 'أعتذر منك، المدير مشغول حالياً وسأرد عليك في أقرب وقت.'
};
let cart = JSON.parse(localStorage.getItem('fb_cart') || '[]');
let currentCategory = 'all';
let searchQuery = '';
let isLoggedIn = false;
let currentProductId = null;
let isBlockedRegion = false;
let deepLinkHandled = false;

let selectedSize = null;
let selectedColor = null;
let currentActivePrice = 0;

let unsubOrdersAdmin = null;
let unsubChatsAdmin = null;
let activeAdminChatId = null;
let unsubClientChat = null;
let allChats = {};
let allOrdersForClients = [];

const wilayasShipping = {
  "01 - أدرار": { home: 1000, desk: 600 }, "02 - الشلف": { home: 600, desk: 400 }, "03 - الأغواط": { home: 800, desk: 500 },
  "04 - أم البواقي": { home: 500, desk: 300 }, "05 - باتنة": { home: 400, desk: 200 }, "06 - بجاية": { home: 600, desk: 400 },
  "07 - بسكرة": { home: 700, desk: 400 }, "08 - بشار": { home: 1000, desk: 600 }, "09 - البليدة": { home: 600, desk: 350 },
  "10 - البويرة": { home: 600, desk: 350 }, "11 - تمنراست": { home: 1200, desk: 800 }, "12 - تبسة": { home: 600, desk: 350 },
  "13 - تلمسان": { home: 700, desk: 450 }, "14 - تيارت": { home: 700, desk: 400 }, "15 - تيزي وزو": { home: 600, desk: 350 },
  "16 - الجزائر العاصمة": { home: 600, desk: 350 }, "17 - الجلفة": { home: 700, desk: 400 }, "18 - جيجل": { home: 600, desk: 350 },
  "19 - سطيف": { home: 500, desk: 300 }, "20 - سعيدة": { home: 700, desk: 450 }, "21 - سكيكدة": { home: 500, desk: 300 },
  "22 - سيدي بلعباس": { home: 700, desk: 450 }, "23 - عنابة": { home: 500, desk: 300 }, "24 - قالمة": { home: 500, desk: 300 },
  "25 - قسنطينة": { home: 500, desk: 300 }, "26 - المدية": { home: 600, desk: 350 }, "27 - مستغانم": { home: 700, desk: 400 },
  "28 - المسيلة": { home: 600, desk: 350 }, "29 - معسكر": { home: 700, desk: 400 }, "30 - ورقلة": { home: 800, desk: 500 },
  "31 - وهران": { home: 700, desk: 400 }, "32 - البيض": { home: 900, desk: 550 }, "33 - إليزي": { home: 1200, desk: 800 },
  "34 - برج بوعريريج": { home: 500, desk: 300 }, "35 - بومرداس": { home: 600, desk: 350 }, "36 - الطارف": { home: 600, desk: 350 },
  "37 - تندوف": { home: 1200, desk: 800 }, "38 - تسمسيلت": { home: 700, desk: 400 }, "39 - الوادي": { home: 800, desk: 500 },
  "40 - خنشلة": { home: 500, desk: 300 }, "41 - سوق أهراس": { home: 600, desk: 350 }, "42 - تيبازة": { home: 600, desk: 350 },
  "43 - ميلة": { home: 500, desk: 300 }, "44 - عين الدفلى": { home: 600, desk: 350 }, "45 - النعامة": { home: 900, desk: 550 },
  "46 - عين تموشنت": { home: 700, desk: 450 }, "47 - غرداية": { home: 800, desk: 500 }, "48 - غليزان": { home: 700, desk: 400 },
  "49 - المغير": { home: 800, desk: 500 }, "50 - المنيعة": { home: 900, desk: 550 }, "51 - أولاد جلال": { home: 700, desk: 450 },
  "52 - برج باجي مختار": { home: 1300, desk: 900 }, "53 - بني عباس": { home: 1000, desk: 650 }, "54 - تيميمون": { home: 1000, desk: 650 },
  "55 - تقرت": { home: 800, desk: 500 }, "56 - جانت": { home: 1300, desk: 900 }, "57 - إن صالح": { home: 1200, desk: 800 }, "58 - إن قزام": { home: 1400, desk: 1000 }
};

function getProductDirectUrl(id) {
  const url = new URL(window.location.href);
  url.searchParams.set('product', id);
  url.hash = '';
  return url.toString();
}

function copyTextFallback(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return Promise.resolve();
}

function copyProductLink(id) {
  const link = getProductDirectUrl(id);
  copyTextFallback(link).then(() => showToast('تم نسخ رابط المنتج المباشر 🔗'));
}

function copyCurrentProductLink() {
  if (!currentProductId) return;
  copyProductLink(currentProductId);
}

function checkDirectProductLink() {
  if (deepLinkHandled) return;
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('product') || (window.location.hash.startsWith('#product=') ? window.location.hash.replace('#product=', '') : null);
  if (!targetId) return;
  const found = products.find(p => p.id === targetId);
  if (found) {
    deepLinkHandled = true;
    openProductModal(found.id);
    setTimeout(() => {
      const codBox = document.querySelector('#productModal .express-cod-box');
      if (codBox) codBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 320);
  }
}

function resolveVariantPricing(product, colorOptionStr) {
  const basePrice = Math.max(0, Number(product?.price) || 0);
  if (!colorOptionStr) return { name: '', price: basePrice, customImg: null };
  const parts = String(colorOptionStr).split(':');
  const name = (parts[0] || '').trim();
  const parsedCustomPrice = parts[1] !== undefined && parts[1].trim() !== '' ? parseFloat(parts[1]) : NaN;
  const price = !isNaN(parsedCustomPrice) && parsedCustomPrice >= 0 ? parsedCustomPrice : basePrice;
  const customImg = parts[2] && parts[2].trim() !== '' ? parts[2].trim() : null;
  return { name, price, customImg };
}

function calculateOrderTotals(itemsList, wilaya, shippingType) {
  const safeItems = Array.isArray(itemsList) ? itemsList : [];
  const subtotal = safeItems.reduce((sum, item) => {
    const unitPrice = Math.max(0, Number(item.price) || 0);
    const qty = Math.max(1, parseInt(item.qty, 10) || 1);
    return sum + (unitPrice * qty);
  }, 0);
  const shipRate = wilaya && wilayasShipping[wilaya] ? (wilayasShipping[wilaya][shippingType] || 0) : 0;
  const shippingCost = Math.max(0, Number(shipRate) || 0);
  return { subtotal, shippingCost, total: subtotal + shippingCost };
}

function evaluateOrderRisk({ phone, wilaya }) {
  let riskScore = 0;
  const cleanPhone = String(phone || '').replace(/\s+/g, '');
  const validDzPhone = /^0[567][0-9]{8}$/.test(cleanPhone);
  if (!validDzPhone) riskScore += 50;
  if (isWilayaBlocked(wilaya)) riskScore += 100;
  return { validPhone: validDzPhone, blocked: riskScore >= 100, riskScore };
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initTheme() {
  const saved = localStorage.getItem('makam_theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('themeToggleBtn').textContent = '☀️';
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('makam_theme', isDark ? 'dark' : 'light');
  document.getElementById('themeToggleBtn').textContent = isDark ? '☀️' : '🌙';
}

async function checkVisitorRegion() {
  if (sessionStorage.getItem('makam_region_checked') === '1' && localStorage.getItem('makam_region_flag') !== '1') return;
  if (localStorage.getItem('makam_region_flag') === '1') {
    isBlockedRegion = true;
    return;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return;
    const data = await res.json();
    sessionStorage.setItem('makam_region_checked', '1');
    const regionStr = ((data.region || '') + ' ' + (data.city || '')).toLowerCase();
    if (regionStr.includes('khenchela') || regionStr.includes('خنشلة')) {
      isBlockedRegion = true;
      localStorage.setItem('makam_region_flag', '1');
    }
  } catch (e) {}
}

function isWilayaBlocked(wilayaStr) {
  if (isBlockedRegion) return true;
  if (!wilayaStr) return false;
  const blockedList = (settings.blockedWilayas || '40').split(',').map(s => s.trim()).filter(Boolean);
  return blockedList.some(code => {
    const normalizedCode = code.replace(/^0+/, '');
    return wilayaStr.startsWith(code + ' ') ||
           (normalizedCode && wilayaStr.startsWith(normalizedCode + ' ')) ||
           wilayaStr.includes('خنشلة');
  });
}

let myClientId = localStorage.getItem('chat_client_id');
if (!myClientId) {
  myClientId = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
  localStorage.setItem('chat_client_id', myClientId);
}

const startAnonymousAuth = async () => {
  try {
    if (auth.authStateReady) await auth.authStateReady();
    if (!auth.currentUser) {
      const res = await signInAnonymously(auth);
      if (res && res.user) {
        myClientId = res.user.uid;
        localStorage.setItem('chat_client_id', myClientId);
      }
    } else if (auth.currentUser.isAnonymous) {
      myClientId = auth.currentUser.uid;
    }
  } catch (e) { console.error(e); }
};

function parseVideoInfo(videoUrl) {
  if (!videoUrl || videoUrl.trim() === '') return null;
  const url = videoUrl.trim();
  let videoId = '';
  if (url.includes('youtube.com/watch?v=')) { videoId = url.split('v=')[1].split('&')[0]; }
  else if (url.includes('youtu.be/')) { videoId = url.split('youtu.be/')[1].split('?')[0]; }
  else if (url.includes('youtube.com/shorts/')) { videoId = url.split('shorts/')[1].split('?')[0]; }

  if (videoId) {
    return {
      type: 'youtube',
      id: videoId,
      embedUrl: 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&mute=1&loop=1&playlist=' + videoId + '&controls=0&showinfo=0&rel=0&playsinline=1&modestbranding=1'
    };
  }
  return { type: 'direct', url: url };
}

function playNotificationSound() {
  if (!isLoggedIn) return;
  try {
    const audio = document.getElementById('notifSound');
    if (audio) { audio.currentTime = 0; audio.play().catch(()=>{}); }
  } catch (e) {}
}

let flashInterval = null;
function startTitleFlash() {
  if (!isLoggedIn || flashInterval) return;
  let isOriginal = false;
  const originalTitle = document.title;
  flashInterval = setInterval(() => {
    document.title = isOriginal ? originalTitle : '🔴 رسالة جديدة من عميل!';
    isOriginal = !isOriginal;
  }, 1000);
}

function stopTitleFlash() {
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
    document.title = settings.storeName;
  }
}

async function loadSettings() {
  try {
    const snap = await getDocs(collection(db, 'settings'));
    if (!snap.empty) {
      settings = { ...settings, ...snap.docs[0].data() };
      settings._docId = snap.docs[0].id;
    }
    applySettings();
  } catch (e) { applySettings(); }
}

function listenProducts() {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  onSnapshot(q, (snap) => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts();
    document.getElementById('statProducts').textContent = products.length;
    if (isLoggedIn) renderProductList();
    checkDirectProductLink();
  }, () => {
    document.getElementById('products').innerHTML = '<div class="empty" style="grid-column:1/-1;">تعذر تحميل المنتجات حالياً</div>';
  });
}

function startAdminListeners() {
  stopAdminListeners();
  const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  unsubOrdersAdmin = onSnapshot(qOrders, (snap) => {
    orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    allOrdersForClients = orders;
    document.getElementById('statOrders').textContent = orders.length;
    const confirmedRev = orders
      .filter(o => o.status === 'done' || o.status === 'shipped')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    document.getElementById('statRevenue').textContent = confirmedRev.toLocaleString() + ' ' + settings.currency;
    if (isLoggedIn) {
      renderOrders();
      renderAdminClientsList();
    }
  });

  unsubChatsAdmin = onSnapshot(collection(db, 'chats'), (snap) => {
    allChats = {};
    let hasNew = false;
    snap.docs.forEach(d => {
      allChats[d.id] = { id: d.id, ...d.data() };
      if (d.data().lastSender === 'client' && !d.data().seenByAdmin) {
        if (!hasNew) { playNotificationSound(); startTitleFlash(); }
        hasNew = true;
      }
    });
    document.getElementById('statChats').textContent = Object.keys(allChats).length;
    if (isLoggedIn) {
      renderAdminClientsList();
      document.getElementById('messagesBadge').innerHTML = hasNew
        ? '<span style="background:#ef4444;color:#fff;padding:1px 6px;border-radius:10px;font-size:10px;margin-right:4px">!</span>'
        : '';
      if (activeAdminChatId && allChats[activeAdminChatId]) openAdminChat(activeAdminChatId);
    }
  });
}

function stopAdminListeners() {
  if (unsubOrdersAdmin) { unsubOrdersAdmin(); unsubOrdersAdmin = null; }
  if (unsubChatsAdmin) { unsubChatsAdmin(); unsubChatsAdmin = null; }
  stopTitleFlash();
}

function applySettings() {
  document.getElementById('storeName').textContent = settings.storeName;
  document.title = settings.storeName;
  document.getElementById('promoBanner').textContent = settings.promoBanner || STORE_CONFIG.defaultPromoBanner;
  document.getElementById('floatingWaBtn').href = 'https://wa.me/' + settings.phone + '?text=' + encodeURIComponent('مرحباً، أريد الاستفسار عن منتجات المتجر');
  renderCategories();
  document.getElementById('sStoreName').value = settings.storeName;
  document.getElementById('sPromoBanner').value = settings.promoBanner || '';
  document.getElementById('sCurrency').value = settings.currency;
  document.getElementById('sPhone').value = settings.phone;
  document.getElementById('sBlockedWilayas').value = settings.blockedWilayas || '40';
  document.getElementById('sAutoReplyEnabled').checked = settings.autoReplyEnabled || false;
  document.getElementById('sAutoReplyText').value = settings.autoReplyText || '';
  renderCategoriesAdmin();
  fillCategorySelect();
}

function renderCategories() {
  const cats = settings.categories.filter(c => c !== 'الكل');
  document.getElementById('categories').innerHTML =
    '<button type="button" class="cat-btn active" onclick="filterCategory(\'all\',this)">الكل</button>' +
    cats.map(c => '<button type="button" class="cat-btn" onclick="filterCategory(\'' + escapeHtml(c).replace(/'/g, "\\'") + '\',this)">' + escapeHtml(c) + '</button>').join('');
}

function renderProducts() {
  const c = document.getElementById('products');
  const filtered = products.filter(p => {
    const cm = currentCategory === 'all' || p.category === currentCategory;
    const sm = !searchQuery ||
      (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.desc && p.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    return cm && sm;
  });
  if (filtered.length === 0) {
    c.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);font-weight:700;">لا توجد منتجات مطابقة حالياً</div>';
    return;
  }
  c.innerHTML = filtered.map((p, idx) => {
    const firstImg = p.img ? escapeHtml(p.img.split(',')[0].trim()) : 'https://via.placeholder.com/300x200?text=No+Image';
    const videoInfo = parseVideoInfo(p.video);
    let discountHtml = '';
    let oldPriceHtml = '';
    if (p.oldPrice && Number(p.oldPrice) > Number(p.price)) {
      const discountPercent = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
      discountHtml = '<div class="discount-badge">-' + discountPercent + '%</div>';
      oldPriceHtml = '<span class="old-price">' + Number(p.oldPrice).toLocaleString() + ' ' + escapeHtml(settings.currency) + '</span>';
    }

    let mediaCardHtml = '<img src="' + firstImg + '" class="product-img" loading="lazy" onerror="this.src=\'https://via.placeholder.com/300x200?text=No+Image\'">';
    if (videoInfo) {
      if (videoInfo.type === 'direct') {
        mediaCardHtml = '<video src="' + escapeHtml(videoInfo.url) + '" poster="' + firstImg + '" autoplay muted loop playsinline class="product-bg-video"></video>' +
          '<div class="video-live-badge"><span class="video-live-dot"></span> فيديو</div>';
      } else if (videoInfo.type === 'youtube') {
        mediaCardHtml = '<div style="position:relative; width:100%; height:100%; overflow:hidden; pointer-events:none;">' +
          '<iframe src="' + escapeHtml(videoInfo.embedUrl) + '" style="position:absolute; top:50%; left:50%; width:177.77vh; height:100%; min-width:100%; min-height:56.25vw; transform:translate(-50%, -50%) scale(1.25); border:none;" allow="autoplay; encrypted-media" loading="lazy"></iframe>' +
          '</div><div class="video-live-badge"><span class="video-live-dot"></span> فيديو</div>';
      }
    }

    const revCount = 14 + (idx * 7) % 38;
    return '<div class="product-card">' +
      discountHtml +
      '<div class="product-media-box" onclick="openProductModal(\'' + escapeHtml(p.id) + '\')">' + mediaCardHtml + '</div>' +
      '<div class="product-info">' +
        '<div class="product-rating"><span>★★★★★ (' + revCount + ')</span><span style="font-size:10px;">' + escapeHtml(p.category || '') + '</span></div>' +
        '<div class="product-title" onclick="openProductModal(\'' + escapeHtml(p.id) + '\')">' + escapeHtml(p.title) + '</div>' +
        '<div class="price-container"><div class="product-price">' + Number(p.price).toLocaleString() + ' ' + escapeHtml(settings.currency) + '</div>' + oldPriceHtml + '</div>' +
        '<div class="card-actions-row">' +
          '<button type="button" class="add-btn" onclick="openProductModal(\'' + escapeHtml(p.id) + '\')">⚡ اطلب الآن</button>' +
          '<button type="button" class="quick-cart-btn" onclick="quickAddCard(\'' + escapeHtml(p.id) + '\')" title="إضافة للسلة">🛒</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function quickAddCard(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if ((p.sizes && p.sizes.trim()) || (p.colors && p.colors.trim())) {
    openProductModal(id);
    showToast('اختر الخيار المناسب أولاً');
    return;
  }
  addToCart(id);
}

function filterProducts() { searchQuery = document.getElementById('searchInput').value.trim(); renderProducts(); }
function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts();
}
function showHome(el) { if (PAGE !== 'home') { goHome(); return; }
   document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); el.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function showContact() { location.href = 'contact.html'; }

function populateWilayaDropdown(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="" disabled selected>اختر الولاية *</option>' +
    Object.keys(wilayasShipping).map(w => '<option value="' + escapeHtml(w) + '">' + escapeHtml(w) + '</option>').join('');
}

function openProductModal(id) {
  if (!hasEl('productModal')) { location.href = 'product.html?product=' + encodeURIComponent(id); return; }
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentProductId = id;
  selectedSize = null;
  selectedColor = null;
  currentActivePrice = Number(p.price);
  document.getElementById('pModalTitle').textContent = p.title;

  try {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('product', id);
    window.history.replaceState({}, '', nextUrl.toString());
  } catch (e) {}

  const gallery = document.getElementById('pModalGallery');
  const videoInfo = parseVideoInfo(p.video);
  const imgs = p.img ? p.img.split(',').map(s => s.trim()).filter(Boolean) : [];
  const mainSrc = imgs.length > 0 ? escapeHtml(imgs[0]) : 'https://via.placeholder.com/300x200?text=No+Image';

  let mediaHtml = '<div id="modalDisplayBox" style="position: relative; width:100%; height:290px; margin-bottom:10px; border-radius:16px; overflow:hidden; background:var(--surface-2); border:1px solid var(--border); display:flex; justify-content:center; align-items:center;">' +
    '<img id="mainProductImg" src="' + mainSrc + '" style="width:100%; height:100%; object-fit:contain;">';

  if (videoInfo) {
    const vidSrc = escapeHtml(videoInfo.type === 'direct' ? videoInfo.url : videoInfo.embedUrl);
    const videoContentHtml = videoInfo.type === 'direct'
      ? '<video id="draggableVideoEl" src="' + escapeHtml(videoInfo.url) + '" autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover; pointer-events:none; background:#000;"></video>'
      : '<iframe id="draggableVideoIframe" src="' + escapeHtml(videoInfo.embedUrl) + '" style="width:100%; height:100%; border:none; pointer-events:none;" allow="autoplay; encrypted-media"></iframe>';

    mediaHtml += '<div id="draggableVideoBox" style="position: absolute; bottom: 10px; left: 10px; width: 215px; height: 138px; border-radius: 12px; overflow: hidden; border: 2px solid #ffffff; box-shadow: 0 8px 24px rgba(0,0,0,0.48); z-index: 20; cursor: grab; touch-action: none; background:#000;">' +
      videoContentHtml +
      '<div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.45) 100%); display: flex; justify-content: space-between; align-items: flex-start; padding: 6px; pointer-events: none;">' +
        '<span style="background: rgba(0,0,0,0.72); color: #fff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 7px;">✥ اسحب</span>' +
        '<button type="button" onclick="event.stopPropagation(); openFullVideo(\'' + vidSrc.replace(/'/g, "\\'") + '\')" style="background: rgba(37,99,235,0.95); color: #fff; border: none; font-size: 14px; width: 28px; height: 28px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; pointer-events: auto;">⛶</button>' +
      '</div>' +
      '<button type="button" onclick="event.stopPropagation(); toggleProductVideo(this)" id="videoToggleBtn" style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.78); color: #fff; border: none; font-size: 13px; width: 30px; height: 30px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; pointer-events: auto;">⏸</button>' +
    '</div>';
  }

  mediaHtml += '</div>';

  if (imgs.length > 1) {
    mediaHtml += '<div style="display:flex; gap:8px; overflow-x:auto; justify-content:center; padding:4px 0;">' +
      imgs.map((src, idx) => {
        const safeSrc = escapeHtml(src);
        return '<img src="' + safeSrc + '" onclick="changeMainImage(\'' + safeSrc.replace(/'/g, "\\'") + '\', this)" class="modal-thumb" style="width:52px; height:52px; object-fit:cover; border-radius:10px; cursor:pointer; border: 2px solid ' + (idx === 0 ? '#2563eb' : 'var(--border)') + '; flex-shrink:0;">';
      }).join('') + '</div>';
  }

  gallery.innerHTML = mediaHtml;
  if (videoInfo) setTimeout(() => makeElementDraggable(document.getElementById('draggableVideoBox')), 100);

  document.getElementById('pModalDesc').textContent = p.desc || 'منتج عالي الجودة متوفر مع التوصيل السريع والدفع عند الاستلام.';
  document.getElementById('pModalPrice').textContent = currentActivePrice.toLocaleString() + ' ' + settings.currency;

  const oldPriceEl = document.getElementById('pModalOldPrice');
  if (p.oldPrice && Number(p.oldPrice) > Number(p.price)) {
    oldPriceEl.textContent = Number(p.oldPrice).toLocaleString() + ' ' + settings.currency;
    oldPriceEl.style.display = 'block';
  } else {
    oldPriceEl.style.display = 'none';
  }

  const sizeArea = document.getElementById('modalSizeArea');
  const sizesGrid = document.getElementById('modalSizesGrid');
  if (p.sizes && p.sizes.trim()) {
    const arr = p.sizes.split(',').map(s => s.trim()).filter(Boolean);
    sizesGrid.innerHTML = arr.map(s => '<button type="button" class="opt-btn" onclick="selectSize(\'' + escapeHtml(s).replace(/'/g, "\\'") + '\', this)">' + escapeHtml(s) + '</button>').join('');
    sizeArea.classList.remove('hidden');
  } else {
    sizeArea.classList.add('hidden');
  }

  const colorArea = document.getElementById('modalColorArea');
  const colorsGrid = document.getElementById('modalColorsGrid');
  if (p.colors && p.colors.trim()) {
    const arr = p.colors.split(',').map(c => c.trim()).filter(Boolean);
    colorsGrid.innerHTML = arr.map(item => {
      const resolved = resolveVariantPricing(p, item);
      return '<button type="button" class="opt-btn" onclick="selectColorOption(\'' + escapeHtml(item).replace(/'/g, "\\'") + '\', this)">' + escapeHtml(resolved.name) + '</button>';
    }).join('');
    colorArea.classList.remove('hidden');
  } else {
    colorArea.classList.add('hidden');
  }

  populateWilayaDropdown('exWilaya');
  updateExpressShipping();

  const shareText = encodeURIComponent('مرحباً، أريد الاستفسار عن هذا المنتج: ' + p.title + ' - السعر: ' + currentActivePrice + ' ' + settings.currency + '\n' + getProductDirectUrl(p.id));
  document.getElementById('whatsappShareBtn').href = 'https://wa.me/' + settings.phone + '?text=' + shareText;
  document.getElementById('productModal').classList.add('show');
}

function updateExpressShipping() {
  const wilaya = document.getElementById('exWilaya').value;
  const type = document.getElementById('exShipType').value;
  const { shippingCost, total } = calculateOrderTotals([{ price: currentActivePrice, qty: 1 }], wilaya, type);
  document.getElementById('exShipCost').textContent = shippingCost.toLocaleString() + ' ' + settings.currency;
  document.getElementById('exTotalCost').textContent = total.toLocaleString() + ' ' + settings.currency;
}

async function submitExpressOrder(e) {
  e.preventDefault();
  if (!currentProductId) return;
  const p = products.find(x => x.id === currentProductId);
  if (!p) return;
  if (p.sizes && p.sizes.trim() && !selectedSize) { showToast('يرجى اختيار المقاس أو الإصدار أولاً'); return; }
  if (p.colors && p.colors.trim() && !selectedColor) { showToast('يرجى اختيار اللون أو النوع أولاً'); return; }

  const name = document.getElementById('exName').value.trim();
  const phone = document.getElementById('exPhone').value.trim();
  const wilaya = document.getElementById('exWilaya').value;
  const shippingType = document.getElementById('exShipType').value;
  const address = document.getElementById('exAddr').value.trim();

  const risk = evaluateOrderRisk({ phone, wilaya });
  if (!risk.validPhone) { showToast('رقم الهاتف يجب أن يبدأ بـ 05 أو 06 أو 07 (10 أرقام)'); return; }
  if (risk.blocked) { closeProductModal(); showToast('تم تسجيل طلبك ✓'); return; }

  const btn = document.getElementById('exOrderBtn');
  btn.disabled = true;
  btn.textContent = '⏳ جاري تأكيد الطلب...';

  const variant = resolveVariantPricing(p, selectedColor);
  const itemObj = { title: p.title, size: selectedSize || '', color: variant.name, price: currentActivePrice, qty: 1 };
  const { subtotal, shippingCost, total } = calculateOrderTotals([itemObj], wilaya, shippingType);

  const waMessage = '🛒 *طلب مباشر جديد (' + encodeURIComponent(settings.storeName) + ')*%0A%0A' +
    '👤 *الاسم:* ' + encodeURIComponent(name) + '%0A' +
    '📞 *الهاتف:* ' + encodeURIComponent(phone) + '%0A' +
    '📍 *الولاية:* ' + encodeURIComponent(wilaya) + '%0A' +
    '🚚 *التوصيل:* ' + (shippingType === 'home' ? 'منزل' : 'مكتب') + ' (' + shippingCost + ' دج)%0A' +
    '🏠 *العنوان:* ' + encodeURIComponent(address) + '%0A%0A' +
    '📦 *المنتج:* ' + encodeURIComponent(p.title) + (selectedSize ? ' [' + encodeURIComponent(selectedSize) + ']' : '') + (variant.name ? ' [' + encodeURIComponent(variant.name) + ']' : '') + '%0A' +
    '💰 *الإجمالي الكلي:* ' + total + ' ' + encodeURIComponent(settings.currency);

  try {
    const newOrderRef = await addDoc(collection(db, 'orders'), {
      customer: name,
      phone,
      wilaya,
      shippingType: shippingType === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب',
      shippingCost,
      address,
      items: [itemObj],
      subtotal,
      total,
      status: 'new',
      createdAt: serverTimestamp(),
      clientId: myClientId
    });

    const myLocalOrders = JSON.parse(localStorage.getItem('my_local_orders') || '[]');
    myLocalOrders.unshift({ id: newOrderRef.id, date: new Date().toLocaleString('ar'), items: [itemObj], subtotal, shippingCost, total, customer: name, phone, wilaya, address, shippingType: shippingType === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب', status: 'new' });
    localStorage.setItem('my_local_orders', JSON.stringify(myLocalOrders));

    document.getElementById('exName').value = '';
    document.getElementById('exPhone').value = '';
    document.getElementById('exAddr').value = '';

    updateClientOrdersCount();
    closeProductModal();
    showToast('تم تأكيد طلبك بنجاح ✅');
    window.open('https://wa.me/' + settings.phone + '?text=' + waMessage, '_blank');
  } catch (err) {
    alert('❌ ' + err.message);
  }
  btn.disabled = false;
  btn.textContent = '✅ تأكيد الطلب الآن';
}

function makeElementDraggable(elmnt) {
  if (!elmnt) return;
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0, isDragging = false;
  const parent = elmnt.parentElement;
  elmnt.onmousedown = dragStart;
  elmnt.ontouchstart = dragStart;

  function dragStart(e) {
    e = e || window.event;
    if (e.target.tagName === 'BUTTON') return;
    elmnt.style.cursor = 'grabbing';
    if (e.type === 'touchstart') { pos3 = e.touches[0].clientX; pos4 = e.touches[0].clientY; }
    else { pos3 = e.clientX; pos4 = e.clientY; }
    isDragging = false;
    document.onmouseup = dragEnd; document.ontouchend = dragEnd;
    document.onmousemove = dragMove; document.ontouchmove = dragMove;
  }

  function dragMove(e) {
    e = e || window.event;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    pos1 = pos3 - clientX; pos2 = pos4 - clientY;
    if (Math.abs(pos1) > 5 || Math.abs(pos2) > 5) isDragging = true;
    if (isDragging && e.type === 'touchmove') e.preventDefault();
    pos3 = clientX; pos4 = clientY;
    const newTop = Math.max(0, Math.min(parent.clientHeight - elmnt.clientHeight, elmnt.offsetTop - pos2));
    const newLeft = Math.max(0, Math.min(parent.clientWidth - elmnt.clientWidth, elmnt.offsetLeft - pos1));
    elmnt.style.top = newTop + 'px'; elmnt.style.left = newLeft + 'px';
    elmnt.style.bottom = 'auto'; elmnt.style.right = 'auto';
  }

  function dragEnd() {
    elmnt.style.cursor = 'grab';
    document.onmouseup = null; document.onmousemove = null;
    document.ontouchend = null; document.ontouchmove = null;
  }
}

function toggleProductVideo(btn) {
  const videoEl = document.getElementById('draggableVideoEl');
  const iframe = document.getElementById('draggableVideoIframe');
  if (videoEl) {
    if (videoEl.paused || videoEl.ended) { videoEl.play().then(() => btn.textContent = '⏸').catch(()=>{}); }
    else { videoEl.pause(); btn.textContent = '▶'; }
    return;
  }
  if (iframe) {
    const match = iframe.src.match(/embed\/([^?]+)/);
    if (!match) return;
    const ytId = match[1];
    if (btn.textContent === '⏸') {
      btn.textContent = '▶';
      iframe.src = 'https://www.youtube.com/embed/' + ytId + '?autoplay=0&mute=1&loop=1&playlist=' + ytId + '&controls=0&rel=0&playsinline=1';
    } else {
      btn.textContent = '⏸';
      iframe.src = 'https://www.youtube.com/embed/' + ytId + '?autoplay=1&mute=1&loop=1&playlist=' + ytId + '&controls=0&rel=0&playsinline=1';
    }
  }
}

function openFullVideo(src) {
  const displayBox = document.getElementById('modalDisplayBox');
  if (!displayBox) return;
  const existing = document.getElementById('inlineVideoOverlay');
  if (existing) existing.remove();
  const isYoutube = src.indexOf('youtube') !== -1 || src.indexOf('youtu.be') !== -1;
  let videoHtml = '';
  if (isYoutube) {
    let videoId = '';
    if (src.indexOf('/embed/') !== -1) videoId = src.split('/embed/')[1].split('?')[0];
    else if (src.indexOf('watch?v=') !== -1) videoId = src.split('v=')[1].split('&')[0];
    else if (src.indexOf('youtu.be/') !== -1) videoId = src.split('youtu.be/')[1].split('?')[0];
    else if (src.indexOf('/shorts/') !== -1) videoId = src.split('/shorts/')[1].split('?')[0];
    videoHtml = videoId
      ? '<iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&playsinline=1&rel=0&controls=1" style="width:100%; height:100%; border:none;" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>'
      : '<div style="color:#fff;padding:20px;">رابط غير صالح</div>';
  } else {
    videoHtml = '<video src="' + escapeHtml(src) + '" controls autoplay playsinline style="width:100%; height:100%; object-fit:contain; background:#000;"></video>';
  }
  displayBox.insertAdjacentHTML('beforeend',
    '<div id="inlineVideoOverlay" style="position:absolute; inset:0; background:#000; z-index:100; display:flex; justify-content:center; align-items:center; border-radius:16px;">' +
      '<button type="button" onclick="event.stopPropagation(); closeInlineVideo()" style="position:absolute; top:10px; right:10px; background:#ef4444; color:#fff; border:none; width:34px; height:34px; border-radius:50%; font-size:18px; cursor:pointer; z-index:101;">✕</button>' +
      videoHtml +
    '</div>'
  );
}

function closeInlineVideo() { const o = document.getElementById('inlineVideoOverlay'); if (o) o.remove(); }

function changeMainImage(src, btn) {
  const mainImg = document.getElementById('mainProductImg');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.modal-thumb').forEach(t => t.style.borderColor = 'var(--border)');
  if (btn) btn.style.borderColor = '#2563eb';
}

function selectSize(size, btn) {
  selectedSize = size;
  document.querySelectorAll('#modalSizesGrid .opt-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function selectColorOption(optionStr, btn) {
  selectedColor = optionStr;
  document.querySelectorAll('#modalColorsGrid .opt-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const p = products.find(x => x.id === currentProductId);
  const resolved = resolveVariantPricing(p, optionStr);
  currentActivePrice = resolved.price;
  document.getElementById('pModalPrice').textContent = currentActivePrice.toLocaleString() + ' ' + settings.currency;
  updateExpressShipping();
  if (resolved.customImg) changeMainImage(resolved.customImg, null);
  if (p) {
    const shareText = encodeURIComponent('مرحباً، أريد الاستفسار عن منتج: ' + p.title + ' (' + resolved.name + ') - السعر: ' + currentActivePrice + ' ' + settings.currency + '\n' + getProductDirectUrl(p.id));
    document.getElementById('whatsappShareBtn').href = 'https://wa.me/' + settings.phone + '?text=' + shareText;
  }
}

function setPresetSizes(type) {
  if (type === 'shoes') document.getElementById('pSizes').value = '39, 40, 41, 42, 43, 44';
  else if (type === 'clothes') document.getElementById('pSizes').value = 'S, M, L, XL, XXL, XXXL';
}

function closeProductModal() {
  closeInlineVideo();
  currentProductId = null;
  goBack();
}

function addToCartFromModal() {
  if (!currentProductId) return;
  const p = products.find(x => x.id === currentProductId);
  if (p.sizes && p.sizes.trim() && !selectedSize) { showToast('يرجى اختيار المقاس المناسب أولاً'); return; }
  if (p.colors && p.colors.trim() && !selectedColor) { showToast('يرجى اختيار اللون أو الإصدار المناسب أولاً'); return; }
  const resolved = resolveVariantPricing(p, selectedColor);
  addToCart(currentProductId, selectedSize, resolved.name || null, currentActivePrice, resolved.customImg);
  closeProductModal();
}

function addToCart(id, size, color, price, img) {
  size = size || null;
  color = color || null;
  price = price !== undefined ? price : null;
  img = img || null;
  const p = products.find(x => x.id === id);
  if (!p) return;
  const finalPrice = price !== null ? price : Number(p.price);
  const finalImg = img ? img : (p.img ? p.img.split(',')[0].trim() : '');
  const itemKey = id + '_' + (size || '') + '_' + (color || '');
  const ex = cart.find(i => i.cartKey === itemKey);
  if (ex) { ex.qty++; }
  else { cart.push({ ...p, price: finalPrice, cartKey: itemKey, selectedSize: size, selectedColor: color, img: finalImg, qty: 1 }); }
  saveCart();
  showToast('تمت الإضافة للسلة ✓');
}

function removeFromCart(key) { cart = cart.filter(i => i.cartKey !== key); saveCart(); renderCart(); }
function changeQty(key, d) { const i = cart.find(x => x.cartKey === key); if (!i) return; i.qty += d; if (i.qty <= 0) removeFromCart(key); else { saveCart(); renderCart(); } }
function saveCart() { localStorage.setItem('fb_cart', JSON.stringify(cart)); updateCartCount(); }

function updateCartCount() {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = totalQty;
  const bottomBadge = document.getElementById('bottomCartCount');
  if (bottomBadge) {
    if (totalQty > 0) { bottomBadge.textContent = totalQty; bottomBadge.style.display = 'block'; }
    else { bottomBadge.style.display = 'none'; }
  }
}

function openCart() { if (!hasEl('cartModal')) { location.href = 'cart.html'; return; } renderCart(); document.getElementById('cartModal').classList.add('show'); }
function closeCart() { goHome(); }

function renderCart() {
  const c = document.getElementById('cartItems');
  if (cart.length === 0) {
    c.innerHTML = '<div class="empty"><span class="icon" style="font-size:35px;display:block;margin-bottom:8px">🛒</span>السلة فارغة</div>';
    return;
  }
  const { subtotal } = calculateOrderTotals(cart, '', 'home');
  c.innerHTML = cart.map(i => {
    const attrStr = [];
    if (i.selectedSize) attrStr.push('المقاس: ' + escapeHtml(i.selectedSize));
    if (i.selectedColor) attrStr.push('النوع/اللون: ' + escapeHtml(i.selectedColor));
    return '<div class="cart-item">' +
      '<img src="' + escapeHtml(i.img || 'https://via.placeholder.com/100') + '">' +
      '<div class="cart-item-info">' +
        '<div class="cart-item-title">' + escapeHtml(i.title) + '</div>' +
        (attrStr.length > 0 ? '<div class="cart-item-attr">' + attrStr.join(' | ') + '</div>' : '') +
        '<div class="cart-item-price">' + Number(i.price).toLocaleString() + ' ' + escapeHtml(settings.currency) + '</div>' +
        '<div class="qty-controls"><button type="button" class="qty-btn" onclick="changeQty(\'' + escapeHtml(i.cartKey).replace(/'/g, "\\'") + '\',-1)">−</button><span>' + i.qty + '</span><button type="button" class="qty-btn" onclick="changeQty(\'' + escapeHtml(i.cartKey).replace(/'/g, "\\'") + '\',1)">+</button></div>' +
      '</div>' +
      '<button type="button" class="remove-btn" onclick="removeFromCart(\'' + escapeHtml(i.cartKey).replace(/'/g, "\\'") + '\')">🗑</button>' +
    '</div>';
  }).join('') +
    '<div class="cart-total"><span>مجموع المنتجات:</span><span>' + subtotal.toLocaleString() + ' ' + escapeHtml(settings.currency) + '</span></div>' +
    '<button type="button" class="checkout-btn" onclick="showCheckout()">إتمام الطلب ←</button>';
}

function showCheckout() {
  const { subtotal } = calculateOrderTotals(cart, '', 'home');
  const wilayasOptions = Object.keys(wilayasShipping)
    .map(w => '<option value="' + escapeHtml(w) + '">' + escapeHtml(w) + '</option>')
    .join('');

  document.getElementById('cartItems').innerHTML =
    '<form onsubmit="submitOrder(event)">' +
      '<div class="form-group"><label>الاسم الكامل *</label><input type="text" id="oName" required placeholder="اسمك الكريم"></div>' +
      '<div class="form-group"><label>رقم الهاتف (05 / 06 / 07) *</label><input type="tel" id="oPhone" required placeholder="05xxxxxxxx" pattern="0[567][0-9]{8}" maxlength="10" title="يجب أن يكون الرقم 10 أرقام ويبدأ بـ 05 أو 06 أو 07"></div>' +
      '<div class="form-group"><label>الولاية *</label><select id="oWilaya" required onchange="updateShippingCost(' + subtotal + ')"><option value="" disabled selected>اختر ولايتك...</option>' + wilayasOptions + '</select></div>' +
      '<div class="form-group"><label>نوع التوصيل *</label><select id="oShippingType" required onchange="updateShippingCost(' + subtotal + ')"><option value="home">توصيل إلى المنزل (بابه)</option><option value="desk">توصيل إلى المكتب (الشركة)</option></select></div>' +
      '<div class="form-group"><label>العنوان بالتفصيل *</label><textarea id="oAddr" rows="2" required placeholder="الحي، الشارع، أو أقرب معلم..."></textarea></div>' +
      '<div class="cart-total"><span>مجموع المنتجات:</span><span id="subtotalText">' + subtotal.toLocaleString() + ' ' + escapeHtml(settings.currency) + '</span></div>' +
      '<div class="cart-total"><span>تكلفة التوصيل:</span><span id="shippingCostText">0 ' + escapeHtml(settings.currency) + '</span></div>' +
      '<div class="cart-final-total"><span>الإجمالي الكلي:</span><span id="finalTotalText">' + subtotal.toLocaleString() + ' ' + escapeHtml(settings.currency) + '</span></div>' +
      '<button type="submit" class="checkout-btn" id="orderBtn" style="margin-top:15px;">تأكيد الطلب ✓</button>' +
      '<button type="button" class="secondary-cart-btn" onclick="renderCart()">← العودة إلى السلة</button>' +
    '</form>';
}

function updateShippingCost(subtotal) {
  const wilaya = document.getElementById('oWilaya').value;
  const type = document.getElementById('oShippingType').value;
  const { shippingCost, total } = calculateOrderTotals([{ price: subtotal, qty: 1 }], wilaya, type);
  document.getElementById('shippingCostText').textContent = shippingCost.toLocaleString() + ' ' + settings.currency;
  document.getElementById('finalTotalText').textContent = total.toLocaleString() + ' ' + settings.currency;
}

async function submitOrder(e) {
  e.preventDefault();
  const wilaya = document.getElementById('oWilaya').value;
  const phone = document.getElementById('oPhone').value.trim();
  const risk = evaluateOrderRisk({ phone, wilaya });
  if (!risk.validPhone) { showToast('رقم الهاتف يجب أن يبدأ بـ 05 أو 06 أو 07 (10 أرقام)'); return; }
  if (risk.blocked) { cart = []; saveCart(); closeCart(); showToast('تم تسجيل طلبك ✓'); return; }

  const btn = document.getElementById('orderBtn');
  btn.disabled = true;
  btn.textContent = '⏳ جاري الإرسال...';
  const name = document.getElementById('oName').value.trim();
  const shippingType = document.getElementById('oShippingType').value;
  const address = document.getElementById('oAddr').value.trim();
  const { subtotal, shippingCost, total } = calculateOrderTotals(cart, wilaya, shippingType);

  const itemsText = cart.map(i => '• ' + i.title + ' (' + i.qty + ') - ' + (i.price * i.qty) + ' دج ' + (i.selectedSize ? '[مقاس: ' + i.selectedSize + ']' : '') + ' ' + (i.selectedColor ? '[النوع: ' + i.selectedColor + ']' : '')).join('%0A');
  const waMessage = '🛒 *طلب جديد من المتجر (' + encodeURIComponent(settings.storeName) + ')*%0A%0A' +
    '👤 *الاسم:* ' + encodeURIComponent(name) + '%0A' +
    '📞 *الهاتف:* ' + encodeURIComponent(phone) + '%0A' +
    '📍 *الولاية:* ' + encodeURIComponent(wilaya) + '%0A' +
    '🚚 *التوصيل:* ' + (shippingType === 'home' ? 'منزل' : 'مكتب') + ' (' + shippingCost + ' دج)%0A' +
    '🏠 *العنوان:* ' + encodeURIComponent(address) + '%0A%0A' +
    '📦 *المنتجات:*%0A' + itemsText + '%0A%0A' +
    '💰 *الإجمالي الكلي:* ' + total + ' ' + encodeURIComponent(settings.currency);

  try {
    const orderItems = cart.map(i => ({ title: i.title, size: i.selectedSize || '', color: i.selectedColor || '', price: i.price, qty: i.qty }));
    const newOrderRef = await addDoc(collection(db, 'orders'), {
      customer: name,
      phone,
      wilaya,
      shippingType: shippingType === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب',
      shippingCost,
      address,
      items: orderItems,
      subtotal,
      total,
      status: 'new',
      createdAt: serverTimestamp(),
      clientId: myClientId
    });

    const myLocalOrders = JSON.parse(localStorage.getItem('my_local_orders') || '[]');
    myLocalOrders.unshift({ id: newOrderRef.id, date: new Date().toLocaleString('ar'), items: orderItems, subtotal, shippingCost, total, customer: name, phone, wilaya, address, shippingType: shippingType === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب', status: 'new' });
    localStorage.setItem('my_local_orders', JSON.stringify(myLocalOrders));

    cart = [];
    saveCart();
    updateClientOrdersCount();
    window.open('https://wa.me/' + settings.phone + '?text=' + waMessage, '_blank');
    document.getElementById('cartItems').innerHTML = '<div style="text-align:center; padding:25px;"><span style="font-size:40px">✅</span><h2>تم إرسال طلبك بنجاح!</h2><p style="color:var(--text-muted);margin:12px 0">تم تحويلك إلى الواتساب لتأكيد الطلب مباشرة مع البائع.</p><button type="button" class="checkout-btn" onclick="closeCart()">العودة للمتجر</button></div>';
  } catch (err) {
    alert('❌ ' + err.message);
    btn.disabled = false;
    btn.textContent = 'تأكيد الطلب ✓';
  }
}

async function updateClientOrdersCount() {
  try {
    let totalCount = 0;
    if (myClientId) {
      const q = query(collection(db, 'orders'), where('clientId', '==', myClientId));
      const snap = await getDocs(q);
      totalCount = snap.size;
    }
    if (totalCount === 0) totalCount = JSON.parse(localStorage.getItem('my_local_orders') || '[]').length;
    const badge = document.getElementById('myOrdersCount');
    if (badge) {
      if (totalCount > 0) { badge.textContent = totalCount; badge.style.display = 'block'; }
      else { badge.style.display = 'none'; }
    }
  } catch (e) {}
}

function renderOrderCard(o) {
  const cur = escapeHtml(settings.currency);
  const money = (n) => Number(n || 0).toLocaleString() + ' ' + cur;
  const row = (label, value) => value ? '<div class="order-info-row"><span>' + label + '</span><strong>' + escapeHtml(String(value)) + '</strong></div>' : '';

  const st = o.status === 'done' ? 3 : (o.status === 'shipped' ? 2 : 1);
  const stepNames = ['تم استلام الطلب', 'تم التأكيد والشحن', 'تم التسليم'];
  const steps = '<div class="order-steps">' + stepNames.map((n, idx) =>
    '<div class="order-step' + (idx + 1 <= st ? ' on' : '') + '"><span class="dot">' + (idx + 1 <= st ? '✓' : (idx + 1)) + '</span><span class="lbl">' + n + '</span></div>'
  ).join('') + '</div>';

  const orderDate = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString('ar') : (o.date || 'حديث');

  const items = (o.items || []).map(i => {
    const details = [];
    if (i.size) details.push('المقاس: ' + escapeHtml(i.size));
    if (i.color) details.push('النوع/اللون: ' + escapeHtml(i.color));
    const qty = Number(i.qty || 1);
    const unit = Number(i.price || 0);
    return '<div class="order-item-row"><div><strong>' + escapeHtml(i.title) + '</strong>' +
      (details.length ? '<div class="order-item-sub">' + details.join(' | ') + '</div>' : '') +
      '<div class="order-item-sub">' + qty + ' × ' + money(unit) + '</div></div>' +
      '<span>' + money(unit * qty) + '</span></div>';
  }).join('');

  const subtotal = o.subtotal !== undefined ? o.subtotal : (o.items || []).reduce((t, i) => t + Number(i.price || 0) * Number(i.qty || 1), 0);
  const hasShipping = o.shippingCost !== undefined && o.shippingCost !== null && o.shippingCost !== '';

  const info = row('👤 الاسم', o.customer) + row('📞 الهاتف', o.phone) + row('📍 الولاية', o.wilaya) +
    row('🚚 نوع التوصيل', o.shippingType) + row('🏠 العنوان', o.address);

  return '<div class="order-card">' +
    '<div class="order-header"><span class="order-id">#' + escapeHtml(String(o.id).slice(0, 8)) + '</span><span class="order-date">' + escapeHtml(orderDate) + '</span></div>' +
    steps +
    '<div class="order-section-title">🛍️ المنتجات</div>' +
    '<div class="order-items">' + items + '</div>' +
    (info ? '<div class="order-section-title">📋 معلومات التوصيل</div><div class="order-info">' + info + '</div>' : '') +
    '<div class="order-sum">' +
      '<div><span>مجموع المنتجات</span><span>' + money(subtotal) + '</span></div>' +
      (hasShipping ? '<div><span>تكلفة التوصيل</span><span>' + money(o.shippingCost) + '</span></div>' : '') +
      '<div class="order-total"><span>المجموع الكلي</span><span>' + money(o.total) + '</span></div>' +
    '</div>' +
    '<div class="order-pay">💵 الدفع عند الاستلام</div>' +
  '</div>';
}

function openMyOrders(btn) {
  if (!hasEl('myOrdersModal')) { location.href = 'orders.html'; return; }
  const container = document.getElementById('myOrdersList');
  container.innerHTML = '<div class="empty">⏳ جاري تحميل طلباتك...</div>';
  document.getElementById('myOrdersModal').classList.add('show');

  const q = query(collection(db, 'orders'), where('clientId', '==', myClientId));
  getDocs(q).then((snap) => {
    let myOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    myOrders.sort((x, y) => {
      const tx = x.createdAt && x.createdAt.toMillis ? x.createdAt.toMillis() : 0;
      const ty = y.createdAt && y.createdAt.toMillis ? y.createdAt.toMillis() : 0;
      return ty - tx;
    });
    if (myOrders.length === 0) myOrders = JSON.parse(localStorage.getItem('my_local_orders') || '[]');
    if (myOrders.length === 0) {
      container.innerHTML = '<div class="empty"><span class="icon">📦</span>لم تقم بأي طلب بعد</div>';
      return;
    }
    container.innerHTML = myOrders.map(renderOrderCard).join('');
  }).catch(() => {
    container.innerHTML = '<div class="empty">❌ حدث خطأ أثناء تحميل الطلبات.</div>';
  });
}

function closeMyOrders() { goHome(); }

function openClientChat(btn) {
  if (!hasEl('clientChatModal')) { location.href = 'chat.html'; return; }
  document.getElementById('clientChatModal').classList.add('show');
  const savedName = localStorage.getItem('chat_client_name');
  if (savedName) document.getElementById('clientNameArea').style.display = 'none';
  if (myClientId && !isBlockedRegion) listenMyChat();
}

function listenMyChat() {
  if (unsubClientChat) unsubClientChat();
  if (!myClientId) return;
  unsubClientChat = onSnapshot(doc(db, 'chats', myClientId), (docSnap) => {
    const container = document.getElementById('clientChatMessages');
    if (docSnap.exists() && docSnap.data().messages) {
      const msgs = docSnap.data().messages;
      if (msgs.length === 0) container.innerHTML = '<div class="empty">لا توجد رسائل بعد. اكتب استفسارك.</div>';
      else {
        container.innerHTML = msgs.map(m => '<div class="chat-bubble ' + (m.sender === 'client' ? 'client' : 'admin') + '">' + escapeHtml(m.text) + '</div>').join('');
        container.scrollTop = container.scrollHeight;
      }
    } else {
      container.innerHTML = '<div class="empty">مرحباً! كيف يمكننا مساعدتك؟</div>';
    }
  });
}

async function sendClientMessage() {
  const input = document.getElementById('clientChatInput');
  const text = input.value.trim();
  if (!text) return;
  if (isBlockedRegion) {
    input.value = '';
    const container = document.getElementById('clientChatMessages');
    container.innerHTML += '<div class="chat-bubble client">' + escapeHtml(text) + '</div>';
    container.scrollTop = container.scrollHeight;
    return;
  }
  if (!myClientId) myClientId = localStorage.getItem('chat_client_id') || ('client_' + Date.now());
  let name = localStorage.getItem('chat_client_name');
  if (!name) {
    name = document.getElementById('chatClientName').value.trim();
    if (!name) { showToast('يرجى كتابة اسمك أولاً'); return; }
    localStorage.setItem('chat_client_name', name);
    document.getElementById('clientNameArea').style.display = 'none';
  }
  input.value = '';
  const chatRef = doc(db, 'chats', myClientId);
  try {
    const docSnap = await getDocs(query(collection(db, 'chats'), where('__name__', '==', myClientId)));
    let msgs = [];
    let hasAdminReplied = false;
    if (!docSnap.empty && docSnap.docs[0].data().messages) {
      msgs = docSnap.docs[0].data().messages;
      hasAdminReplied = msgs.some(m => m.sender === 'admin');
    }
    if (settings.autoReplyEnabled && settings.autoReplyText) msgs.push({ sender: 'admin', text: settings.autoReplyText, time: new Date() });
    else if (msgs.length === 0) msgs.push({ sender: 'admin', text: 'السلام عليكم، أهلاً بك في متجرنا. كيف يمكننا خدمتك؟', time: new Date() });
    else if (!hasAdminReplied) msgs.push({ sender: 'admin', text: 'سنرد عليك في أقرب وقت ممكن.', time: new Date() });
    msgs.push({ sender: 'client', text: text, time: new Date() });
    await setDoc(chatRef, { clientName: name, lastSender: 'client', seenByAdmin: false, messages: msgs }, { merge: true });
  } catch (err) { alert('❌ ' + err.message); }
}

function closeClientChat() {
  if (unsubClientChat) { unsubClientChat(); unsubClientChat = null; }
  goHome();
}

function renderAdminClientsList() {
  const list = document.getElementById('adminClientsList');
  if (Object.keys(allChats).length === 0) { list.innerHTML = '<div class="empty">لا توجد دردشات</div>'; return; }
  list.innerHTML = Object.keys(allChats).map(id => {
    const chat = allChats[id];
    const hasOrders = allOrdersForClients.some(o => o.clientId === id);
    const badge = hasOrders
      ? '<span style="background:#dcfce7;color:#166534;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:800;margin-right:4px">🔥 عميل جاد</span>'
      : '<span style="background:#f1f5f9;color:#475569;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:800;margin-right:4px">💬 استفسار</span>';
    return '<div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px; border:1px solid #e2e8f0; border-radius:12px;"><div><strong style="font-size:13px; color:#0f172a; display:block; margin-bottom:4px;">' + escapeHtml(chat.clientName || 'عميل') + '</strong>' + badge + '</div><button type="button" class="btn btn-primary btn-sm" onclick="openAdminChat(\'' + escapeHtml(id).replace(/'/g, "\\'") + '\')">فتح الدردشة</button></div>';
  }).join('');
}

function openAdminChat(id) {
  activeAdminChatId = id;
  document.getElementById('adminChatArea').style.display = 'block';
  const chat = allChats[id];
  const container = document.getElementById('adminChatMessages');
  document.getElementById('currentChatName').textContent = 'دردشة مع: ' + (chat && chat.clientName ? chat.clientName : 'عميل');
  updateDoc(doc(db, 'chats', id), { seenByAdmin: true }).catch(()=>{});
  stopTitleFlash();
  if (chat && chat.messages) {
    container.innerHTML = chat.messages.map((m, index) =>
      '<div class="chat-bubble ' + (m.sender === 'client' ? 'client' : 'admin') + '"><span>' + escapeHtml(m.text) + '</span>' +
      (m.sender === 'client' ? '<button type="button" onclick="deleteSingleMessage(\'' + escapeHtml(id).replace(/'/g, "\\'") + '\', ' + index + ')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:13px; margin-right:auto; opacity:0.8;">🗑</button>' : '') +
      '</div>'
    ).join('');
    container.scrollTop = container.scrollHeight;
  }
}

async function deleteSingleMessage(chatId, msgIndex) {
  if (!confirm('حذف هذه الرسالة؟')) return;
  try {
    const chatRef = doc(db, 'chats', chatId);
    const msgs = [...(allChats[chatId].messages || [])];
    msgs.splice(msgIndex, 1);
    await setDoc(chatRef, { messages: msgs }, { merge: true });
    showToast('تم الحذف ✓');
  } catch (err) { alert('❌ ' + err.message); }
}

async function clearChat() {
  if (!activeAdminChatId) return;
  if (!confirm('⚠️ مسح جميع الرسائل؟')) return;
  try { await setDoc(doc(db, 'chats', activeAdminChatId), { messages: [] }, { merge: true }); showToast('تم المسح ✓'); }
  catch (err) { alert('❌ ' + err.message); }
}

async function sendAdminMessage() {
  if (!activeAdminChatId) return;
  const input = document.getElementById('adminChatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  await pushAdminChatMessage(activeAdminChatId, text, 'admin');
}

async function sendQuickReply(text) {
  if (!activeAdminChatId) return;
  await pushAdminChatMessage(activeAdminChatId, text, 'admin');
  showToast('تم الإرسال ✓');
}

async function pushAdminChatMessage(chatId, text, sender) {
  const chatRef = doc(db, 'chats', chatId);
  try {
    const msgs = [...((allChats[chatId] && allChats[chatId].messages) || [])];
    msgs.push({ sender, text, time: new Date() });
    await setDoc(chatRef, { lastSender: sender, seenByAdmin: true, messages: msgs }, { merge: true });
  } catch (err) { alert('❌ ' + err.message); }
}

function tryOpenAdmin() {
  if (!hasEl('loginScreen')) { location.href = 'admin.html'; return; }
  if (isLoggedIn) { openAdmin(); return; }
  document.getElementById('loginScreen').classList.add('show');
  document.getElementById('adminEmailInput').value = '';
  document.getElementById('adminPasswordInput').value = '';
  document.getElementById('loginError').textContent = '';
  setTimeout(() => document.getElementById('adminEmailInput').focus(), 100);
}

async function doLogin() {
  const email = document.getElementById('adminEmailInput').value.trim();
  const password = document.getElementById('adminPasswordInput').value;
  document.getElementById('loginError').textContent = '';
  if (email.indexOf('@') === -1) { document.getElementById('loginError').textContent = '❌ أدخل بريدك الإلكتروني'; return; }
  if (!password) { document.getElementById('loginError').textContent = '❌ أدخل كلمة المرور'; return; }
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    if (userCred.user.email !== STORE_CONFIG.adminEmail) {
      await signOut(auth);
      await signInAnonymously(auth);
      document.getElementById('loginError').textContent = '❌ هذا الحساب ليس مديراً';
      return;
    }
    isLoggedIn = true;
    document.getElementById('loginScreen').classList.remove('show');
    startAdminListeners();
    openAdmin();
    showToast('مرحباً بك 👋');
  } catch (err) {
    document.getElementById('loginError').textContent = '❌ بيانات الدخول غير صحيحة';
  }
}

function cancelLogin() { goHome(); }
function openAdmin() { document.getElementById('adminPanel').classList.add('show'); renderProductList(); renderOrders(); renderAdminClientsList(); }

async function closeAdmin() {
  isLoggedIn = false;
  activeAdminChatId = null;
  stopAdminListeners();
  try { await signOut(auth); await signInAnonymously(auth); } catch (e) {}
  goHome();
}

function showAdminTab(name, btn) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-panel-view').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('admin-view-' + name).classList.add('active');
  if (name === 'orders') renderOrders();
  if (name === 'messages') renderAdminClientsList();
}

function renderProductList() {
  const c = document.getElementById('productList');
  const qEl = document.getElementById('adminProductSearch');
  const qText = qEl ? qEl.value.trim().toLowerCase() : '';
  const list = qText
    ? products.filter(p => (p.title || '').toLowerCase().includes(qText) || (p.category || '').toLowerCase().includes(qText))
    : products;
  document.getElementById('productCount').textContent = list.length;
  if (list.length === 0) { c.innerHTML = '<div class="empty">لا توجد منتجات</div>'; return; }
  c.innerHTML = list.map(p => {
    const firstImg = p.img ? escapeHtml(p.img.split(',')[0].trim()) : 'https://via.placeholder.com/100';
    const safeId = escapeHtml(p.id).replace(/'/g, "\\'");
    return '<div class="product-item">' +
      '<img src="' + firstImg + '" onerror="this.src=\'https://via.placeholder.com/100\'">' +
      '<div class="product-item-info"><div class="product-item-title">' + escapeHtml(p.title) + '</div><div class="product-item-meta">' + escapeHtml(p.category || '') + ' ' + (p.video ? '• 🎬 فيديو' : '') + '</div><div class="product-item-price">' + Number(p.price).toLocaleString() + ' ' + escapeHtml(settings.currency) + '</div></div>' +
      '<div class="product-item-actions" style="flex-direction:row;flex-wrap:wrap;justify-content:flex-end;">' +
        '<button type="button" class="btn btn-sm" style="background:#eff6ff;color:#2563eb;" onclick="copyProductLink(\'' + safeId + '\')" title="نسخ رابط المنتج المباشر">🔗</button>' +
        '<button type="button" class="btn btn-warning btn-sm" onclick="editProduct(\'' + safeId + '\')">✏️</button>' +
        '<button type="button" class="btn btn-danger btn-sm" onclick="deleteProduct(\'' + safeId + '\')">🗑</button>' +
      '</div></div>';
  }).join('');
}

async function saveProduct(e) {
  e.preventDefault();
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = '⏳...';
  const id = document.getElementById('editId').value;
  const data = {
    title: document.getElementById('pTitle').value.trim(),
    price: parseFloat(document.getElementById('pPrice').value),
    oldPrice: document.getElementById('pOldPrice').value ? parseFloat(document.getElementById('pOldPrice').value) : null,
    category: document.getElementById('pCategory').value,
    sizes: document.getElementById('pSizes').value.trim(),
    colors: document.getElementById('pColors').value.trim(),
    img: document.getElementById('pImg').value.trim(),
    video: document.getElementById('pVideo').value.trim(),
    desc: document.getElementById('pDesc').value.trim()
  };
  try {
    if (id) { await updateDoc(doc(db, 'products', id), data); showToast('تم التعديل ✓'); }
    else { data.createdAt = serverTimestamp(); await addDoc(collection(db, 'products'), data); showToast('تمت الإضافة ✓'); }
    resetForm();
    showAdminTab('products', document.querySelectorAll('.admin-tab')[0]);
  } catch (err) { alert('❌ ' + err.message); }
  btn.disabled = false;
  btn.textContent = '💾 حفظ المنتج';
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('editId').value = id;
  document.getElementById('pTitle').value = p.title;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pOldPrice').value = p.oldPrice || '';
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pSizes').value = p.sizes || '';
  document.getElementById('pColors').value = p.colors || '';
  document.getElementById('pImg').value = p.img || '';
  document.getElementById('pVideo').value = p.video || '';
  document.getElementById('pDesc').value = p.desc || '';
  document.getElementById('formTitle').textContent = '✏️ تعديل المنتج';
  document.getElementById('cancelBtn').classList.remove('hidden');
  previewImage();
  showAdminTab('add', document.querySelectorAll('.admin-tab')[3]);
}

async function deleteProduct(id) {
  if (!confirm('حذف المنتج؟')) return;
  try { await deleteDoc(doc(db, 'products', id)); showToast('تم الحذف'); }
  catch (err) { alert('❌ ' + err.message); }
}

function resetForm() {
  document.getElementById('editId').value = '';
  document.getElementById('pTitle').value = '';
  document.getElementById('pPrice').value = '';
  document.getElementById('pOldPrice').value = '';
  document.getElementById('pSizes').value = '';
  document.getElementById('pColors').value = '';
  document.getElementById('pImg').value = '';
  document.getElementById('pVideo').value = '';
  document.getElementById('pDesc').value = '';
  document.getElementById('imgPreview').classList.remove('show');
  document.getElementById('formTitle').textContent = '➕ إضافة منتج جديد';
  document.getElementById('cancelBtn').classList.add('hidden');
}

function renderOrders() {
  const c = document.getElementById('ordersList');
  const qEl = document.getElementById('adminOrderSearch');
  const qText = qEl ? qEl.value.trim().toLowerCase() : '';
  const filteredOrders = qText
    ? orders.filter(o =>
        (o.customer || '').toLowerCase().includes(qText) ||
        (o.phone || '').includes(qText) ||
        (o.wilaya || '').toLowerCase().includes(qText)
      )
    : orders;

  document.getElementById('ordersCount').textContent = filteredOrders.length;
  const newCount = orders.filter(o => o.status === 'new').length;
  document.getElementById('ordersBadge').innerHTML = newCount > 0
    ? '<span style="background:#ef4444;color:#fff;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:800;margin-right:4px">' + newCount + '</span>'
    : '';
  if (filteredOrders.length === 0) { c.innerHTML = '<div class="empty">لا توجد طلبات</div>'; return; }
  c.innerHTML = filteredOrders.map(o => {
    const date = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString('ar') : 'جديد';
    return '<div class="order-card">' +
      '<div class="order-header"><span class="order-id">#' + escapeHtml(String(o.id).slice(0, 8)) + '</span><span class="order-date">' + escapeHtml(date) + '</span></div>' +
      '<div class="order-customer">👤 <strong>' + escapeHtml(o.customer) + '</strong><br>📞 <a href="tel:' + escapeHtml(o.phone) + '" style="color:#1e40af;font-weight:800;">' + escapeHtml(o.phone) + '</a><br>📍 الولاية: ' + escapeHtml(o.wilaya || 'غير محدد') + ' (' + escapeHtml(o.shippingType || 'توصيل') + ')<br>🏠 العنوان: ' + escapeHtml(o.address) + '</div>' +
      '<div class="order-items">' + (o.items || []).map(i => {
        const details = [];
        if (i.size) details.push('مقاس: ' + escapeHtml(i.size));
        if (i.color) details.push('نوع/لون: ' + escapeHtml(i.color));
        return '<div class="order-item-row"><div><strong>' + escapeHtml(i.title) + ' × ' + Number(i.qty || 1) + '</strong>' + (details.length > 0 ? '<div style="font-size:11px;color:#2563eb;font-weight:bold;">' + details.join(' | ') + '</div>' : '') + '</div><span>' + (Number(i.price || 0) * Number(i.qty || 1)).toLocaleString() + ' ' + escapeHtml(settings.currency) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="order-total">المجموع الكلي: ' + Number(o.total || 0).toLocaleString() + ' ' + escapeHtml(settings.currency) + '</div>' +
      '<div class="order-actions">' +
        (o.status === 'new' ? '<button type="button" class="btn btn-sm" onclick="markOrderShipped(\'' + escapeHtml(o.id).replace(/'/g, "\\'") + '\')" style="flex:1; background:#2563eb; color:white;">📦 قبول وشحن</button>' : '') +
        (o.status === 'shipped' ? '<button type="button" class="btn btn-success btn-sm" onclick="markOrderDone(\'' + escapeHtml(o.id).replace(/'/g, "\\'") + '\')" style="flex:1;">✓ تم التسليم</button>' : '') +
        (o.status === 'done' ? '<span class="order-badge badge-done">✓ مكتمل</span>' : '') +
        '<button type="button" class="btn btn-danger btn-sm" onclick="deleteOrder(\'' + escapeHtml(o.id).replace(/'/g, "\\'") + '\')">🗑</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function exportOrdersCSV() {
  if (orders.length === 0) { showToast('لا توجد طلبات للتصدير'); return; }
  const headers = ['رقم الطلب', 'الاسم الكامل', 'الهاتف', 'الولاية', 'نوع التوصيل', 'العنوان', 'المنتجات', 'المبلغ الإجمالي', 'الحالة'];
  const rows = orders.map(o => {
    const itemsStr = (o.items || []).map(i => `${i.title} (x${i.qty})`).join(' + ');
    const statusMap = { new: 'جديد', shipped: 'قيد الشحن', done: 'مكتمل' };
    return [
      o.id.slice(0, 8),
      o.customer || '',
      o.phone || '',
      o.wilaya || '',
      o.shippingType || '',
      (o.address || '').replace(/[\r\n]+/g, ' '),
      itemsStr,
      o.total || 0,
      statusMap[o.status] || o.status
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });
  const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'MAKAM_Orders_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('تم تحميل ملف الطلبات ✓');
}

async function markOrderShipped(id) { try { await updateDoc(doc(db, 'orders', id), { status: 'shipped' }); showToast('تم القبول ✓'); } catch (err) { alert('❌ ' + err.message); } }
async function markOrderDone(id) { try { await updateDoc(doc(db, 'orders', id), { status: 'done' }); showToast('تم التسليم ✓'); } catch (err) { alert('❌ ' + err.message); } }
async function deleteOrder(id) { if (!confirm('حذف الطلب؟')) return; try { await deleteDoc(doc(db, 'orders', id)); showToast('تم الحذف'); } catch (err) { alert('❌ ' + err.message); } }

function previewImage() {
  const url = document.getElementById('pImg').value.trim();
  const pv = document.getElementById('imgPreview');
  const firstUrl = url.split(',')[0].trim();
  if (firstUrl) { pv.src = firstUrl; pv.classList.add('show'); }
  else pv.classList.remove('show');
}

async function saveSettings() {
  const data = {
    storeName: document.getElementById('sStoreName').value.trim() || STORE_CONFIG.defaultStoreName,
    promoBanner: document.getElementById('sPromoBanner').value.trim(),
    currency: document.getElementById('sCurrency').value.trim() || 'دج',
    phone: document.getElementById('sPhone').value.trim(),
    blockedWilayas: document.getElementById('sBlockedWilayas').value.trim(),
    categories: settings.categories
  };
  try {
    if (settings._docId) await updateDoc(doc(db, 'settings', settings._docId), data);
    else { const ref = await addDoc(collection(db, 'settings'), data); settings._docId = ref.id; }
    settings = { ...settings, ...data };
    applySettings();
    showToast('تم الحفظ ✓');
  } catch (err) { alert('❌ ' + err.message); }
}

async function saveAutoReply() {
  const data = { autoReplyEnabled: document.getElementById('sAutoReplyEnabled').checked, autoReplyText: document.getElementById('sAutoReplyText').value.trim() };
  try {
    if (settings._docId) await updateDoc(doc(db, 'settings', settings._docId), data);
    else { const ref = await addDoc(collection(db, 'settings'), data); settings._docId = ref.id; }
    settings = { ...settings, ...data };
    showToast('تم حفظ الإعدادات ✓');
  } catch (err) { alert('❌ ' + err.message); }
}

function renderCategoriesAdmin() {
  const c = document.getElementById('categoryList');
  const cats = settings.categories.filter(c => c !== 'الكل');
  if (cats.length === 0) { c.innerHTML = '<div class="empty" style="padding:10px">لا توجد فئات</div>'; return; }
  c.innerHTML = cats.map(cat => '<span class="category-chip">' + escapeHtml(cat) + '<button type="button" onclick="deleteCategory(\'' + escapeHtml(cat).replace(/'/g, "\\'") + '\')">×</button></span>').join('');
}

async function addCategory() {
  const input = document.getElementById('newCategory');
  const name = input.value.trim();
  if (!name || name === 'الكل') return;
  if (settings.categories.includes(name)) { showToast('الفئة موجودة مسبقاً'); return; }
  settings.categories.push(name);
  input.value = '';
  await saveSettings();
  renderCategoriesAdmin();
  fillCategorySelect();
}

async function deleteCategory(cat) {
  if (!confirm('حذف الفئة؟')) return;
  settings.categories = settings.categories.filter(c => c !== cat);
  await saveSettings();
  renderCategoriesAdmin();
  fillCategorySelect();
}

function fillCategorySelect() {
  const sel = document.getElementById('pCategory');
  const cur = sel.value;
  const cats = settings.categories.filter(c => c !== 'الكل');
  sel.innerHTML = cats.map(c => '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>').join('');
  if (cur && cats.includes(cur)) sel.value = cur;
}

let logoClicks = 0;
let logoTimer = null;
document.getElementById('storeName').addEventListener('click', () => {
  logoClicks++;
  clearTimeout(logoTimer);
  logoTimer = setTimeout(() => { logoClicks = 0; }, 2000);
  if (logoClicks === 5) { logoClicks = 0; tryOpenAdmin(); }
});

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function startSocialProof() {
  const names = ['أمين', 'ياسين', 'محمد', 'سفيان', 'كريم', 'بلال', 'هشام', 'طارق', 'رضا', 'وليد'];
  const wilayas = ['الجزائر العاصمة', 'وهران', 'سطيف', 'قسنطينة', 'باتنة', 'بجاية', 'تيزي وزو', 'البليدة', 'عنابة', 'ورقلة'];
  setInterval(() => {
    if (products.length === 0 || document.querySelector('.modal.show')) return;
    const p = products[Math.floor(Math.random() * products.length)];
    const n = names[Math.floor(Math.random() * names.length)];
    const w = wilayas[Math.floor(Math.random() * wilayas.length)];
    const el = document.getElementById('socialProofToast');
    if (!el) return;
    el.innerHTML = '✅ <strong>' + escapeHtml(n) + '</strong> من <strong>' + escapeHtml(w) + '</strong> طلب للتو:<br><span style="color:var(--primary);font-weight:800;">' + escapeHtml((p.title || '').slice(0, 28)) + '...</span>';
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4500);
  }, 18000);
}

Object.assign(window, {
  toggleTheme, addToCart, quickAddCard, removeFromCart, changeQty, openCart, closeCart, renderCart, showCheckout, submitOrder,
  submitExpressOrder, updateExpressShipping, copyProductLink, copyCurrentProductLink,
  showHome, showContact, filterProducts, filterCategory, openProductModal, closeProductModal, addToCartFromModal,
  selectSize, selectColorOption, changeMainImage, setPresetSizes, openFullVideo, closeInlineVideo, toggleProductVideo,
  openMyOrders, closeMyOrders, openClientChat, closeClientChat, sendClientMessage, openAdminChat, sendAdminMessage,
  deleteSingleMessage, clearChat, saveAutoReply, sendQuickReply,
  tryOpenAdmin, doLogin, cancelLogin, openAdmin, closeAdmin, showAdminTab,
  saveProduct, editProduct, deleteProduct, resetForm, renderProductList,
  previewImage, saveSettings, addCategory, deleteCategory,
  markOrderDone, markOrderShipped, deleteOrder, renderOrders, exportOrdersCSV, updateShippingCost
});


function renderContactPage() {
  const ph = (settings.phone || '').replace(/[^0-9]/g, '');
  const call = document.getElementById('contactCall');
  const wa = document.getElementById('contactWa');
  const num = document.getElementById('contactNumber');
  if (call) { call.href = 'tel:+' + ph; }
  if (wa) { wa.href = 'https://wa.me/' + ph + '?text=' + encodeURIComponent('مرحباً، أريد الاستفسار عن منتجات المتجر'); }
  if (num) { num.textContent = '+' + ph; }
}

async function runPage() {
  if (PAGE === 'cart') openCart();
  else if (PAGE === 'orders') openMyOrders();
  else if (PAGE === 'chat') openClientChat();
  else if (PAGE === 'contact') renderContactPage();
  else if (PAGE === 'admin') tryOpenAdmin();
  else if (PAGE === 'product') {
    setTimeout(() => {
      if (!document.querySelector('#productModal.loaded')) {
        const m = document.getElementById('pModalTitle');
        if (!currentProductId && products.length > 0) m.textContent = 'المنتج غير موجود';
      }
    }, 6000);
  }
}

async function init() {
  initTheme();
  updateCartCount();
  await checkVisitorRegion();
  await startAnonymousAuth();
  await loadSettings();
  listenProducts();
  updateClientOrdersCount();
  if (PAGE === 'home') startSocialProof();
  await runPage();
}

init();
})();
