import { neon } from '@neondatabase/serverless';

// Rate limiting storage
const rateLimit = new Map();

export const handler = async function(event, context) {
    console.log('Create order function called');
    
    // 1. Alleen POST requests
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method Not Allowed' }) 
        };
    }

    // 2. Rate limiting (max 10 requests per minuut per IP)
    const clientIP = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    if (rateLimit.has(clientIP)) {
        const requests = rateLimit.get(clientIP).filter(time => time > windowStart);
        if (requests.length >= 10) {
            return {
                statusCode: 429,
                body: JSON.stringify({ error: 'Too many requests. Please try again later.' })
            };
        }
        requests.push(now);
        rateLimit.set(clientIP, requests);
    } else {
        rateLimit.set(clientIP, [now]);
    }

    // 3. Clean old rate limit data (prevent memory leaks)
    if (Math.random() < 0.1) { // 10% chance to clean
        for (const [ip, times] of rateLimit.entries()) {
            const recent = times.filter(time => time > windowStart);
            if (recent.length === 0) {
                rateLimit.delete(ip);
            } else {
                rateLimit.set(ip, recent);
            }
        }
    }

    // 4. Content type check
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
        
        // 5. Data validatie
        const validationError = validateOrderData(orderData);
        if (validationError) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: validationError })
            };
        }

        // 6. Check voor duplicate orders
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

        // 7. Insert order
        const result = await sql`
            INSERT INTO orders (
                order_id, customer_name, customer_email, amount, currency,
                address_line1, address_line2, city, state, postal_code, country,
                product_name, product_price, quantity
            ) VALUES (
                ${orderData.orderId},
                ${orderData.customerName},
                ${orderData.customerEmail},
                ${parseFloat(orderData.amount)},
                ${orderData.currency},
                ${orderData.shippingAddress?.addressLine1 || null},
                ${orderData.shippingAddress?.addressLine2 || null},
                ${orderData.shippingAddress?.city || null},
                ${orderData.shippingAddress?.state || null},
                ${orderData.shippingAddress?.postalCode || null},
                ${orderData.shippingAddress?.country || null},
                ${orderData.productName},
                ${parseFloat(orderData.productPrice)},
                ${parseInt(orderData.quantity)}
            )
            RETURNING id
        `;

        console.log('Order saved with ID:', result[0].id);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                success: true, 
                orderId: result[0].id,
                message: 'Order successfully saved' 
            })
        };

    } catch (error) {
        console.error('Create order error:', error);
        
        // 8. Veilige error messages
        let errorMessage = 'Failed to save order';
        if (error.message.includes('duplicate key')) {
            errorMessage = 'Order already exists';
        } else if (error.message.includes('connection')) {
            errorMessage = 'Database connection failed';
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: errorMessage
            })
        };
    }
};

// Data validatie functie
function validateOrderData(orderData) {
    const requiredFields = ['orderId', 'customerName', 'customerEmail', 'amount', 'productName', 'quantity'];
    
    for (const field of requiredFields) {
        if (!orderData[field]) {
            return `Missing required field: ${field}`;
        }
    }

    // Email validatie
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.customerEmail)) {
        return 'Invalid email format';
    }

    // Amount validatie
    if (isNaN(orderData.amount) || parseFloat(orderData.amount) <= 0) {
        return 'Invalid amount';
    }

    // Quantity validatie
    if (isNaN(orderData.quantity) || parseInt(orderData.quantity) < 1 || parseInt(orderData.quantity) > 10) {
        return 'Invalid quantity (1-10 allowed)';
    }

    // Order ID validatie (PayPal format)
    if (!/^[A-Z0-9]{17}$/.test(orderData.orderId)) {
        return 'Invalid order ID format';
    }

    return null;
}