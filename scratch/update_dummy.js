
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function updateData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3309,
        user: process.env.DB_USER || 'techjob',
        password: process.env.DB_PASS || 'techjob',
        database: process.env.DB_NAME || 'techjob'
    });
    try {
        // Set coordinates for work_id 8 (Bangkok area)
        await connection.execute('UPDATE work SET lat = 13.7367, lng = 100.5231 WHERE work_id = 8');
        // Set coordinates for work_id 9 (Another area)
        await connection.execute('UPDATE work SET lat = 13.7563, lng = 100.5018 WHERE work_id = 9');
        console.log('Successfully updated dummy coordinates for work_id 8 and 9.');
    } catch (error) {
        console.error('Error updating data:', error.message);
    }
    await connection.end();
}
updateData().catch(console.error);
