import pool from "../config/db.js"; // นำเข้าตู้เก็บเอกสาร (ฐานข้อมูล)
import bcrypt from "bcryptjs"; // นำเข้าเครื่องมือสำหรับเข้ารหัสผ่านให้ปลอดภัย (แปลงตัวหนังสือให้อ่านไม่ออก)

// 1. ดึงข้อมูลผู้ใช้งานตาม ID (เหมือนขอดูแฟ้มประวัติพนักงาน 1 คน)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params; // รับค่าตัวเลข ID ที่ส่งมากับลิงก์ (เช่น /users/1)

    // เอาคอลัมน์ id ออกจาก SELECT และเปลี่ยน WHERE เป็น user_id
    // สั่งค้นหาข้อมูลในตู้เก็บเอกสาร โดยเลือกมาเฉพาะบางข้อมูล (รหัส, ชื่อ, อีเมล ฯลฯ) ของคนที่ ID ตรงกัน
    const [rows] = await pool.query(
      "SELECT user_id, username, name, email, phone, department FROM users WHERE user_id = ?",
      [id]
    );

    // ถ้าหาไม่เจอ (ไม่มีแฟ้มเอกสาร)
    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน" }); // แจ้งกลับว่าไม่พบข้อมูล
    }

    // ถ้าหาเจอ ส่งข้อมูลกลับไปให้ลูกค้า
    res.status(200).json({
      message: "ดึงข้อมูลสำเร็จ",
      user: rows[0] // ส่งข้อมูลคนที่หาเจอคนแรกกลับไป
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" }); // ถ้ามีอะไรพังในระบบ ให้แจ้งว่าเซิร์ฟเวอร์มีปัญหา
  }
};

// 2. แก้ไขข้อมูลผู้ใช้งาน (เหมือนอัปเดตแฟ้มประวัติพนักงาน)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params; // รับ ID ว่าจะแก้ของใคร
    const { name, email, phone, department } = req.body; // รับข้อมูลใหม่ที่กรอกเข้ามา (ชื่อ, อีเมล ฯลฯ)

    // เปลี่ยน WHERE id = ? เป็น WHERE user_id = ?
    // สั่งอัปเดต (UPDATE) ข้อมูลใหม่ลงไปทับในตู้เอกสาร
    const [result] = await pool.query(
      "UPDATE users SET name = ?, email = ?, phone = ?, department = ? WHERE user_id = ?",
      [name, email, phone, department, id]
    );

    // ถ้าไม่มีการเปลี่ยนแปลงข้อมูลใดๆ เลย (หาคนๆ นั้นไม่เจอ)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งานที่ต้องการแก้ไข" });
    }

    // แจ้งว่าสำเร็จ
    res.status(200).json({ message: "แก้ไขข้อมูลผู้ใช้งานสำเร็จ" });
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};

// 3. เปลี่ยนรหัสผ่านผู้ใช้งาน
export const updatePassword = async (req, res) => {
  try {
    const { id } = req.params; // รับ ID ของคนที่จะเปลี่ยนรหัส
    const { oldPassword, newPassword } = req.body; // รับ "รหัสเก่า" และ "รหัสใหม่" ที่กรอกเข้ามา

    // เปลี่ยน WHERE id = ? เป็น WHERE user_id = ?
    // ไปดึงรหัสผ่านเดิมที่อยู่ในระบบมาตรวจสอบก่อน
    const [rows] = await pool.query("SELECT password FROM users WHERE user_id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งาน" });
    }

    const user = rows[0];

    // ตรวจสอบว่า "รหัสเก่า" ที่กรอกเข้ามา ตรงกับรหัสที่อยู่ในระบบหรือไม่
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) { // ถ้าไม่ตรง
      console.log("รหัสผ่านเดิมไม่ถูกต้อง");
      return res.status(400).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" }); // ปฏิเสธการเปลี่ยนรหัส
    }

    // ถ้ารหัสเก่าถูกต้อง จะทำการเข้ารหัส "รหัสผ่านใหม่" ให้ปลอดภัยก่อนบันทึก
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // เปลี่ยน WHERE id = ? เป็น WHERE user_id = ?
    // บันทึกรหัสผ่านใหม่ลงไปในระบบ
    await pool.query("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, id]);

    res.status(200).json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (error) {
    console.error("Error in updatePassword:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};

// 4. สมัครสมาชิกใหม่ (Register)
export const register = async (req, res) => {
  try {
    const { username, name, email, password, phone, department } = req.body;

    // ตรวจสอบว่ามีอีเมลหรือชื่อผู้ใช้นี้ซ้ำในระบบหรือไม่
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ? OR username = ?", [email, username]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "อีเมลหรือชื่อผู้ใช้นี้มีในระบบแล้ว" });
    }

    // เข้ารหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // กำหนดประเภทผู้ใช้เริ่มต้นเป็น 'user'
    const defaultType = 'user';

    // บันทึกข้อมูลลงฐานข้อมูล (เพิ่มคอลัมน์ type ถ้าใน DB ของคุณมี)
    await pool.query(
      "INSERT INTO users (username, name, email, password, phone, department, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [username, name, email, hashedPassword, phone, department, defaultType]
    );

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};

// 5. เข้าสู่ระบบ (Login)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body; // รับเป็น email หรือ username ก็ได้

    // ค้นหาผู้ใช้จาก email หรือ username
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ? OR username = ?", [email, email]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งานในระบบ" });
    }

    const user = rows[0];

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    // ลบรหัสผ่านออกจากข้อมูลที่จะส่งกลับไปเพื่อความปลอดภัย
    delete user.password;

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: user
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};

// 6. ลืมรหัสผ่าน (Forgot Password - แบบกำหนดรหัสใหม่โดยใช้อีเมล)
export const resetPasswordByEmail = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // ตรวจสอบว่ามีอีเมลนี้จริงไหม
    const [rows] = await pool.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบอีเมลนี้ในระบบ" });
    }

    // เข้ารหัสผ่านใหม่
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // อัปเดตรหัสผ่านใหม่
    await pool.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

    res.status(200).json({ message: "รีเซ็ตรหัสผ่านสำเร็จ" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};