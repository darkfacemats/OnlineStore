// Checkout functionaliteit
function displayOrderSummary() {
    const orderSummary = document.getElementById('order-summary');
    
    if (!orderSummary) return;
    
    let subtotal = 0;
    let summaryHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        summaryHTML += `
            <div class="order-item">
                <span>${item.quantity} x ${item.name}</span>
                <span>€${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });
    
    // Bereken verzendkosten en BTW
    const shippingCost = subtotal > 50 ? 0 : 4.95;
    const tax = subtotal * 0.21;
    const total = subtotal + shippingCost + tax;
    
    summaryHTML += `
        <div class="order-item">
            <span>Subtotaal</span>
            <span>€${subtotal.toFixed(2)}</span>
        </div>
        <div class="order-item">
            <span>Verzendkosten</span>
            <span>€${shippingCost.toFixed(2)}</span>
        </div>
        <div class="order-item">
            <span>BTW (21%)</span>
            <span>€${tax.toFixed(2)}</span>
        </div>
        <div class="order-item order-total">
            <span>Totaal</span>
            <span>€${total.toFixed(2)}</span>
        </div>
    `;
    
    orderSummary.innerHTML = summaryHTML;
}

// Functie om bestelling te plaatsen
function placeOrder(event) {
    event.preventDefault();
    
    // Verzamel formuliergegevens
    const formData = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        postalCode: document.getElementById('postal-code').value,
        country: document.getElementById('country').value,
        shippingMethod: document.getElementById('shipping-method').value,
        cardNumber: document.getElementById('card-number').value,
        cardName: document.getElementById('card-name').value,
        expiryDate: document.getElementById('expiry-date').value,
        cvv: document.getElementById('cvv').value
    };
    
    // Simpele validatie
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.address || 
        !formData.city || !formData.postalCode || !formData.cardNumber || !formData.cardName || 
        !formData.expiryDate || !formData.cvv) {
        alert('Vul alle verplichte velden in.');
        return;
    }
    
    // Genereer ordernummer
    const orderNumber = 'ORD' + Date.now();
    
    // Bereken totalen
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    const shippingCost = subtotal > 50 ? 0 : 4.95;
    const tax = subtotal * 0.21;
    const total = subtotal + shippingCost + tax;
    
    // Maak orderobject
    const order = {
        orderNumber: orderNumber,
        customer: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            country: formData.country
        },
        shipping: formData.shippingMethod,
        items: [...cart],
        subtotal: subtotal,
        shippingCost: shippingCost,
        tax: tax,
        total: total,
        date: new Date().toISOString()
    };
    
    // Sla bestelling op in localStorage (simulatie van database)
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Stuur "e-mail" (console.log voor simulatie)
    console.log('Orderbevestiging e-mail verzonden naar:', formData.email);
    console.log('Orderdetails:', order);
    
    // Toon alert
    alert(`Bedankt voor uw bestelling! Uw ordernummer is: ${orderNumber}`);
    
    // Leeg winkelwagen
    clearCart();
    
    // Redirect naar bevestigingspagina met ordergegevens
    window.location.href = `confirmation.html?order=${orderNumber}`;
}

// Functie om bevestigingspagina weer te geven
function displayConfirmation() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');
    
    if (!orderNumber) {
        document.getElementById('confirmation-content').innerHTML = '<p>Order niet gevonden.</p>';
        return;
    }
    
    // Haal ordergegevens op uit localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.orderNumber === orderNumber);
    
    if (!order) {
        document.getElementById('confirmation-content').innerHTML = '<p>Order niet gevonden.</p>';
        return;
    }
    
    const confirmationContent = document.getElementById('confirmation-content');
    
    // Formatteer datum
    const orderDate = new Date(order.date);
    const formattedDate = orderDate.toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Bouw HTML voor orderitems
    let itemsHTML = '';
    order.items.forEach(item => {
        itemsHTML += `
            <div class="order-item">
                <span>${item.quantity} x ${item.name}</span>
                <span>€${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
    });
    
    confirmationContent.innerHTML = `
        <div class="confirmation-card">
            <div class="confirmation-icon">✓</div>
            <h1>Bedankt voor uw bestelling!</h1>
            <p>Uw bestelling is succesvol geplaatst en wordt zo snel mogelijk verwerkt.</p>
            
            <div class="order-details">
                <h2>Ordergegevens</h2>
                <p><strong>Ordernummer:</strong> ${order.orderNumber}</p>
                <p><strong>Orderdatum:</strong> ${formattedDate}</p>
                
                <h3>Verzendadres</h3>
                <p>${order.customer.firstName} ${order.customer.lastName}</p>
                <p>${order.customer.address}</p>
                <p>${order.customer.postalCode} ${order.customer.city}</p>
                <p>${order.customer.country}</p>
                
                <h3>Contactgegevens</h3>
                <p><strong>E-mail:</strong> ${order.customer.email}</p>
                ${order.customer.phone ? `<p><strong>Telefoon:</strong> ${order.customer.phone}</p>` : ''}
                
                <h3>Bestelde producten</h3>
                <div class="order-summary">
                    ${itemsHTML}
                    <div class="order-item">
                        <span>Subtotaal</span>
                        <span>€${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="order-item">
                        <span>Verzendkosten</span>
                        <span>€${order.shippingCost.toFixed(2)}</span>
                    </div>
                    <div class="order-item">
                        <span>BTW (21%)</span>
                        <span>€${order.tax.toFixed(2)}</span>
                    </div>
                    <div class="order-item order-total">
                        <span>Totaal</span>
                        <span>€${order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <p>Er is een bevestigingsmail verzonden naar <strong>${order.customer.email}</strong>.</p>
            <a href="index.html" class="btn">Terug naar home</a>
        </div>
    `;
}

// Initialiseer checkout wanneer de DOM geladen is
document.addEventListener('DOMContentLoaded', function() {
    // Toon ordersamenvatting op checkoutpagina
    if (document.getElementById('order-summary')) {
        displayOrderSummary();
    }
    
    // Event listener voor plaatsen bestelling
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', placeOrder);
    }
    
    // Toon bevestiging op bevestigingspagina
    if (document.getElementById('confirmation-content')) {
        displayConfirmation();
    }
});