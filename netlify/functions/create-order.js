import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
    console.log('Create order function called');
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        const orderData = JSON.parse(event.body);
        
        console.log('Processing order:', orderData.orderId);
        
        // Insert order
        const result = await sql`
            INSERT INTO orders (
                order_id, customer_name, customer_email, amount, currency,
                address_line1, address_line2, city, state, postal_code, country,
                product_name, product_price, quantity
            ) VALUES (
                ${orderData.orderId},
                ${orderData.customerName},
                ${orderData.customerEmail},
                ${orderData.amount},
                ${orderData.currency},
                ${orderData.shippingAddress?.addressLine1 || null},
                ${orderData.shippingAddress?.addressLine2 || null},
                ${orderData.shippingAddress?.city || null},
                ${orderData.shippingAddress?.state || null},
                ${orderData.shippingAddress?.postalCode || null},
                ${orderData.shippingAddress?.country || null},
                ${orderData.productName},
                ${orderData.productPrice},
                ${orderData.quantity}
            )
            RETURNING id
        `;

        console.log('Order saved with ID:', result[0].id);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                orderId: result[0].id,
                message: 'Order successfully saved' 
            })
        };

    } catch (error) {
        console.error('Create order error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to save order: ' + error.message
            })
        };
    }
};