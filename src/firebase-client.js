/**
 * Firebase Client for Shop
 * Fetches products from Firestore
 */
import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Export function to fetch products once
export async function fetchFirebaseProducts() {
    try {
        const q = query(collection(db, "products"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        const products = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id, // Use Firestore ID
                ...data
            };
        });
        return products;
    } catch (e) {
        console.error("Error fetching Firebase products:", e);
        return [];
    }
}

// Export function to listen for real-time updates
export function listenForProductUpdates(callback) {
    const q = query(collection(db, "products"), orderBy("timestamp", "desc"));

    // onSnapshot returns an unsubscribe function
    return onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data
            };
        });
        console.log(`🔄 Product update received from Firebase: ${products.length} products`);
        callback(products);
    }, (error) => {
        console.error("Error listening for products:", error);
    });
}
