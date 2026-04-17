import db from '../config/db.js';

// 1. ฟังก์ชันสำหรับหน้า จัดการบัญชีพนักงาน (แก้ SQL ให้ปลอดภัยแล้ว)
export const getAllEmployeesWithHistory = async (req, res) => {
    try {
        const [employees] = await db.execute(`SELECT * FROM users`);

        const [workHistory] = await db.execute(`
            SELECT wa.technician_id, w.* FROM work_assign wa 
            JOIN work w ON wa.work_id = w.work_id
        `);

        res.json({ employees, workHistory });
    } catch (error) {
        console.error("🔥 จุดที่พังใน getAllEmployees:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// 2. ฟังก์ชันสำหรับหน้า Manager Dashboard (กู้คืนมาให้แล้ว + ปรับชื่อคอลัมน์นิดหน่อย)
export const getFinancialReport = async (req, res) => {
    const { year } = req.query;
    try {
        const query = `
            SELECT 
                w.work_id AS id, w.job_name AS namework, w.start_date AS datework, w.money AS income,
                COALESCE(SUM(we.cost), 0) AS total_cost,
                (w.money - COALESCE(SUM(we.cost), 0)) AS profit
            FROM work w
            LEFT JOIN work_expense we ON w.work_id = we.work_id
            WHERE YEAR(w.start_date) = ? AND w.status != 'Draft'
            GROUP BY w.work_id
        `;
        const [records] = await db.execute(query, [year]);
        res.json(records);
    } catch (error) {
        console.error("🔥 จุดที่พังใน getFinancialReport:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// 3. ฟังก์ชันสำหรับหน้า ประวัติการใช้วัสดุ (กู้คืนมาให้แล้ว)
export const getMaterialUsage = async (req, res) => {
    try {
        const query = `
            SELECT 
                mr.id AS requestId, m.name AS materialName, mr.amount AS usedAmount,
                w.job_name AS jobName, w.work_id AS jobId, t.name AS technician, mr.request_date AS date
            FROM material_request mr
            JOIN material m ON mr.material_id = m.material_id
            JOIN work w ON mr.work_id = w.work_id
            JOIN technicians t ON mr.technician_id = t.technician_id
            ORDER BY mr.request_date DESC
        `;
        const [usage] = await db.execute(query);
        res.json(usage);
    } catch (error) {
        console.error("🔥 จุดที่พังใน getMaterialUsage:", error.message);
        res.status(500).json({ message: error.message });
    }
};