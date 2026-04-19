import express from "express";
import {
  updateSalary,
} from "../controllers/salaryController.js";

const salaryRouter = express.Router();

// --- หมวดหมู่ Salary ---

// PUT /salary/:id — แก้ไขรายการเงินเดือน
salaryRouter.put("/:id", async (req, res) => {
  // #swagger.tags = ['Salary']
  // #swagger.summary = 'แก้ไขรายการเงินเดือน (amount, bonus, deduction, note)'
  /* #swagger.parameters['id'] = { description: 'Salary ID' } */
  /* #swagger.parameters['body'] = {
      in: 'body',
      schema: { amount: 28000, bonus: 2000, deduction: 500, note: 'ปรับเงินเดือน' }
  } */
  try {
    const result = await updateSalary(req.params.id, req.body);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Not Found" });
    res.status(200).json({ message: "Updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



export default salaryRouter;