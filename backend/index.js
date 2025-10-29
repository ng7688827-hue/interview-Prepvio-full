import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import companyRoutes from "./routes/companyRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ✅ Use Routes
app.use("/api/companies", companyRoutes);

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
