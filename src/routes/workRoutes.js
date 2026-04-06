import express from "express"; // นำเข้าเครื่องมือสำหรับทำตัวเป็นพนักงานต้อนรับ
// นำเข้าพ่อครัวแต่ละหน้าที่จาก workController.js มาเตรียมไว้
import { updateWorkStatus, reviewWork } from "../controllers/workController.js"; // เช็ก path ให้ตรงกับโปรเจกต์คุณด้วยนะครับ
import { createWork, assignWorkToUser, getWorksByUserId, getAllWorks, getWorkById, updateWork, deleteWork } from '../controllers/workController.js'

const router = express.Router(); // สร้างตัวรับออเดอร์

// รับคำสั่งเข้าทางลิงก์ /create (สร้างงานใหม่)
router.post('/create', async (req, res) => {
  try {
    const rows = await createWork(req.body) // เรียกพ่อครัวมาสร้างงาน
    res.status(201).json({ message: 'Created', workId: rows.insertId }) // ตอบกลับว่า "สร้างเสร็จแล้ว ได้รหัสงานมาด้วยนะ"
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

// รับคำสั่งเข้าทางลิงก์ /assign/รหัสงาน (มอบหมายงาน)
router.post('/assign/:id', async (req, res) => {
  try {
    const { id } = req.params // แงะเอารหัสงานออกมาจากลิงก์
    const { technician_id } = req.body // แงะเอารหัสช่างออกจากข้อมูลที่ส่งมา
    await assignWorkToUser({ work_id: id, technician_id }) // เรียกพ่อครัวมาทำการมอบหมาย
    res.status(201).json({ message: 'Assigned' }) // ตอบกลับว่า "มอบหมายสำเร็จ"
  } catch (error) {
    console.log("Error in Assign Work:", error); // <--- เพิ่มบรรทัดนี้
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

// รับคำสั่งเข้าทางลิงก์ /assign/รหัสช่าง เพื่อดูว่าช่างคนนี้มีงานอะไรบ้าง
router.get('/assign/:id', async (req, res) => {
  try {
    const { id } = req.params
    const rows = await getWorksByUserId(id)
    res.status(200).json({ message: 'Ok', works: rows }) // ส่งรายการงานกลับไป
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

// รับคำสั่งขอขอดูงานทั้งหมดที่มีในระบบ
router.get('/getAll', async (req, res) => {
  try {
    const rows = await getAllWorks()
    res.status(200).json({ message: 'Ok', works: rows })
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

// รับคำสั่งขอดูงานแค่ 1 งาน (ระบุรหัสมาด้วย)
router.get('/getById/:id', async (req, res) => {
  try {
    const { id } = req.params
    const rows = await getWorkById(id)
    if (rows.length === 0)
      return res.status(404).json({ message: 'Not Found' }) // ถ้าหาไม่เจอให้ตอบ Not Found
    res.status(200).json({ message: 'Ok', work: rows[0] })
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

// รับคำสั่งอัปเดตงาน (แก้ไขข้อมูลงาน)
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await updateWork({ id, ...req.body }) // สั่งพ่อครัวให้อัปเดต
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Not Found' })
    res.status(200).json({ message: 'Updated' }) // ตอบกลับว่า อัปเดตเสร็จแล้ว
  } catch (error) {
    console.log("Error in Update Work:", error); // เพิ่มบรรทัดนี้เพื่อดูว่าผิดที่อะไร
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

// รับคำสั่งให้ลบงานทิ้ง
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await deleteWork(id)
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Not Found' })
    res.status(200).json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

// Route เดิมของคุณ (ตรงนี้มีเส้นทาง /create ซ้ำกับด้านบน การทำงานจริงระบบจะเข้าอันบนสุดก่อนครับ แต่คงไว้ตามที่คุณสั่ง)
router.post("/create", (req, res) => {
  console.log(req.body)
  res.status(201).json({ message: 'Created' })
});

// PATCH /works/:id/assign/:techId/status -> รับคำสั่งสำหรับให้ "ช่าง" อัปเดตสถานะงาน
router.patch("/:id/assign/:techId/status", updateWorkStatus);

// PATCH /works/:id/assign/:techId/review -> รับคำสั่งสำหรับให้ "หัวหน้า" ตรวจงาน
router.patch("/:id/assign/:techId/review", reviewWork);

export default router;