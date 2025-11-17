import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
    // Alleen POST requests toestaan
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        const orderData = JSON.parse(event.body);
        
        // Valideer vereiste data
        if (!orderData.orderId || !orderData.customerEmail) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Insert order in database
        const result = await sql`
            INSERT INTO orders (
                order_id, customer_name, customer_email, amount, currency,
                address_line1, address_line2, city, state, postal_code, country,
                product_name, quantity, status, created_at
            ) VALUES (
                ${orderData.orderId},
                ${orderData.customerName},
                ${orderData.customerEmail},
                ${orderData.amount},
                ${orderData.currency},
                ${orderData.shippingAddress?.addressLine1 || ''},
                ${orderData.shippingAddress?.addressLine2 || ''},
                ${orderData.shippingAddress?.city || ''},
                ${orderData.shippingAddress?.state || ''},
                ${orderData.shippingAddress?.postalCode || ''},
                ${orderData.shippingAddress?.country || ''},
                ${orderData.productName},
                ${orderData.quantity},
                'paid',
                NOW()
            )
            RETURNING id
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                orderId: result[0].id,
                message: 'Order successfully saved' 
            })
        };

    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Internal Server Error',
                details: error.message 
            })
        };
    }
};