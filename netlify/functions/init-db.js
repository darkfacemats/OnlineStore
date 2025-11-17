import { neon } from '@neondatabase/serverless';

export const handler = async function(event, context) {
    try {
        const sql = neon(process.env.NETLIFY_DATABASE_URL);
        
        // Create orders table
        await sql`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(100) UNIQUE NOT NULL,
                customer_name VARCHAR(255),
                customer_email VARCHAR(255),
                amount DECIMAL(10,2),
                currency VARCHAR(10),
                address_line1 VARCHAR(255),
                address_line2 VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                postal_code VARCHAR(20),
                country VARCHAR(100),
                product_name VARCHAR(255),
                quantity INTEGER,
                status VARCHAR(50) DEFAULT 'paid',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Database initialized successfully' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};