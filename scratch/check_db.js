
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkStructure() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3309,
        user: process.env.DB_USER || 'techjob',
        password: process.env.DB_PASS || 'techjob',
        database: process.env.DB_NAME || 'techjob'
    });
    const [rows] = await connection.execute('DESCRIBE work');
    console.log(JSON.stringify(rows, null, 2));
    await connection.end();
}
checkStructure().catch(console.error);
