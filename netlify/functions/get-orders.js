import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
    console.log('Get orders function called');
    
    // Alleen GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        
        // Query parameters met validatie
        const { search, status, limit = 50, offset = 0 } = event.queryStringParameters || {};
        
        // Limit validatie (max 100 orders per request)
        const safeLimit = Math.min(parseInt(limit), 100);
        const safeOffset = Math.max(0, parseInt(offset));

        let query = sql`SELECT * FROM orders`;
        const conditions = [];

        // Search validatie (max 100 karakters)
        if (search && search.length <= 100) {
            conditions.push(sql`(customer_name ILIKE ${'%' + search + '%'} OR customer_email ILIKE ${'%' + search + '%'} OR order_id = ${search})`);
        }
        
        // Status validatie
        const allowedStatuses = ['paid', 'shipped', 'delivered', 'cancelled'];
        if (status && allowedStatuses.includes(status)) {
            conditions.push(sql`status = ${status}`);
        }

        if (conditions.length > 0) {
            query = sql`${query} WHERE ${conditions.reduce((acc, cond) => acc ? sql`${acc} AND ${cond}` : cond)}`;
        }

        query = sql`${query} ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

        const orders = await query;

        // Tel totaal (veilige manier)
        const countResult = await sql`SELECT COUNT(*) as total FROM orders`;
        const total = parseInt(countResult[0].total);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                success: true,
                data: orders,
                pagination: {
                    total: total,
                    limit: safeLimit,
                    offset: safeOffset
                }
            })
        };

    } catch (error) {
        console.error('Get orders error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to fetch orders'
            })
        };
    }
};