
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function addColumns() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3309,
        user: process.env.DB_USER || 'techjob',
        password: process.env.DB_PASS || 'techjob',
        database: process.env.DB_NAME || 'techjob'
    });
    try {
        await connection.execute('ALTER TABLE work ADD COLUMN lat DOUBLE NULL AFTER supervisor_id');
        await connection.execute('ALTER TABLE work ADD COLUMN lng DOUBLE NULL AFTER lat');
        console.log('Successfully added lat and lng columns to work table.');
    } catch (error) {
        console.error('Error adding columns:', error.message);
    }
    await connection.end();
}
addColumns().catch(console.error);
