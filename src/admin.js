/**
 * Admin Panel Logic
 * Firebase Integration
 */

import { db, storage } from "./firebase-config.js";
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. AUTH (Firebase Authentication — admin access is enforced by security rules)
const auth = getAuth();

// 2. DOM ELEMENTS
const DOM = {
    loginSection: document.getElementById('login-section'),
    dashboardSection: document.getElementById('dashboard-section'),
    loginForm: document.getElementById('admin-login-form'),
    inputId: document.getElementById('admin-id'),
    inputPw: document.getElementById('admin-pw'),
    logoutBtn: document.getElementById('logout-btn'),
    // Upload Form
    uploadForm: document.getElementById('upload-form'),
    imagePreview: document.getElementById('image-preview'),
    productImage: document.getElementById('product-image'),
    categorySelect: document.getElementById('product-category'),
    accOptions: document.getElementById('acc-sub-options'),
    // Edit Form
    editCard: document.getElementById('edit-product-card'),
    editForm: document.getElementById('edit-form'),
    editImagePreview: document.getElementById('edit-image-preview'),
    editPreviewImgTag: document.getElementById('edit-preview-img-tag'),
    editProductImage: document.getElementById('edit-product-image'),
    editCategorySelect: document.getElementById('edit-product-category'),
    editAccOptions: document.getElementById('edit-acc-sub-options'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    // List
    productList: document.getElementById('product-list'),
    clearBtn: document.getElementById('clear-storage') // Not used for Firestore clear all (too dangerous)
};

// 3. AUTHENTICATION (Firebase Auth)
async function handleLogin(e) {
    e.preventDefault();
    const email = DOM.inputId.value.trim();
    const pw = DOM.inputPw.value;

    try {
        await signInWithEmailAndPassword(auth, email, pw);
        // onAuthStateChanged will show the dashboard
    } catch (err) {
        console.error("Login failed:", err.code);
        alert('Invalid email or password');
    }
}

function checkSession() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            showDashboard();
        } else {
            showLogin();
        }
    });
}

function handleLogout() {
    signOut(auth);
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
let editSelectedFile = null;

// --- UPLOAD FORM LISTENERS ---
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
    console.log("Upload form submitted");

    if (!selectedFile) {
        alert('Please select an image');
        return;
    }

    const title = document.getElementById('product-title').value;
    const category = document.getElementById('product-category').value;
    const price = parseInt(document.getElementById('product-price').value);
    const stockVal = document.getElementById('product-stock').value;
    const stock = stockVal ? parseInt(stockVal) : 0;
    const originalPriceVal = document.getElementById('product-original-price').value;
    const originalPrice = originalPriceVal ? parseInt(originalPriceVal) : null;
    const desc = document.getElementById('product-desc').value;
    const badge = document.getElementById('product-badge').value;

    let subCategory = null;
    if (category === 'acc') {
        const checkedSub = document.querySelector('input[name="acc-sub"]:checked');
        if (checkedSub) subCategory = checkedSub.value;
    }

    try {
        console.log("Starting upload...");

        // 1. Upload Image
        const storageRef = ref(storage, `product-images/${Date.now()}_${selectedFile.name}`);
        const snapshot = await uploadBytes(storageRef, selectedFile);
        const imageUrl = await getDownloadURL(snapshot.ref);

        // 2. Create Document
        const newProduct = {
            title: title,
            price: price,
            originalPrice: originalPrice,
            stock: stock, // NEW
            image: imageUrl,
            category: category,
            subCategory: subCategory,
            description: desc,
            badge: badge === 'none' ? null : badge,
            isNew: badge === 'new',
            soldOut: false,
            measurements: { info: desc },
            timestamp: serverTimestamp()
        };

        await addDoc(collection(db, "products"), newProduct);

        alert('Product Uploaded Successfully!');
        this.reset();
        DOM.imagePreview.innerHTML = '<span>Click to Select Image</span>';
        selectedFile = null;
        DOM.accOptions.style.display = 'none';
        loadProducts();

    } catch (e) {
        console.error("Error adding product: ", e);
        alert("Error uploading product: " + e.message);
    }
});

// --- EDIT FORM LISTENERS ---
DOM.editImagePreview.addEventListener('click', () => DOM.editProductImage.click());
DOM.editProductImage.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    editSelectedFile = file;
    const reader = new FileReader();
    reader.onload = function (e) {
        DOM.editPreviewImgTag.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

DOM.editCategorySelect.addEventListener('change', function () {
    if (this.value === 'acc') {
        DOM.editAccOptions.style.display = 'block';
    } else {
        DOM.editAccOptions.style.display = 'none';
    }
});

DOM.cancelEditBtn.addEventListener('click', function () {
    DOM.editCard.style.display = 'none';
    DOM.editForm.reset();
    editSelectedFile = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

DOM.editForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const docId = document.getElementById('edit-product-id').value;
    if (!docId) return;

    const title = document.getElementById('edit-product-title').value;
    const category = document.getElementById('edit-product-category').value;
    const price = parseInt(document.getElementById('edit-product-price').value);
    const stock = parseInt(document.getElementById('edit-product-stock').value) || 0;
    const originalPriceVal = document.getElementById('edit-product-original-price').value;
    const originalPrice = originalPriceVal ? parseInt(originalPriceVal) : null;
    const desc = document.getElementById('edit-product-desc').value;
    const badge = document.getElementById('edit-product-badge').value;

    let subCategory = null;
    if (category === 'acc') {
        const checkedSub = document.querySelector('input[name="edit-acc-sub"]:checked');
        if (checkedSub) subCategory = checkedSub.value;
    }

    try {
        let imageUrl = DOM.editPreviewImgTag.src;

        // If new file selected, upload it
        if (editSelectedFile) {
            const storageRef = ref(storage, `product-images/${Date.now()}_${editSelectedFile.name}`);
            const snapshot = await uploadBytes(storageRef, editSelectedFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        const updatedData = {
            title: title,
            price: price,
            originalPrice: originalPrice,
            stock: stock,
            image: imageUrl,
            category: category,
            subCategory: subCategory,
            description: desc,
            badge: badge === 'none' ? null : badge,
            isNew: badge === 'new',
            measurements: { info: desc }
        };

        await updateDoc(doc(db, "products", docId), updatedData);

        alert('Product Updated!');
        DOM.editCard.style.display = 'none';
        DOM.editForm.reset();
        editSelectedFile = null;
        loadProducts();

    } catch (e) {
        console.error("Error updating product: ", e);
        alert("Error updating product: " + e.message);
    }
});


// --- PRODUCT LIST & INLINE ACTIONS ---
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
                    <div class="product-stock-admin">
                        <span>Stock:</span>
                        <input type="number" class="stock-input" data-id="${doc.id}" value="${p.stock ?? 0}" min="0">
                        <button type="button" class="stock-save-btn" data-id="${doc.id}">Save</button>
                    </div>
                </div>
                <span class="edit-btn" data-id="${doc.id}" title="Edit product">✎</span>
                <span class="delete-btn" data-id="${doc.id}" data-img-url="${p.image}" title="Delete product">&times;</span>
            </div>
            `;
        }).join('');

        // Attach listeners
        // 1. Delete
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                deleteProduct(this.dataset.id, this.dataset.imgUrl);
            });
        });

        // 2. Edit
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const docId = this.dataset.id;
                await openEditForm(docId);
            });
        });

        // 3. Inline Stock Save
        document.querySelectorAll('.stock-save-btn').forEach(btn => {
            btn.addEventListener('click', async function () {
                const docId = this.dataset.id;
                const input = document.querySelector(`.stock-input[data-id="${docId}"]`);
                const newStock = parseInt(input.value) || 0;

                try {
                    await updateDoc(doc(db, "products", docId), { stock: newStock });
                    // Optional: Visual feedback
                    const originalText = this.innerText;
                    this.innerText = "OK";
                    this.style.background = "#3498db";
                    setTimeout(() => {
                        this.innerText = originalText;
                        this.style.background = ""; // Reset
                    }, 1000);
                } catch (e) {
                    alert("Failed to update stock: " + e.message);
                }
            });
        });

    } catch (e) {
        console.error("Error loading products: ", e);
        DOM.productList.innerHTML = '<p>Error loading products.</p>';
    }
}

async function openEditForm(docId) {
    try {
        const docSnap = await getDoc(doc(db, "products", docId));
        if (!docSnap.exists()) {
            alert("Product not found!");
            return;
        }
        const p = docSnap.data();

        // Populate fields
        document.getElementById('edit-product-id').value = docId;
        document.getElementById('edit-product-title').value = p.title || '';
        document.getElementById('edit-product-category').value = p.category || '';
        document.getElementById('edit-product-price').value = p.price || '';
        document.getElementById('edit-product-stock').value = p.stock ?? 0;
        document.getElementById('edit-product-original-price').value = p.originalPrice || '';
        document.getElementById('edit-product-desc').value = p.description || (p.measurements ? p.measurements.info : '') || '';
        document.getElementById('edit-product-badge').value = p.badge || (p.isNew ? 'new' : 'none') || '';

        // Handle subcategory radio
        if (p.category === 'acc') {
            DOM.editAccOptions.style.display = 'block';
            if (p.subCategory) {
                const radio = document.querySelector(`input[name="edit-acc-sub"][value="${p.subCategory}"]`);
                if (radio) radio.checked = true;
            }
        } else {
            DOM.editAccOptions.style.display = 'none';
        }

        // Image
        DOM.editPreviewImgTag.src = p.image;
        editSelectedFile = null; // Reset any previous file selection
        document.getElementById('edit-product-image').value = ''; // Reset file input

        // Show form
        DOM.editCard.style.display = 'block';
        DOM.editCard.scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        console.error("Error opening edit form:", e);
        alert("Error loading product details.");
    }
}


async function deleteProduct(docId, imageUrl) {
    if (!confirm('Delete this product permanently?')) return;

    try {
        await deleteDoc(doc(db, "products", docId));
        // Image delete is optional/unsafe in MVP often, but kept logic
        if (imageUrl) {
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
