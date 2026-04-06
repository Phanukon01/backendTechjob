import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./src/routes/userRoutes.js";
import materialRoutes from "./src/routes/materialRoutes.js";
import workRoutes from "./src/routes/workRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 8000;

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/materials", materialRoutes);
app.use("/works", workRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
