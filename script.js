document.addEventListener('DOMContentLoaded', function() {
    console.log('Pagina geladen - maak PayPal knop aan');
    
    const product = {
        name: "iPhone 13 Pro",
        price: 999.00,
        currency: "EUR"
    };

    document.title = `TechShop - ${product.name}`;
    document.getElementById('productName').textContent = product.name;

    paypal.Buttons({
        style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
        },

        createOrder: function(data, actions) {
            const quantity = parseInt(document.getElementById('quantity').value);
            const totalAmount = (product.price * quantity).toFixed(2);
            
            console.log('✅ Order creatie gestart: €' + totalAmount);
            
            return actions.order.create({
                purchase_units: [{
                    description: product.name,
                    amount: {
                        value: totalAmount,
                        currency_code: product.currency
                    },
                    shipping: {
                        name: {
                            full_name: "" // Laat leeg voor klant om in te vullen
                        },
                        address: {
                            address_line_1: "",
                            address_line_2: "",
                            admin_area_2: "", // city
                            admin_area_1: "", // state
                            postal_code: "",
                            country_code: "NL"
                        }
                    }
                }]
            });
        },

        onApprove: function(data, actions) {
            console.log('✅ Betaling goedgekeurd, order ID:', data.orderID);
            
            return actions.order.capture().then(async function(details) {
                console.log('🎉 BETALING VOLTOOID:', details);
                
                // Bereid order data voor
                const orderData = {
                    orderId: data.orderID,
                    customerName: details.payer.name.given_name + ' ' + details.payer.name.surname,
                    customerEmail: details.payer.email_address,
                    amount: details.purchase_units[0].amount.value,
                    currency: details.purchase_units[0].amount.currency_code,
                    productName: product.name,
                    quantity: parseInt(document.getElementById('quantity').value),
                    shippingAddress: {}
                };

                // Verzendadres toevoegen als beschikbaar
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

                // Sla order op in database
                try {
                    const response = await fetch('/.netlify/functions/create-order', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(orderData)
                    });

                    const result = await response.json();

                    if (response.ok) {
                        // Toon succesbericht met order details
                        showSuccessMessage(details, orderData, result.orderId);
                    } else {
                        throw new Error(result.error || 'Failed to save order');
                    }

                } catch (error) {
                    console.error('❌ Database error:', error);
                    // Toon succes maar met waarschuwing voor database
                    showSuccessMessage(details, orderData, null, error.message);
                }
            });
        },

        onError: function(err) {
            console.error('❌ PayPal fout:', err);
            showErrorMessage('PayPal fout: ' + err.message);
        },

        onCancel: function(data) {
            console.log('⏹️ Betaling geannuleerd:', data);
            showCancelMessage();
        }

    }).render('#paypal-button-container');

    // Helper functies
    function showSuccessMessage(details, orderData, dbOrderId, dbError = null) {
        const shippingInfo = orderData.shippingAddress ? `
            <div class="mt-3">
                <h6>Verzendadres:</h6>
                <p>${orderData.shippingAddress.addressLine1} ${orderData.shippingAddress.addressLine2}<br>
                ${orderData.shippingAddress.postalCode} ${orderData.shippingAddress.city}<br>
                ${orderData.shippingAddress.country}</p>
            </div>
        ` : '';

        const dbWarning = dbError ? `
            <div class="alert alert-warning mt-2">
                <small>⚠️ Order niet opgeslagen in database: ${dbError}</small>
            </div>
        ` : '';

        document.getElementById('paypal-button-container').innerHTML = `
            <div class="alert alert-success">
                <h4>🎉 Betaling Geslaagd!</h4>
                <p><strong>Order ID:</strong> ${orderData.orderId}</p>
                <p><strong>Database ID:</strong> ${dbOrderId || 'Niet opgeslagen'}</p>
                <p><strong>Bedrag:</strong> €${orderData.amount}</p>
                <p><strong>Klant:</strong> ${orderData.customerName}</p>
                <p><strong>Email:</strong> ${orderData.customerEmail}</p>
                <p><strong>Product:</strong> ${orderData.productName} (${orderData.quantity}x)</p>
                ${shippingInfo}
                ${dbWarning}
                <button onclick="location.reload()" class="btn btn-primary mt-2">Nieuwe Bestelling</button>
            </div>
        `;
    }

    function showErrorMessage(message) {
        document.getElementById('paypal-button-container').innerHTML = `
            <div class="alert alert-danger">
                <h4>Betaling Mislukt</h4>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-warning">Probeer Opnieuw</button>
            </div>
        `;
    }

    function showCancelMessage() {
        document.getElementById('paypal-button-container').innerHTML = `
            <div class="alert alert-warning">
                <h4>Betaling Geannuleerd</h4>
                <p>Je hebt de betaling geannuleerd. Je kunt altijd opnieuw proberen.</p>
                <button onclick="location.reload()" class="btn btn-primary">Opnieuw Proberen</button>
            </div>
        `;
    }

    // Quantity change listener
    document.getElementById('quantity').addEventListener('change', function() {
        const quantity = parseInt(this.value);
        const total = product.price * quantity;
        console.log(`Aantal: ${quantity}, Totaal: €${total.toFixed(2)}`);
    });
});