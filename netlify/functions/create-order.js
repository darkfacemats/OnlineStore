import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
    // Beveiliging: Alleen POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    // Rate limiting simpel - check content type
    const contentType = event.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Content-Type must be application/json' })
        };
    }

    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        const orderData = JSON.parse(event.body);
        
        console.log('Processing order:', orderData.orderId);
        
        // Data validatie
        const requiredFields = ['orderId', 'customerName', 'customerEmail', 'amount', 'productName'];
        for (const field of requiredFields) {
            if (!orderData[field]) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ 
                        error: 'Missing required fields',
                        missing: field 
                    })
                };
            }
        }

        // Check of order al bestaat (idempotentie)
        const existingOrder = await sql`
            SELECT id FROM orders WHERE order_id = ${orderData.orderId}
        `;

        if (existingOrder.length > 0) {
            return {
                statusCode: 409,
                body: JSON.stringify({ 
                    error: 'Order already exists',
                    orderId: existingOrder[0].id 
                })
            };
        }

        // Insert order in database
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
            RETURNING id, order_id, created_at
        `;

        console.log('Order saved:', result[0].id);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                orderId: result[0].id,
                paypalOrderId: result[0].order_id,
                createdAt: result[0].created_at,
                message: 'Order successfully saved' 
            })
        };

    } catch (error) {
        console.error('Database error:', error);
        
        // Duplicate key error
        if (error.code === '23505') {
            return {
                statusCode: 409,
                body: JSON.stringify({ 
                    error: 'Order already exists' 
                })
            };
        }
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Internal Server Error',
                details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support'
            })
        };
    }
};