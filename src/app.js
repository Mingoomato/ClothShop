/**
 * Vindt Shop - Vintage Shop Application
 */

if (window.location.protocol === 'file:') {
    alert('Error: modules cannot run via file:// protocol. Please deploy to Firebase or use a local server (npx serve).');
}

// import { PRODUCTS as STATIC_PRODUCTS } from "./products.js"; // Removed static data dependency
import { listenForProductUpdates } from "./firebase-client.js";
import { paymentConfig } from "./config/paymentConfig.js";

// STATE
const safeParse = (key, fallback) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.warn(`Error parsing ${key} from localStorage:`, e);
        return fallback;
    }
};

const state = {
    cart: safeParse('vindteok_cart', []),
    wishlist: safeParse('vindteok_wishlist', []),
    recentlyViewed: safeParse('vindteok_recent', []),
    currentFilter: 'all',
    currentSubFilter: 'all',
    currentSort: 'newest',
    visibleProducts: 8,
    searchQuery: '',
    gridCols: 2,
    currentLang: localStorage.getItem('vindteok_lang') || 'ko',
    user: safeParse('vindteok_user', null),
    // Combine static and dynamic products. Initial state is static only.
    allProducts: [] // Was [...STATIC_PRODUCTS]
};

const getKakaoRedirectUri = () => paymentConfig.kakao.redirectUri;

/**
 * Cleans the URL by removing search parameters and hashes (OAuth tokens)
 * without refreshing the page.
 */
function cleanUrl() {
    if (window.history.replaceState) {
        // This removes both query params (?...) and fragments (#...)
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // Fallback for older browsers
        window.location.hash = "";
    }
}


// Naver Login Placeholder
let naverLogin = null;



// DOM ELEMENTS
const DOM = {};

function cacheDom() {
    DOM.hamburger = document.querySelector('.hamburger');
    DOM.navOverlay = document.querySelector('.nav-overlay');
    DOM.cartIcon = document.querySelector('.cart-icon');
    DOM.cartCount = document.querySelector('.cart-count');
    DOM.wishlistIcon = document.querySelector('.wishlist-icon');
    DOM.wishlistCount = document.querySelector('.wishlist-count');
    DOM.searchIcon = document.querySelector('.search-icon');
    DOM.loginIcon = document.querySelector('.login-icon');
    DOM.header = document.querySelector('.header');
    DOM.productsGrid = document.querySelector('.products__grid');
    DOM.loadMoreBtn = document.querySelector('.load-more__btn');
    DOM.filterTabs = document.querySelectorAll('.filter-tab');
    DOM.subcategoryTabs = document.querySelector('.subcategory-tabs');
    DOM.sortSelect = document.querySelector('.sort-select');
    DOM.viewBtns = document.querySelectorAll('.view-btn');
    DOM.modalOverlay = document.querySelector('.modal-overlay');
    DOM.modalContent = document.querySelector('.modal');
    DOM.cartDrawer = document.querySelector('.cart-drawer');
    DOM.cartBackdrop = document.querySelector('.cart-drawer__backdrop');
    DOM.cartItems = document.querySelector('.cart-drawer__items');
    DOM.cartTotal = document.querySelector('.cart-total');
    DOM.cartCloseBtn = document.querySelector('.cart-drawer__close');
    DOM.wishlistDrawer = document.querySelector('.wishlist-drawer');
    DOM.wishlistBackdrop = document.querySelector('.wishlist-drawer__backdrop');
    DOM.wishlistItems = document.querySelector('.wishlist-drawer__items');
    DOM.wishlistCloseBtn = document.querySelector('.wishlist-drawer__close');
    DOM.searchOverlay = document.querySelector('.search-overlay');
    DOM.searchInput = document.querySelector('.search-overlay__input');
    DOM.searchResults = document.querySelector('.search-overlay__results');
    DOM.searchCloseBtn = document.querySelector('.search-overlay__close');
    DOM.loginModalOverlay = document.querySelector('.login-modal-overlay');
    DOM.loginModalClose = document.querySelector('.login-modal__close');
    DOM.mypageModalOverlay = document.querySelector('.mypage-modal-overlay');
    DOM.mypageModalClose = document.querySelector('.mypage-modal__close');
    DOM.recentProducts = document.querySelector('.recent-products');
    DOM.bottomNav = document.querySelector('.bottom-nav');
    DOM.boardModalOverlay = document.querySelector('.board-modal-overlay');
    DOM.boardModalClose = document.querySelector('.board-modal__close');
    DOM.boardModalTitle = document.querySelector('.board-modal__title');
    DOM.boardList = document.querySelector('.board-list');
    DOM.boardDetail = document.querySelector('.board-detail');
    DOM.checkoutModalOverlay = document.querySelector('.checkout-modal-overlay');
    DOM.checkoutModalClose = document.querySelector('.checkout-modal__close');
    DOM.checkoutItems = document.querySelector('.checkout-items');
    DOM.checkoutSubtotal = document.querySelector('.checkout-subtotal');
    DOM.checkoutFinalTotal = document.querySelector('.checkout-final-total');
    DOM.placeOrderBtn = document.querySelector('.place-order-btn');
    DOM.orderConfirmationOverlay = document.querySelector('.order-confirmation-overlay');
    DOM.orderConfirmationBtn = document.querySelector('.order-confirmation__btn');
    DOM.orderNumber = document.querySelector('.order-number');
}

// UTILITIES
function formatPrice(price) {
    return '₩' + price.toLocaleString('ko-KR');
}

function saveCart() {
    localStorage.setItem('vindteok_cart', JSON.stringify(state.cart));
}

function saveWishlist() {
    localStorage.setItem('vindteok_wishlist', JSON.stringify(state.wishlist));
}

function saveRecentlyViewed() {
    localStorage.setItem('vindteok_recent', JSON.stringify(state.recentlyViewed));
}

function addToRecentlyViewed(product) {
    state.recentlyViewed = state.recentlyViewed.filter(p => p.id !== product.id);
    state.recentlyViewed.unshift(product);
    if (state.recentlyViewed.length > 10) state.recentlyViewed.pop();
    saveRecentlyViewed();
    renderRecentlyViewed();
}

function getFilteredProducts() {
    // USE state.allProducts instead of constant PRODUCTS
    let products = [...state.allProducts];

    if (state.currentFilter !== 'all') {
        if (state.currentFilter === 'premium') {
            products = products.filter(p => p.badge === 'premium');
        } else if (state.currentFilter === 'sale') {
            products = products.filter(p => p.originalPrice !== null);
        } else {
            products = products.filter(p => p.category === state.currentFilter);
        }
    }
    if (state.currentSubFilter !== 'all') {
        products = products.filter(p =>
            p.gender === state.currentSubFilter ||
            p.subCategory === state.currentSubFilter
        );
    }
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        products = products.filter(p =>
            p.title.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }
    if (state.currentSort === 'price-low') {
        products.sort((a, b) => a.price - b.price);
    } else if (state.currentSort === 'price-high') {
        products.sort((a, b) => b.price - a.price);
    } else if (state.currentSort === 'discount') {
        products.sort((a, b) => {
            const discA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
            const discB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
            return discB - discA;
        });
    } else if (state.currentSort === 'newest') {
        // Assume default order
    }
    return products;
}

function getDiscountPercent(product) {
    if (!product.originalPrice) return 0;
    return Math.round((1 - product.price / product.originalPrice) * 100);
}

// RENDER
function renderProductCard(product, showWishlist = true) {
    let badge = '';
    if (product.soldOut) {
        badge = '<span class="product-card__badge product-card__badge--sold-out">Sold Out</span>';
    } else if (product.badge === 'premium') {
        badge = '<span class="product-card__badge product-card__badge--premium">Premium</span>';
    } else if (product.isNew) {
        badge = '<span class="product-card__badge product-card__badge--new">New</span>';
    }

    const discount = getDiscountPercent(product);
    const discountBadge = discount > 0 ? `<span class="product-card__discount">${discount}%</span>` : '';

    const origPrice = product.originalPrice
        ? `<span class="product-card__price--original">${formatPrice(product.originalPrice)}</span>`
        : '';

    // Stock Display
    const stockDisplay = (product.stock !== undefined && product.stock !== null)
        ? (product.stock > 0 ? `<span style="font-size:0.8rem; color:#666; margin-left:6px;">/ Left: ${product.stock}</span>` : '<span style="font-size:0.8rem; color:#e74c3c; margin-left:6px;">/ Sold Out</span>')
        : '';

    const actionButtons = showWishlist ? `
            <div class="nd-area-btn">
                <span class="wish" data-product-id="${product.id}" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </span>
                <span class="cart" data-product-id="${product.id}" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                </span>
            </div>
        ` : '';

    return `
            <article class="product-card" data-product-id="${product.id}">
                <div class="product-card__image-wrapper">
                    ${badge}
                    ${actionButtons}
                    ${discountBadge}
                    <img src="${product.image}" alt="${product.title}" class="product-card__image" loading="lazy">
                </div>
                <div class="product-card__info">
                    <span class="product-card__brand">${product.category}</span>
                    <h3 class="product-card__title">${product.title}</h3>
                    <div class="product-card__price-row">
                        <span class="product-card__price">${formatPrice(product.price)}</span>
                        ${origPrice}
                        ${stockDisplay}
                    </div>
                </div>
            </article>
        `;
}

function renderProducts() {
    const products = getFilteredProducts().slice(0, state.visibleProducts);
    if (DOM.productsGrid) {
        DOM.productsGrid.innerHTML = products.map(p => renderProductCard(p)).join('');
        DOM.productsGrid.className = `products__grid cols-${state.gridCols}`;
        attachProductClickHandlers();
        attachWishlistHandlers();
    }
    if (DOM.loadMoreBtn) {
        DOM.loadMoreBtn.style.display = state.visibleProducts >= getFilteredProducts().length ? 'none' : 'block';
    }
}

function renderModal(product) {
    const rows = product.measurements ? Object.entries(product.measurements)
        .map(([k, v]) => `<tr><th>${k.charAt(0).toUpperCase() + k.slice(1)}</th><td>${v}</td></tr>`).join('') : '';

    // Check if ID matches (handle string vs number)
    const isWishlisted = state.wishlist.some(w => String(w.id) === String(product.id));

    DOM.modalContent.innerHTML = `
            <button class="modal__close">&times;</button>
            <div class="modal__content">
                <div class="modal__gallery"><img src="${product.image}" alt="${product.title}" class="modal__image"></div>
                <div class="modal__details">
                    <span class="modal__category">${product.category}</span>
                    <h2 class="modal__title">${product.title}</h2>
                    <p class="modal__price">${formatPrice(product.price)}</p>
                    <p class="modal__description">${product.description || ''}</p>
                    <table class="size-table"><tbody>${rows}</tbody></table>
                    <div style="display: flex; gap: 8px;">
                        <button class="add-to-wishlist" data-product-id="${product.id}" style="flex:1; padding:16px; border:1px solid #333; background:${isWishlisted ? '#A52A2A' : 'transparent'}; color:${isWishlisted ? 'white' : '#333'}; cursor:pointer;">
                            ${isWishlisted ? '♥ Wishlisted' : '♡ Wishlist'}
                        </button>
                        <button class="add-to-cart" data-product-id="${product.id}" ${product.soldOut ? 'disabled' : ''} style="flex:2;">
                            ${product.soldOut ? 'Sold Out' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    DOM.modalContent.querySelector('.modal__close').addEventListener('click', closeModal);
    const cartBtn = DOM.modalContent.querySelector('.add-to-cart');
    if (cartBtn && !product.soldOut) cartBtn.addEventListener('click', () => addToCart(product));
    const wishBtn = DOM.modalContent.querySelector('.add-to-wishlist');
    if (wishBtn) wishBtn.addEventListener('click', () => {
        toggleWishlist(product);
        renderModal(product);
    });
}

function renderCart() {
    if (!DOM.cartItems) return;
    if (state.cart.length === 0) {
        DOM.cartItems.innerHTML = '<div class="cart-empty"><p>Your cart is empty</p></div>';
        if (DOM.cartTotal) DOM.cartTotal.textContent = formatPrice(0);
        return;
    }
    DOM.cartItems.innerHTML = state.cart.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.image}" alt="${item.title}" class="cart-item__image">
                <div class="cart-item__info">
                    <h4 class="cart-item__title">${item.title}</h4>
                    <p class="cart-item__price">${formatPrice(item.price)}</p>
                    <button class="cart-item__remove" data-product-id="${item.id}">Remove</button>
                </div>
            </div>
        `).join('');
    const total = state.cart.reduce((s, i) => s + i.price, 0);
    if (DOM.cartTotal) DOM.cartTotal.textContent = formatPrice(total);
    DOM.cartItems.querySelectorAll('.cart-item__remove').forEach(b => {
        b.addEventListener('click', e => removeFromCart(e.target.dataset.productId));
    });
}

function renderWishlist() {
    if (!DOM.wishlistItems) return;
    if (state.wishlist.length === 0) {
        DOM.wishlistItems.innerHTML = '<div class="cart-empty"><p>Your wishlist is empty</p></div>';
        return;
    }
    DOM.wishlistItems.innerHTML = state.wishlist.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.image}" alt="${item.title}" class="cart-item__image">
                <div class="cart-item__info">
                    <h4 class="cart-item__title">${item.title}</h4>
                    <p class="cart-item__price">${formatPrice(item.price)}</p>
                    <button class="cart-item__remove" data-product-id="${item.id}">Remove</button>
                </div>
            </div>
        `).join('');
    DOM.wishlistItems.querySelectorAll('.cart-item__remove').forEach(b => {
        b.addEventListener('click', e => {
            const id = e.target.dataset.productId;
            state.wishlist = state.wishlist.filter(i => String(i.id) !== String(id));
            saveWishlist();
            updateWishlistCount();
            renderWishlist();
            renderProducts();
        });
    });
}

function renderRecentlyViewed() {
    if (!DOM.recentProducts) return;
    if (state.recentlyViewed.length === 0) {
        DOM.recentProducts.innerHTML = '<p class="recent-empty">No recently viewed items</p>';
        return;
    }
    DOM.recentProducts.innerHTML = state.recentlyViewed.slice(0, 6).map(p => renderProductCard(p, false)).join('');
    DOM.recentProducts.querySelectorAll('.product-card').forEach(c => {
        c.addEventListener('click', () => {
            const p = state.allProducts.find(x => String(x.id) === String(c.dataset.productId));
            if (p) openModal(p);
        });
    });
}

function updateCartCount() {
    if (DOM.cartCount) {
        DOM.cartCount.textContent = state.cart.length;
        DOM.cartCount.style.display = state.cart.length > 0 ? 'flex' : 'none';

        if (DOM.cartIcon) {
            if (state.cart.length > 0) {
                DOM.cartIcon.classList.add('has-count');
            } else {
                DOM.cartIcon.classList.remove('has-count');
            }
        }
    }
}

function updateWishlistCount() {
    if (DOM.wishlistCount) {
        DOM.wishlistCount.textContent = state.wishlist.length;
        DOM.wishlistCount.style.display = state.wishlist.length > 0 ? 'flex' : 'none';

        if (DOM.wishlistIcon) {
            if (state.wishlist.length > 0) {
                DOM.wishlistIcon.classList.add('has-count');
            } else {
                DOM.wishlistIcon.classList.remove('has-count');
            }
        }
    }
    const menuCount = document.querySelector('.wishlist-menu-count');
    if (menuCount) menuCount.textContent = state.wishlist.length;
}

// CART & WISHLIST
function addToCart(product) {
    if (state.cart.find(i => String(i.id) === String(product.id))) return;
    state.cart.push({ id: product.id, title: product.title, price: product.price, image: product.image });
    saveCart(); updateCartCount(); renderCart(); closeModal();
    if (DOM.cartIcon) {
        DOM.cartIcon.classList.add('bounce');
        setTimeout(() => DOM.cartIcon.classList.remove('bounce'), 500);
    }
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(i => String(i.id) !== String(productId));
    saveCart(); updateCartCount(); renderCart();
}

function toggleWishlist(product) {
    const exists = state.wishlist.find(i => String(i.id) === String(product.id));
    if (exists) {
        state.wishlist = state.wishlist.filter(i => String(i.id) !== String(product.id));
    } else {
        state.wishlist.push({ id: product.id, title: product.title, price: product.price, image: product.image });
        const btn = document.querySelector(`.product-card__wishlist[data-product-id="${product.id}"]`);
        if (btn) {
            btn.classList.add('animating');
            setTimeout(() => btn.classList.remove('animating'), 400);
        }
    }
    saveWishlist();
    updateWishlistCount();
    renderProducts();
}

// UI
function openModal(product) { addToRecentlyViewed(product); renderModal(product); DOM.modalOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeModal() { DOM.modalOverlay.classList.remove('active'); document.body.style.overflow = ''; }
function openCart() { renderCart(); DOM.cartDrawer.classList.add('active'); DOM.cartBackdrop.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeCart() { DOM.cartDrawer.classList.remove('active'); DOM.cartBackdrop.classList.remove('active'); document.body.style.overflow = ''; }
function openWishlist() { renderWishlist(); DOM.wishlistDrawer.classList.add('active'); DOM.wishlistBackdrop.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeWishlist() { DOM.wishlistDrawer.classList.remove('active'); DOM.wishlistBackdrop.classList.remove('active'); document.body.style.overflow = ''; }
function openSearch() { DOM.searchOverlay.classList.add('active'); DOM.searchInput.focus(); document.body.style.overflow = 'hidden'; }
function closeSearch() { DOM.searchOverlay.classList.remove('active'); state.searchQuery = ''; DOM.searchInput.value = ''; document.body.style.overflow = ''; }
function openLogin() { DOM.loginModalOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeLogin() { DOM.loginModalOverlay.classList.remove('active'); document.body.style.overflow = ''; }

function openMyPage() {
    if (!state.user) {
        openLogin();
        return;
    }
    const title = DOM.mypageModalOverlay.querySelector('.mypage-modal__title');
    if (title) title.textContent = `My Page (${state.user.name})`;
    DOM.mypageModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Explicitly re-attach logout handler if needed or check if DOM is fresh
    // The init handler logic is sufficient usually.
}
function closeMyPage() { DOM.mypageModalOverlay.classList.remove('active'); document.body.style.overflow = ''; }
function toggleNav() { DOM.hamburger.classList.toggle('active'); DOM.navOverlay.classList.toggle('active'); document.body.style.overflow = DOM.navOverlay.classList.contains('active') ? 'hidden' : ''; }

function attachProductClickHandlers() {
    document.querySelectorAll('.products__grid .product-card').forEach(c => {
        c.addEventListener('click', (e) => {
            if (e.target.closest('.nd-area-btn')) return;
            const p = state.allProducts.find(x => String(x.id) === String(c.dataset.productId));
            if (p) openModal(p);
        });
    });
}

function attachWishlistHandlers() {
    document.querySelectorAll('.nd-area-btn .wish').forEach(btn => {
        const productId = btn.dataset.productId;
        const product = state.allProducts.find(p => String(p.id) === String(productId));

        // Add active class if already in wishlist
        if (product && state.wishlist.some(w => String(w.id) === String(product.id))) {
            btn.classList.add('active');
        }

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!state.user) {
                openLogin();
                return;
            }
            if (product) {
                toggleWishlist(product);
            }
        });
    });

    document.querySelectorAll('.nd-area-btn .cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            const product = state.allProducts.find(p => String(p.id) === String(productId));
            if (product && !product.soldOut) {
                addToCart(product);
            } else if (product && product.soldOut) {
                alert('This item is sold out!');
            }
        });
    });
}

// RIPPLE EFFECT SYSTEM
function createRipple(e) {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// CHECKOUT FUNCTIONS
function openCheckout() {
    if (state.cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    // Redirect to the dedicated checkout page with NicePay integration
    window.location.href = '/checkout.html';
}
function closeCheckout() { DOM.checkoutModalOverlay.classList.remove('active'); document.body.style.overflow = ''; }
function renderCheckoutItems() {
    const shippingCost = 3000;
    const subtotal = state.cart.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal + shippingCost;
    DOM.checkoutItems.innerHTML = state.cart.map(item => `
        <div class="checkout-item">
            <img src="${item.image}" alt="${item.title}" class="checkout-item__image">
            <div class="checkout-item__details">
                <div class="checkout-item__title">${item.title}</div>
                <div class="checkout-item__meta">Size: ${item.size || 'M'}</div>
            </div>
            <div class="checkout-item__price">${formatPrice(item.price)}</div>
        </div>
    `).join('');
    DOM.checkoutSubtotal.textContent = formatPrice(subtotal);
    DOM.checkoutFinalTotal.textContent = formatPrice(total);
}
function validateCheckoutForm() {
    const name = document.getElementById('checkout-name').value.trim();
    const email = document.getElementById('checkout-email').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();
    const address = document.getElementById('checkout-address').value.trim();
    if (!name || !email || !phone || !address) {
        alert('Please fill all required fields!');
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address!');
        return false;
    }
    return true;
}
function placeOrder() {
    if (!validateCheckoutForm()) return;
    const orderNumber = '#VDT' + Date.now().toString().slice(-6);
    DOM.orderNumber.textContent = orderNumber;
    closeCheckout();
    setTimeout(() => {
        DOM.orderConfirmationOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }, 300);
    state.cart = [];
    saveCart();
    updateCartCount();
    renderCart();
}
function closeOrderConfirmation() {
    DOM.orderConfirmationOverlay.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('checkout-name').value = '';
    document.getElementById('checkout-email').value = '';
    document.getElementById('checkout-phone').value = '';
    document.getElementById('checkout-address').value = '';
    document.getElementById('checkout-notes').value = '';
}

// BOARD FUNCTIONS
let currentBoardType = null;
function openBoard(boardType) {
    currentBoardType = boardType;
    const titles = { notice: 'Notice', review: 'Review', qna: 'Q&A' };
    DOM.boardModalTitle.textContent = titles[boardType];
    renderBoardList(boardType);
    DOM.boardList.style.display = 'flex';
    DOM.boardDetail.style.display = 'none';
    DOM.boardModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeBoard() { DOM.boardModalOverlay.classList.remove('active'); document.body.style.overflow = ''; currentBoardType = null; }
function renderBoardList(boardType) {
    if (typeof getBoardData !== 'function') return;
    const data = getBoardData(boardType);
    if (!data || !data.length) {
        DOM.boardList.innerHTML = '<p style="text-align:center;color:#999;">No items yet.</p>';
        return;
    }
    DOM.boardList.innerHTML = data.map(item => {
        if (boardType === 'notice') {
            return `
                    <div class="board-item" data-id="${item.id}">
                        <div class="board-item__header">
                            <div class="board-item__title">
                                ${item.pinned ? '<span class="board-item__badge board-item__badge--pinned">📌 Pinned</span>' : ''}
                                ${item.title}
                            </div>
                        </div>
                        <div class="board-item__meta">
                            <span>${item.date}</span>
                            <span>Views: ${item.views}</span>
                            <span>${item.author}</span>
                        </div>
                    </div>
                `;
        } else if (boardType === 'review') {
            const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
            return `
                    <div class="board-item" data-id="${item.id}">
                        <div class="board-item__header">
                            <div class="board-item__title">
                                ${item.title || item.productTitle}
                                ${item.verified ? '<span class="board-item__badge">✓ Verified</span>' : ''}
                            </div>
                            <span class="board-item__rating">${stars}</span>
                        </div>
                        <div class="board-item__meta">
                            <span>${item.date}</span>
                            <span>${item.author}</span>
                            <span>👍 ${item.helpful}</span>
                        </div>
                    </div>
                `;
        } else if (boardType === 'qna') {
            const statusBadge = item.status === '답변완료'
                ? '<span class="board-item__badge board-item__badge--answered">답변완료</span>'
                : '<span class="board-item__badge board-item__badge--waiting">답변대기</span>';
            return `
                    <div class="board-item" data-id="${item.id}">
                        <div class="board-item__header">
                            <div class="board-item__title">
                                ${item.secret ? '🔒 ' : ''}${item.question}
                                ${statusBadge}
                            </div>
                        </div>
                        <div class="board-item__meta">
                            <span>${item.date}</span>
                            <span>${item.author}</span>
                            ${item.productTitle ? `<span>Product: ${item.productTitle}</span>` : ''}
                        </div>
                    </div>
                `;
        }
    }).join('');
    DOM.boardList.querySelectorAll('.board-item').forEach(item => {
        item.addEventListener('click', () => { renderBoardDetail(boardType, parseInt(item.dataset.id)); });
    });
}
function renderBoardDetail(boardType, id) {
    if (typeof getBoardItem !== 'function') return;
    const item = getBoardItem(boardType, id);
    if (!item) return;
    let html = '';
    if (boardType === 'notice') {
        html = `
                <div class="board-detail__header">
                    <h3 class="board-detail__title">${item.title}</h3>
                    <div class="board-detail__meta">
                        <span>${item.date}</span>
                        <span>${item.author}</span>
                        <span>Views: ${item.views}</span>
                    </div>
                </div>
                <div class="board-detail__content">${item.content}</div>
                <button class="board-detail__back">← Back to List</button>
            `;
    } else if (boardType === 'review') {
        const stars = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
        html = `
                <div class="board-detail__header">
                    <h3 class="board-detail__title">${item.title || item.productTitle}</h3>
                    <div class="board-detail__meta">
                        <span class="board-item__rating">${stars}</span>
                        <span>${item.date}</span>
                        <span>${item.author}</span>
                        ${item.verified ? '<span>✓ Verified Purchase</span>' : ''}
                    </div>
                </div>
                <div class="board-detail__content">${item.content}</div>
                <p style="color:#999;font-size:0.9rem;">👍 ${item.helpful} people found this helpful</p>
                <button class="board-detail__back">← Back to List</button>
            `;
    } else if (boardType === 'qna') {
        html = `
                <div class="board-detail__header">
                    <h3 class="board-detail__title">${item.question}</h3>
                    <div class="board-detail__meta">
                        <span>${item.date}</span>
                        <span>${item.author}</span>
                        ${item.productTitle ? `<span>Product: ${item.productTitle}</span>` : ''}
                    </div>
                </div>
                <div class="board-detail__content">${item.secret ? '비밀글입니다.' : item.question}</div>
                ${item.answer ? `
                    <div class="board-detail__answer">
                        <div class="board-detail__answer-label">관리자 답변 (${item.answerDate})</div>
                        <div>${item.answer}</div>
                    </div>
                ` : '<p style="color:#999;">답변 대기 중입니다.</p>'}
                <button class="board-detail__back">← Back to List</button>
            `;
    }
    DOM.boardDetail.innerHTML = html;
    DOM.boardList.style.display = 'none';
    DOM.boardDetail.style.display = 'block';
    DOM.boardDetail.querySelector('.board-detail__back').addEventListener('click', () => {
        DOM.boardList.style.display = 'flex';
        DOM.boardDetail.style.display = 'none';
    });
}

// LOGIN & USER FUNCTIONS
function handleLoginSuccess(userProfile) {
    console.log("Login success triggered with profile:", userProfile);
    state.user = {
        id: userProfile.id,
        name: userProfile.name || userProfile.nickname || 'User',
        email: userProfile.email,
        image: userProfile.profile_image
    };
    try {
        localStorage.setItem('vindteok_user', JSON.stringify(state.user));
        console.log("User session saved to localStorage");
    } catch (e) {
        console.error("Failed to save user to localStorage", e);
    }
    updateHeaderUser();
    closeLogin();
}

function handleLogout() {
    try {
        state.user = null;
        state.cart = [];
        state.wishlist = [];
        state.recentlyViewed = [];

        localStorage.removeItem('vindteok_user');
        localStorage.removeItem('vindteok_cart');
        localStorage.removeItem('vindteok_wishlist');
        localStorage.removeItem('vindteok_recent');

        // Force Naver logout if object exists
        if (naverLogin) {
            try {
                naverLogin.logout();
            } catch (innerE) {
                console.warn("Naver SDK logout warning:", innerE);
            }
        }
    } catch (e) {
        console.error("Logout caught error:", e);
    } finally {
        updateHeaderUser();
        // Force reload without query params to ensure clean state
        window.location.href = window.location.pathname;
    }
}

function updateHeaderUser() {
    const loginBtn = document.querySelector('.login-icon');
    if (!loginBtn) return;
    if (state.user) {
        loginBtn.innerHTML = `
                <div class="user-menu-trigger">
                    <span>${state.user.name}님</span>
                </div>
            `;
        loginBtn.classList.add('logged-in');
        loginBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openMyPage();
        };
    } else {
        loginBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            `;
        loginBtn.classList.remove('logged-in');
        loginBtn.onclick = openLogin;
    }
}

// INT'L
// INT'L functions delegated to TranslationManager (translations.js)
// Logic removed to avoid duplication.


// INIT
async function init() {
    console.log("App initializing...");
    // 1. Initialize State & DOM
    // 1. Initialize State & DOM
    cacheDom();
    if (window.TranslationManager) {
        window.TranslationManager.init();
        // Sync local state
        state.currentLang = window.TranslationManager.currentLang;
    }

    // --- Kakao Login Initialization ---
    try {
        if (typeof Kakao !== 'undefined') {
            if (!Kakao.isInitialized()) {
                Kakao.init(paymentConfig.kakao.jsKey);
            }
            const kakaoBtn = document.getElementById('kakao-login-btn');
            if (kakaoBtn) {
                kakaoBtn.onclick = () => Kakao.Auth.authorize({ redirectUri: getKakaoRedirectUri() });
            }
        }
    } catch (e) {
        console.error("Kakao initialization failed:", e);
    }

    // --- Naver Login Initialization ---
    try {
        if (typeof naver !== 'undefined' && naver.LoginWithNaverId) {
            console.log("Initializing Naver Login SDK...");
            naverLogin = new naver.LoginWithNaverId({
                clientId: "jBybTIyTT9X5nDtmDfnV",
                callbackUrl: window.location.origin + "/",
                isPopup: false,
                loginButton: { color: "green", type: 3, height: 45 }
            });
            naverLogin.init();

            // Handle Naver Callback
            naverLogin.getLoginStatus(function (status) {
                console.log("Naver login status check:", status);
                if (status) {
                    const userProfile = {
                        id: naverLogin.user.getId(),
                        name: naverLogin.user.getName() || naverLogin.user.getNickName() || 'Naver User',
                        email: naverLogin.user.getEmail(),
                        profile_image: naverLogin.user.getProfileImage()
                    };
                    console.log("Naver login success! User:", userProfile.name);
                    handleLoginSuccess(userProfile);
                    cleanUrl();
                } else {
                    const hash = window.location.hash;
                    if (hash.includes('access_token=')) {
                        console.warn("Found access_token in hash but SDK status is false. Possible state mismatch.");
                        // Clean URL anyway to avoid dangling tokens
                        cleanUrl();
                    }
                }
            });
        }
    } catch (e) {
        console.error("Naver initialization failed:", e);
    }

    // --- Kakao Backend Callback Handling ---
    const urlParams = new URLSearchParams(window.location.search);
    const loginToken = urlParams.get('login_token');
    const loginError = urlParams.get('error');

    if (loginToken) {
        (async () => {
            try {
                const resp = await fetch(`/api/login-token/${loginToken}`);
                if (resp.ok) {
                    handleLoginSuccess(await resp.json());
                }
            } catch (e) { console.error('Kakao login data error', e); }
            cleanUrl();
        })();
    } else if (loginError) {
        console.error('Kakao error:', loginError);
        cleanUrl();
    }

    renderProducts();
    updateCartCount();
    updateWishlistCount();
    renderRecentlyViewed();
    checkUrlParams(); // Check for login/logout params

    // 2. Event Listeners
    // Header - with debugging
    console.log("Setting up header event listeners...");
    console.log("DOM elements:", {
        hamburger: !!DOM.hamburger,
        search: !!DOM.searchIcon,
        wishlist: !!DOM.wishlistIcon,
        cart: !!DOM.cartIcon,
        login: !!DOM.loginIcon
    });

    if (DOM.hamburger) {
        DOM.hamburger.addEventListener('click', function () {
            console.log("Hamburger clicked!");
            toggleNav();
        });
    }
    if (DOM.cartIcon) {
        DOM.cartIcon.addEventListener('click', function () {
            console.log("Cart clicked!");
            openCart();
        });
    }
    if (DOM.wishlistIcon) {
        DOM.wishlistIcon.addEventListener('click', function () {
            console.log("Wishlist clicked!");
            openWishlist();
        });
    }
    if (DOM.searchIcon) {
        DOM.searchIcon.addEventListener('click', function () {
            console.log("Search clicked!");
            openSearch();
        });
    }

    // Login icon handler is managed entirely by updateHeaderUser()
    // which uses .onclick to set the correct handler for logged-in/logged-out state.

    // Initialize login button based on user state
    updateHeaderUser();
    console.log("Header event listeners setup complete");

    // Language Selector
    const langBtn = document.querySelector('.lang-selector__btn');
    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelector('.lang-selector').classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.lang-selector')) {
                document.querySelector('.lang-selector').classList.remove('active');
            }
        });
    }
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const lang = opt.dataset.lang;
            if (window.TranslationManager) {
                window.TranslationManager.changeLanguage(lang);
                state.currentLang = lang;
                // Re-render components that might need it (though TranslationManager handles DOM text)
                renderCart();
                renderWishlist();
                renderRecentlyViewed();
            }
        });
    });

    // Drawers & Modals
    if (DOM.cartCloseBtn) DOM.cartCloseBtn.addEventListener('click', closeCart);
    if (DOM.cartBackdrop) DOM.cartBackdrop.addEventListener('click', closeCart);
    if (DOM.wishlistCloseBtn) DOM.wishlistCloseBtn.addEventListener('click', closeWishlist);
    if (DOM.wishlistBackdrop) DOM.wishlistBackdrop.addEventListener('click', closeWishlist);

    if (DOM.searchCloseBtn) DOM.searchCloseBtn.addEventListener('click', closeSearch);
    if (DOM.modalOverlay) DOM.modalOverlay.addEventListener('click', e => { if (e.target === DOM.modalOverlay) closeModal(); });

    // Login & MyPage
    if (DOM.loginModalClose) DOM.loginModalClose.addEventListener('click', closeLogin);
    if (DOM.loginModalOverlay) DOM.loginModalOverlay.addEventListener('click', e => { if (e.target === DOM.loginModalOverlay) closeLogin(); });
    if (DOM.mypageModalClose) DOM.mypageModalClose.addEventListener('click', closeMyPage);
    if (DOM.mypageModalOverlay) DOM.mypageModalOverlay.addEventListener('click', e => { if (e.target === DOM.mypageModalOverlay) closeMyPage(); });

    // Board Modal
    if (DOM.boardModalClose) DOM.boardModalClose.addEventListener('click', closeBoard);
    if (DOM.boardModalOverlay) DOM.boardModalOverlay.addEventListener('click', e => { if (e.target === DOM.boardModalOverlay) closeBoard(); });

    // Filters
    DOM.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            DOM.filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.currentFilter = tab.dataset.filter;
            state.visibleProducts = 8;
            renderProducts();

            // Show/Hide Subcategories
            if (state.currentFilter === 'all' || state.currentFilter === 'premium' || state.currentFilter === 'sale') {
                DOM.subcategoryTabs.style.display = 'none';
                state.currentSubFilter = 'all';
            } else {
                DOM.subcategoryTabs.style.display = 'flex';
            }
        });
    });

    if (DOM.subcategoryTabs) {
        DOM.subcategoryTabs.querySelectorAll('.subcategory-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                DOM.subcategoryTabs.querySelectorAll('.subcategory-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.currentSubFilter = tab.dataset.sub;
                state.visibleProducts = 8;
                renderProducts();
            });
        });
    }

    if (DOM.sortSelect) {
        DOM.sortSelect.addEventListener('change', (e) => {
            state.currentSort = e.target.value;
            renderProducts();
        });
    }

    if (DOM.loadMoreBtn) {
        DOM.loadMoreBtn.addEventListener('click', () => {
            state.visibleProducts += 8;
            renderProducts();
        });
    }

    // View Options
    DOM.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.viewBtns.forEach(b => b.classList.remove('view-btn--active'));
            btn.classList.add('view-btn--active');
            state.gridCols = parseInt(btn.dataset.cols);
            renderProducts();
        });
    });

    // Board Links
    document.querySelectorAll('.board-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const type = link.dataset.board;
            openBoard(type);
            // Close nav if open
            DOM.hamburger.classList.remove('active');
            DOM.navOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Bottom Nav
    if (DOM.bottomNav) {
        DOM.bottomNav.querySelectorAll('.bottom-nav__item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                DOM.bottomNav.querySelectorAll('.bottom-nav__item').forEach(i => i.classList.remove('bottom-nav__item--active'));
                item.classList.add('bottom-nav__item--active');

                const page = item.dataset.page;
                if (page === 'home') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (page === 'category') {
                    const filters = document.querySelector('.filters');
                    if (filters) filters.scrollIntoView({ behavior: 'smooth' });
                } else if (page === 'wishlist') {
                    openWishlist();
                } else if (page === 'mypage') {
                    if (state.user) openMyPage();
                    else openLogin();
                }
            });
        });
    }

    // Checkout
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);
    if (DOM.checkoutModalClose) DOM.checkoutModalClose.addEventListener('click', closeCheckout);
    if (DOM.placeOrderBtn) DOM.placeOrderBtn.addEventListener('click', placeOrder);
    if (DOM.orderConfirmationBtn) DOM.orderConfirmationBtn.addEventListener('click', closeOrderConfirmation);

    // Logout link in mypage modal
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeMyPage();
            handleLogout();
        });
    }

    // Ripple Effect
    document.querySelectorAll('button, .header__icon').forEach(btn => {
        btn.addEventListener('click', createRipple);
    });

    console.log("UI Initialized. Loading Firebase...");

    // 3. Dynamic Firebase Import
    try {
        const module = await import('./firebase-client.js');
        if (module && module.listenForProductUpdates) {
            console.log("Firebase loaded. Listening for updates...");
            module.listenForProductUpdates((products) => {
                // Use only dynamic products from Firebase
                state.allProducts = [...products];

                // Re-sort
                state.allProducts.sort((a, b) => {
                    // Newest first based on timestamp if available, else ID
                    const timeA = a.timestamp ? a.timestamp.seconds : 0;
                    const timeB = b.timestamp ? b.timestamp.seconds : 0;
                    return timeB - timeA;
                });

                renderProducts();
            });
        }
    } catch (err) {
        console.warn("Firebase module failed to load (likely offline or file:// protocol). Using static data only.", err);
    }
}

// Check for URL parameters (e.g. naive login handling)
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === 'true') {
        handleLogout();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
