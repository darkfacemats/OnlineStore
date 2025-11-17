// Hoofd JavaScript functionaliteit
class ProductStore {
    constructor() {
        this.config = window.PRODUCT_CONFIG;
        this.cart = this.loadCart();
        this.init();
    }

    init() {
        this.updateProductUI();
        this.setupEventListeners();
        this.updateCartCount();
    }

    // Update de UI met productconfiguratie
    updateProductUI() {
        const p = this.config.product;
        
        // Update prijzen
        this.updateElementText('product-title', p.name);
        this.updateElementText('product-category', p.category);
        this.updateElementText('original-price', `${p.pricing.currencySymbol}${p.pricing.original.toFixed(2)}`);
        this.updateElementText('current-price', `${p.pricing.currencySymbol}${p.pricing.current.toFixed(2)}`);
        this.updateElementText('savings-text', `Je bespaart ${p.pricing.currencySymbol}${p.discount.amount.toFixed(2)}`);
        this.updateElementText('discount-badge', `${p.discount.percentage}% KORTING`);
        
        // Update voorraad
        this.updateElementText('stock-count', `Nog ${p.stock.count} beschikbaar`);
        this.updateElementStyle('stock-fill', 'width', `${p.stock.percentage}%`);
        
        // Update rating
        this.updateElementText('rating-text', `${p.ratings.average}/5 · ${p.ratings.count.toLocaleString()} beoordelingen`);
        
        // Update knoppen
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.innerHTML = `<span class="btn-icon">🛒</span> In winkelwagen - ${p.pricing.currencySymbol}${p.pricing.current.toFixed(2)}`;
        }
    }

    updateElementText(id, text) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }

    updateElementStyle(id, property, value) {
        const element = document.getElementById(id);
        if (element) element.style[property] = value;
    }

    // Winkelwagen functionaliteit
    loadCart() {
        try {
            return JSON.parse(localStorage.getItem('techstyle_cart')) || [];
        } catch (e) {
            return [];
        }
    }

    saveCart() {
        localStorage.setItem('techstyle_cart', JSON.stringify(this.cart));
    }

    addToCart(quantity = 1) {
        const product = this.config.product;
        const existingItem = this.cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.pricing.current,
                originalPrice: product.pricing.original,
                image: 'images/product-main.jpg',
                quantity: quantity
            });
        }

        this.saveCart();
        this.updateCartCount();
        this.showAddToCartFeedback();
    }

    updateCartCount() {
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = count;
        }
    }

    showAddToCartFeedback() {
        const btn = document.getElementById('add-to-cart');
        if (!btn) return;

        const originalHTML = btn.innerHTML;
        const originalBg = btn.style.background;

        btn.innerHTML = '<span class="btn-icon">✅</span> Toegevoegd aan winkelwagen!';
        btn.style.background = 'var(--success-color)';

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = originalBg;
        }, 2000);
    }

    // Event listeners
    setupEventListeners() {
        // Thumbnail gallery
        this.setupImageGallery();
        
        // Quantity controls
        this.setupQuantityControls();
        
        // Add to cart button
        this.setupAddToCart();
        
        // Buy now button
        this.setupBuyNow();
        
        // Mobile menu
        this.setupMobileMenu();
    }

    setupImageGallery() {
        const thumbnails = document.querySelectorAll('.thumbnail');
        const mainImage = document.getElementById('hero-product-image');

        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                // Update active state
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                
                // Update main image
                const newImage = thumb.getAttribute('data-image');
                if (newImage && mainImage) {
                    mainImage.src = newImage;
                }
            });
        });
    }

    setupQuantityControls() {
        const minusBtn = document.querySelector('.quantity-btn.minus');
        const plusBtn = document.querySelector('.quantity-btn.plus');
        const quantityInput = document.getElementById('quantity');

        if (minusBtn && plusBtn && quantityInput) {
            minusBtn.addEventListener('click', () => {
                let value = parseInt(quantityInput.value);
                if (value > 1) {
                    quantityInput.value = value - 1;
                }
            });

            plusBtn.addEventListener('click', () => {
                let value = parseInt(quantityInput.value);
                if (value < 10) {
                    quantityInput.value = value + 1;
                }
            });
        }
    }

    setupAddToCart() {
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                const quantity = parseInt(document.getElementById('quantity')?.value || 1);
                this.addToCart(quantity);
            });
        }
    }

    setupBuyNow() {
        const buyNowBtn = document.getElementById('buy-now');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => {
                const quantity = parseInt(document.getElementById('quantity')?.value || 1);
                this.addToCart(quantity);
                window.location.href = 'cart.html';
            });
        }

        const finalCtaBtn = document.getElementById('final-cta-btn');
        if (finalCtaBtn) {
            finalCtaBtn.addEventListener('click', () => {
                this.addToCart(1);
                window.location.href = 'cart.html';
            });
        }
    }

    setupMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');

        if (toggle && nav) {
            toggle.addEventListener('click', () => {
                nav.classList.toggle('active');
                toggle.classList.toggle('active');
            });
        }
    }
}

// Initialiseer de store wanneer de DOM geladen is
document.addEventListener('DOMContentLoaded', () => {
    window.productStore = new ProductStore();
});

// Export voor gebruik in andere bestanden
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductStore;
}