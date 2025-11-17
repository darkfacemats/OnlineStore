import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
    console.log('Get orders function called');
    
    // Accepteer zowel GET als POST
    if (!['GET', 'POST'].includes(event.httpMethod)) {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        console.log('Connecting to database...');
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        console.log('Database connected successfully');
        
        // Simpele query om orders op te halen
        const orders = await sql`
            SELECT * FROM orders 
            ORDER BY created_at DESC
        `;
        
        console.log(`Found ${orders.length} orders`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                success: true,
                data: orders,
                count: orders.length,
                pagination: {
                    total: orders.length,
                    limit: 50,
                    offset: 0
                }
            })
        };

    } catch (error) {
        console.error('Get orders error:', error);
        
        // Meer specifieke error messages
        let errorMessage = 'Failed to fetch orders';
        if (error.message.includes('relation "orders" does not exist')) {
            errorMessage = 'Orders table does not exist yet. Run database initialization first.';
        } else if (error.message.includes('connection')) {
            errorMessage = 'Database connection failed. Check environment variables.';
        } else {
            errorMessage = `Database error: ${error.message}`;
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.stack : 'Contact support'
            })
        };
    }
};