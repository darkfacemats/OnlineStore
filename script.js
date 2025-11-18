document.addEventListener('DOMContentLoaded', function() {
    console.log('Pagina geladen - initialiseer product en PayPal');
    
    // LAAD PRODUCT CONFIGURATIE
    initializeProduct();
    initializePayPal();
});
function loadCarouselImages(images) {
    const carouselInner = document.getElementById("carouselInner");
    carouselInner.innerHTML = "";

    images.forEach((src, index) => {
        if (!src) return;

        const item = document.createElement("div");
        item.classList.add("carousel-item");
        if (index === 0) item.classList.add("active");

        item.innerHTML = `<img src="${src}" class="d-block w-100">`;
        carouselInner.appendChild(item);
    });
}

loadCarouselImages(PRODUCT_CONFIG.images);

function initializeProduct() {
    // Update alle product informatie op de pagina
    document.title = `NorthLights - ${PRODUCT_CONFIG.name}`;
    document.getElementById('productName').textContent = PRODUCT_CONFIG.name;
    document.getElementById('productImage').src = PRODUCT_CONFIG.image;
    document.getElementById('productImage').alt = PRODUCT_CONFIG.name;
    document.getElementById('productPrice').textContent = `€${PRODUCT_CONFIG.price.toFixed(2)}`;
    document.getElementById('productDescription').textContent = PRODUCT_CONFIG.description;
    
    // Specificaties
    const specsList = document.getElementById('productSpecifications');
    specsList.innerHTML = PRODUCT_CONFIG.specifications.map(spec => 
        `<li>${spec}</li>`
    ).join('');
    
    // Verzendinfo
    const shippingHTML = PRODUCT_CONFIG.shipping.free ? '✅ Gratis verzending<br>' : '';
    document.getElementById('shippingInfo').innerHTML = 
        shippingHTML +
        `✅ ${PRODUCT_CONFIG.shipping.return}<br>` +
        `✅ ${PRODUCT_CONFIG.shipping.delivery}`;
}

function initializePayPal() {
    paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
        },

        createOrder: function(data, actions) {
            const quantity = parseInt(document.getElementById('quantity').value);
            const totalAmount = (PRODUCT_CONFIG.price * quantity).toFixed(2);
            
            console.log('✅ Order creatie:', PRODUCT_CONFIG.name, quantity, totalAmount);
            
            return actions.order.create({
                purchase_units: [{
                    description: PRODUCT_CONFIG.name,
                    amount: {
                        value: totalAmount,
                        currency_code: PRODUCT_CONFIG.currency
                    }
                }]
            });
        },

        onApprove: function(data, actions) {
            console.log('✅ Betaling goedgekeurd:', data.orderID);
            
            return actions.order.capture().then(async function(details) {
                console.log('🎉 BETALING VOLTOOID:', details);
                
                // Bereid order data voor
                const orderData = {
                    orderId: data.orderID,
                    customerName: details.payer.name.given_name + ' ' + details.payer.name.surname,
                    customerEmail: details.payer.email_address,
                    amount: details.purchase_units[0].amount.value,
                    currency: details.purchase_units[0].amount.currency_code,
                    productName: PRODUCT_CONFIG.name,
                    productPrice: PRODUCT_CONFIG.price,
                    quantity: parseInt(document.getElementById('quantity').value),
                    shippingAddress: {}
                };

                // Verzendadres toevoegen
                if (details.purchase_units[0].shipping) {
                    const shipping = details.purchase_units[0].shipping;
                    orderData.shippingAddress = {
                        addressLine1: shipping.address.address_line_1,
                        addressLine2: shipping.address.address_line_2 || '',
                        city: shipping.address.admin_area_2,
                        state: shipping.address.admin_area_1,
                        postalCode: shipping.address.postal_code,
                        country: shipping.address.country_code
                    };
                }

                // 🔒 BEVEILIGDE DATABASE OPSLAG
                try {
                    console.log('🔄 Opslaan in database...');
                    const saveResult = await saveOrderToDatabase(orderData);
                    console.log('✅ Order opgeslagen:', saveResult);
                    
                    // Redirect naar succes pagina met order data
                    const successUrl = new URL('success.html', window.location.href);
                    successUrl.searchParams.set('orderData', encodeURIComponent(JSON.stringify(orderData)));
                    successUrl.searchParams.set('dbSuccess', 'true');
                    successUrl.searchParams.set('dbOrderId', saveResult.orderId);
                    window.location.href = successUrl.toString();

                } catch (error) {
                    console.error('❌ Database opslag mislukt:', error);
                    
                    // Toch door naar succes pagina maar met warning
                    const successUrl = new URL('success.html', window.location.href);
                    successUrl.searchParams.set('orderData', encodeURIComponent(JSON.stringify(orderData)));
                    successUrl.searchParams.set('dbError', encodeURIComponent(error.message));
                    window.location.href = successUrl.toString();
                }
            });
        },

        onError: function(err) {
            console.error('❌ PayPal fout:', err);
            // Redirect naar fout pagina
            const errorUrl = new URL('error.html', window.location.href);
            errorUrl.searchParams.set('error', encodeURIComponent(err.message || 'Onbekende fout'));
            window.location.href = errorUrl.toString();
        },

        onCancel: function(data) {
            console.log('⏹️ Betaling geannuleerd');
            // Redirect naar geannuleerd pagina
            window.location.href = 'cancel.html';
        }

    }).render('#paypal-button-container');

    // Quantity change listener
    document.getElementById('quantity').addEventListener('change', function() {
        const quantity = parseInt(this.value);
        const total = PRODUCT_CONFIG.price * quantity;
        console.log(`Aantal: ${quantity}, Totaal: €${total.toFixed(2)}`);
    });
}

// 🔒 BEVEILIGDE DATABASE OPSLAG FUNCTIE
async function saveOrderToDatabase(orderData) {
    try {
        const response = await fetch('/.netlify/functions/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (!response.ok) {
            // Toon gebruikersvriendelijke error
            if (response.status === 409) {
                throw new Error('Deze bestelling is al verwerkt.');
            } else if (response.status === 429) {
                throw new Error('Te veel verzoeken. Probeer het over een minuut opnieuw.');
            } else if (response.status === 400) {
                throw new Error('Ongeldige bestelgegevens: ' + (result.error || ''));
            } else {
                throw new Error(result.error || 'Bestelling opslaan mislukt.');
            }
        }

        return result;

    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}