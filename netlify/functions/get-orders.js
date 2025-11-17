import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
    // Eenvoudige beveiliging - alleen GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        
        // Query parameters voor filtering
        const { search, status, limit = 50, offset = 0 } = event.queryStringParameters || {};
        
        let query = sql`SELECT * FROM orders`;
        const conditions = [];
        const params = [];

        // Filters
        if (search) {
            conditions.push(sql`(customer_name ILIKE ${'%' + search + '%'} OR customer_email ILIKE ${'%' + search + '%'} OR order_id = ${search})`);
        }
        
        if (status) {
            conditions.push(sql`status = ${status}`);
        }

        // Combine conditions
        if (conditions.length > 0) {
            query = sql`${query} WHERE ${conditions.reduce((acc, cond) => acc ? sql`${acc} AND ${cond}` : cond)}`;
        }

        // Order en limit
        query = sql`${query} ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const orders = await query;

        // Tel totaal aantal orders voor paginatie
        const countResult = await sql`SELECT COUNT(*) as total FROM orders`;
        const total = countResult[0].total;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: orders,
                pagination: {
                    total: parseInt(total),
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            })
        };

    } catch (error) {
        console.error('Get orders error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to fetch orders',
                details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support'
            })
        };
    }
};