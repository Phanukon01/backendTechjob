import db from '../config/db.js';
import bcrypt from 'bcryptjs';

// ดึงข้อมูลส่วนตัวของผู้ใช้ตาม ID
export const getUserProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT name, email, phone 
            FROM users 
            WHERE user_id = ?
        `;
        const [users] = await db.execute(query, [id]);

        if (users.length > 0) {
            res.json(users[0]);
        } else {
            res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
        }
    } catch (error) {
        console.error("🔥 จุดที่พังใน getUserProfile:", error.message);
        res.status(500).json({ message: error.message });
    }
};

// 1. ฟังก์ชันสำหรับหน้า จัดการบัญชีพนักงาน (แก้ SQL ให้ปลอดภัยแล้ว)
// ฟังก์ชันสำหรับหน้า จัดการบัญชีพนักงาน (เพิ่มเงื่อนไขไม่เอา manager)
export const getAllEmployeesWithHistory = async (req, res) => {
    try {
        // ดึงเฉพาะ user ที่ไม่ใช่ manager
        const [employees] = await db.execute(`
            SELECT user_id, username, name, nickname, role, type, status, email, phone, department 
            FROM users 
            WHERE role != 'manager'
        `);

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
// 2. ฟังก์ชันสำหรับหน้า Manager Dashboard (แก้ไข SQL ให้ตรงกับฐานข้อมูล)
export const getFinancialReport = async (req, res) => {
    const { year } = req.query;
    try {
        const query = `
            SELECT 
                w.work_id AS id, 
                w.job_name AS namework, 
                w.start_date AS datework, 
                IFNULL(SUM(we.revenue), 0) AS income, 
                IFNULL(SUM(we.total_cost), 0) AS total_cost,
                (IFNULL(SUM(we.revenue), 0) - IFNULL(SUM(we.total_cost), 0)) AS profit
            FROM work w
            LEFT JOIN work_expense we ON w.work_id = we.work_id
            WHERE YEAR(w.start_date) = ? 
            GROUP BY w.work_id, w.job_name, w.start_date
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

// ฟังก์ชันสำหรับอัปเดตข้อมูลส่วนตัว
export const updateUserProfile = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    try {
        const query = `
            UPDATE users 
            SET name = ?, email = ?, phone = ? 
            WHERE user_id = ?
        `;
        const [result] = await db.execute(query, [name, email, phone, id]);

        if (result.affectedRows > 0) {
            res.json({ message: "อัปเดตข้อมูลสำเร็จ" });
        } else {
            res.status(404).json({ message: "ไม่พบผู้ใช้ที่ต้องการอัปเดต" });
        }
    } catch (error) {
        console.error("🔥 จุดที่พังใน updateUserProfile:", error.message);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
    }
};

// ฟังก์ชันสำหรับเปลี่ยนรหัสผ่าน
export const updatePassword = async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน" });
    }

    try {
        // 1. ดึงข้อมูลผู้ใช้เพื่อเอารหัสผ่านเดิมที่เข้ารหัสไว้มาตรวจสอบ
        const [users] = await db.execute('SELECT password FROM users WHERE user_id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        }

        const user = users[0];

        // 2. ตรวจสอบรหัสผ่านปัจจุบันว่าตรงกับในฐานข้อมูลหรือไม่
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
        }

        // 3. เข้ารหัส (Hash) รหัสผ่านใหม่
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. อัปเดตลงฐานข้อมูล
        await db.execute('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, id]);

        res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จแล้ว" });
    } catch (error) {
        console.error("🔥 จุดที่พังใน updatePassword:", error.message);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
};