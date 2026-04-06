import pool from "../config/db.js"; // นำเข้าตู้เก็บเอกสาร (ฐานข้อมูล)

// สร้างงานใหม่ (สร้างแฟ้มงานใหม่ใส่เข้าไปในระบบ)
export const createWork = async ({ job_name, customer_name, job_type, job_detail, location, start_date, work_time, supervisor_id, admin_id }) => {
    // เอาข้อมูลที่รับมาทั้งหมด ยัดลงไปในตู้เอกสาร (INSERT INTO)
    const [rows] = await pool.execute(
        `INSERT INTO work (job_name, customer_name, job_type, job_detail, location, start_date, work_time, supervisor_id, admin_id) 
     VALUES (?,?,?,?,?,?,?,?,?)`,
        [job_name, customer_name, job_type, job_detail, location, start_date, work_time, supervisor_id, admin_id]
    )
    return rows // ส่งผลลัพธ์การสร้างกลับไป
}

// มอบหมายงานให้ช่าง (ระบุว่างานนี้ ใครเป็นคนทำ)
export const assignWorkToUser = async ({ work_id, technician_id }) => {
    // บันทึกลงตู้เอกสารว่า งานรหัสนี้ มอบหมายให้ช่างรหัสนี้
    const [rows] = await pool.execute(
        `INSERT INTO work_assign (work_id, technician_id) VALUES (?,?)`,
        [work_id, technician_id]
    )
    return rows
}

// ดูรายการงานทั้งหมดของช่าง 1 คน (หาว่าช่างคนนี้มีงานอะไรบ้าง)
export const getWorksByUserId = async (userId) => {
    // ค้นหางานโดยเชื่อมโยงตารางงาน (work) เข้ากับตารางการมอบหมายงาน (work_assign)
    const [rows] = await pool.execute(
        `SELECT w.* FROM work w
         JOIN work_assign wa ON w.work_id = wa.work_id 
         WHERE wa.technician_id = ?`,
        [userId]
    )
    return rows
}

// ดูรายการงานทั้งหมดที่มีในระบบ
export const getAllWorks = async () => {
    const [rows] = await pool.execute(`SELECT * FROM work`) // ดึงข้อมูลทุกอย่างจากแฟ้มงาน
    return rows
}

// ดูข้อมูลงาน 1 งานแบบเจาะจง (หาจาก ID งาน)
export const getWorkById = async (id) => {
    const [rows] = await pool.execute(`SELECT * FROM work WHERE work_id = ?`, [id])
    return rows
}

// แก้ไขรายละเอียดของงาน
export const updateWork = async ({ id, job_name, customer_name, job_type, job_detail, location, start_date, work_time, supervisor_id, admin_id }) => {
    // อัปเดตข้อมูล (UPDATE) ไปทับข้อมูลเก่าของงานรหัสนี้
    const [result] = await pool.execute(
        `UPDATE work SET job_name = ?, customer_name = ?, job_type = ?, job_detail = ?, location = ?, start_date = ?, work_time = ?, supervisor_id = ?, admin_id = ? WHERE work_id = ?`,
        [job_name, customer_name, job_type, job_detail, location, start_date, work_time, supervisor_id, admin_id, id]
    )
    return result
}

// ลบงานทิ้งจากระบบ
export const deleteWork = async (id) => {
    const [result] = await pool.execute(`DELETE FROM work WHERE work_id = ?`, [id])
    return result
}

// 2. ฟังก์ชันช่างอัปเดตสถานะ (เช่น กดรับงาน, กำลังทำ, เสร็จแล้ว)
export const updateWorkStatus = async (req, res) => {
    try {
        const { id, techId } = req.params; // รับรหัสงาน และ รหัสช่าง
        const { status } = req.body; // รับ "สถานะ" ที่ส่งมา

        // อัปเดตสถานะของงานนี้ที่เป็นของช่างคนนี้
        const [result] = await pool.query(
            "UPDATE work_assign SET status = ? WHERE work_id = ? AND technician_id = ?",
            [status, id, techId]
        );

        // ถ้าหาแฟ้มมอบหมายงานไม่เจอ
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการมอบหมายงานนี้" });
        }

        res.status(200).json({ message: "ช่างอัปเดตสถานะงานสำเร็จ", status: status });
    } catch (error) {
        console.error("Error in updateWorkStatus:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }
};

// 3. ฟังก์ชันหัวหน้าตรวจงาน (ตรวจว่าผ่าน หรือ ต้องแก้)
export const reviewWork = async (req, res) => {
    try {
        const { id, techId } = req.params; // รับรหัสงาน และ รหัสช่าง
        const { status, comment } = req.body; // รับสถานะการตรวจ และ คอมเมนต์เพิ่มเติมจากหัวหน้า

        // อัปเดตสถานะงานเข้าไปในระบบ
        const [result] = await pool.query(
            "UPDATE work_assign SET status = ? WHERE work_id = ? AND technician_id = ?",
            [status, id, techId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลการมอบหมายงานนี้" });
        }

        res.status(200).json({
            message: "หัวหน้าอัปเดตผลการตรวจงานสำเร็จ",
            status: status,
            comment: comment || null // แนบคอมเมนต์กลับไปให้ดูด้วย (ถ้ามี)
        });
    } catch (error) {
        console.error("Error in reviewWork:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }
};