/**
 * Admin Panel Logic
 * Firebase Integration
 */

import { db, storage } from "./firebase-config.js";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 1. CONFIGURATION
const ADMIN_CONFIG = {
    // SHA-256 hash of the admin password (set your own before deploying)
    PASSWORD_HASH: 'REPLACE_WITH_SHA256_HASH_OF_YOUR_ADMIN_PASSWORD',
    ADMIN_ID: 'REPLACE_WITH_YOUR_ADMIN_ID',
    SESSION_KEY: 'vindteok_admin_session'
};

// 2. DOM ELEMENTS
const DOM = {
    loginSection: document.getElementById('login-section'),
    dashboardSection: document.getElementById('dashboard-section'),
    loginForm: document.getElementById('admin-login-form'),
    inputId: document.getElementById('admin-id'),
    inputPw: document.getElementById('admin-pw'),
    logoutBtn: document.getElementById('logout-btn'),
    uploadForm: document.getElementById('upload-form'),
    imagePreview: document.getElementById('image-preview'),
    productImage: document.getElementById('product-image'),
    productList: document.getElementById('product-list'),
    clearBtn: document.getElementById('clear-storage'), // Not used for Firestore clear all (too dangerous)
    categorySelect: document.getElementById('product-category'),
    accOptions: document.getElementById('acc-sub-options')
};

// 3. AUTHENTICATION (Same logic)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleLogin(e) {
    e.preventDefault();
    const id = DOM.inputId.value;
    const pw = DOM.inputPw.value;

    if (id !== ADMIN_CONFIG.ADMIN_ID) {
        alert('Invalid ID');
        return;
    }

    const hashedPw = await hashPassword(pw);
    if (hashedPw === ADMIN_CONFIG.PASSWORD_HASH) {
        sessionStorage.setItem(ADMIN_CONFIG.SESSION_KEY, 'true');
        showDashboard();
    } else {
        alert('Invalid Password');
    }
}

function checkSession() {
    if (sessionStorage.getItem(ADMIN_CONFIG.SESSION_KEY) === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

function handleLogout() {
    sessionStorage.removeItem(ADMIN_CONFIG.SESSION_KEY);
    showLogin();
}

function showDashboard() {
    DOM.loginSection.style.display = 'none';
    DOM.dashboardSection.style.display = 'block';
    loadProducts();
}

function showLogin() {
    DOM.loginSection.style.display = 'block';
    DOM.dashboardSection.style.display = 'none';
    DOM.inputId.value = '';
    DOM.inputPw.value = '';
}


// 4. PRODUCT MANAGEMENT (FIREBASE)
let selectedFile = null;

DOM.imagePreview.addEventListener('click', () => DOM.productImage.click());
DOM.productImage.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = function (e) {
        DOM.imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
});

DOM.categorySelect.addEventListener('change', function () {
    if (this.value === 'acc') {
        DOM.accOptions.style.display = 'block';
    } else {
        DOM.accOptions.style.display = 'none';
    }
});

DOM.uploadForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    console.log("Upload form submitted"); // DEBUG

    if (!selectedFile) {
        alert('Please select an image');
        return;
    }

    const title = document.getElementById('product-title').value;
    const category = document.getElementById('product-category').value;
    const price = parseInt(document.getElementById('product-price').value);
    const originalPriceVal = document.getElementById('product-original-price').value;
    const originalPrice = originalPriceVal ? parseInt(originalPriceVal) : null;
    const desc = document.getElementById('product-desc').value;
    const badge = document.getElementById('product-badge').value;

    console.log("Form Data:", { title, category, price, desc, badge, file: selectedFile.name }); // DEBUG

    let subCategory = null;
    if (category === 'acc') {
        const checkedSub = document.querySelector('input[name="acc-sub"]:checked');
        if (checkedSub) subCategory = checkedSub.value;
    }

    try {
        console.log("Starting Firebase Storage upload...");
        console.log("Storage bucket:", storage.app.options.storageBucket);
        console.log("File size:", selectedFile.size, "bytes");

        // 1. Upload Image to Firebase Storage with timeout
        const storageRef = ref(storage, `product-images/${Date.now()}_${selectedFile.name}`);
        console.log("Storage reference created:", storageRef.fullPath);

        console.log("Uploading bytes...");
        const uploadPromise = uploadBytes(storageRef, selectedFile);

        // Add 30 second timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Upload timeout after 30 seconds - check Firebase Storage rules!')), 30000)
        );

        const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
        console.log("✅ Storage upload complete. Ref:", snapshot.ref);

        const imageUrl = await getDownloadURL(snapshot.ref);
        console.log("✅ Image URL retrieved:", imageUrl);

        // 2. Add Document to Firestore
        const newProduct = {
            title: title,
            price: price,
            originalPrice: originalPrice,
            image: imageUrl,
            category: category,
            subCategory: subCategory,
            description: desc,
            badge: badge === 'none' ? null : badge,
            isNew: badge === 'new',
            soldOut: false,
            measurements: { info: desc },
            timestamp: serverTimestamp() // For sorting
        };

        console.log("Adding document to Firestore...", newProduct); // DEBUG
        const docRef = await addDoc(collection(db, "products"), newProduct);
        console.log("Document written with ID: ", docRef.id);

        alert('Product Uploaded Successfully!');
        this.reset();
        DOM.imagePreview.innerHTML = '<span>Click to Select Image</span>';
        selectedFile = null;
        DOM.accOptions.style.display = 'none';

        loadProducts(); // Refresh list

    } catch (e) {
        console.error("Error adding product: ", e);
        console.error("Error code:", e.code); // Log error code if available
        console.error("Error message:", e.message);
        alert("Error uploading product: " + e.message);
    }
});

async function loadProducts() {
    DOM.productList.innerHTML = '<p>Loading...</p>';
    try {
        const q = query(collection(db, "products"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            DOM.productList.innerHTML = '<p>No products found.</p>';
            return;
        }

        DOM.productList.innerHTML = querySnapshot.docs.map(doc => {
            const p = doc.data();
            return `
            <div class="product-item">
                <img src="${p.image}" alt="${p.title}">
                <div class="product-item-info">
                    <strong title="${p.title}">${p.title}</strong>
                    <div class="product-meta">
                        <span class="product-category">${p.category}</span>
                        <span>₩${p.price.toLocaleString()}</span>
                    </div>
                </div>
                <span class="delete-btn" data-id="${doc.id}" data-img-url="${p.image}" title="Delete product">&times;</span>
            </div>
            `;
        }).join('');

        // Attach delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                deleteProduct(this.dataset.id, this.dataset.imgUrl);
            });
        });

    } catch (e) {
        console.error("Error loading products: ", e);
        DOM.productList.innerHTML = '<p>Error loading products.</p>';
    }
}

async function deleteProduct(docId, imageUrl) {
    if (!confirm('Delete this product permanently?')) return;

    try {
        // 1. Delete Firestore Document
        await deleteDoc(doc(db, "products", docId));

        // 2. Delete Image from Storage (optional but good practice)
        if (imageUrl) {
            // Need to extract path from URL or just delete doc if safety rules ignore it. 
            // Parsing URL to ref is tricky without full path logic, but let's try strict ref if possible.
            // For simplicity in MVP, we might skip image delete or try:
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef).catch(err => console.log("Image delete error (might be okay if already gone):", err));
        }

        loadProducts();
    } catch (e) {
        console.error("Error deleting product: ", e);
        alert("Error deleting product.");
    }
}


// Hide Clear Button for Firebase mode (safety)
if (DOM.clearBtn) DOM.clearBtn.style.display = 'none';


// 5. INIT
DOM.loginForm.addEventListener('submit', handleLogin);
DOM.logoutBtn.addEventListener('click', handleLogout);
checkSession();
