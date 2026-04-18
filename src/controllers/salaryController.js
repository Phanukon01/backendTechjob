import pool from "../config/db.js";

const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// PUT /salary/user/:userId — อัปเดตเงินเดือนของพนักงาน
export const updateSalary = async (userId, { salary }) => {
  return await query(
    `UPDATE users SET salary = ? WHERE user_id = ?`,
    [salary, userId]
  );
};
