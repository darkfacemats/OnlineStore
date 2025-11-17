import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
    console.log('Get stats function called');
    
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        
        const totalOrders = await sql`SELECT COUNT(*) as count FROM orders`;
        const totalRevenue = await sql`SELECT COALESCE(SUM(amount), 0) as total FROM orders`;
        const todayOrders = await sql`SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURRENT_DATE`;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: {
                    totalOrders: parseInt(totalOrders[0].count),
                    totalRevenue: parseFloat(totalRevenue[0].total || 0),
                    todayOrders: parseInt(todayOrders[0].count),
                    avgOrder: totalOrders[0].count > 0 ? parseFloat(totalRevenue[0].total / totalOrders[0].count).toFixed(2) : 0
                }
            })
        };

    } catch (error) {
        console.error('Stats error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to load statistics: ' + error.message,
                data: {
                    totalOrders: 0,
                    totalRevenue: 0,
                    todayOrders: 0,
                    avgOrder: 0
                }
            })
        };
    }
};