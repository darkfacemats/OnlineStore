import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        const orders = await sql`
            SELECT * FROM orders 
            ORDER BY created_at DESC
        `;

        return {
            statusCode: 200,
            body: JSON.stringify(orders)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};