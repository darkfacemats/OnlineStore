import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
    // Eenvoudige beveiliging - alleen POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        
        console.log('Initializing database...');
        
        // Create orders table
        await sql`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(100) UNIQUE NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                address_line1 VARCHAR(255),
                address_line2 VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                postal_code VARCHAR(20),
                country VARCHAR(100),
                product_name VARCHAR(255) NOT NULL,
                product_price DECIMAL(10,2) NOT NULL,
                quantity INTEGER NOT NULL,
                status VARCHAR(50) DEFAULT 'paid',
                payment_provider VARCHAR(50) DEFAULT 'paypal',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;

        // Create index voor snellere queries
        await sql`CREATE INDEX IF NOT EXISTS idx_order_email ON orders(customer_email)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_order_created ON orders(created_at)`;

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true,
                message: 'Database successfully initialized' 
            })
        };

    } catch (error) {
        console.error('Database initialization error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: 'Database initialization failed',
                details: error.message 
            })
        };
    }
};