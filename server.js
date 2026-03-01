require("dotenv").config();
const express = require("express");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(helmet());
app.use(cors());

const PRICE_PER_MILLION = Number(process.env.PRICE_PER_MILLION || 3.5);
const CASH_NUMBER = process.env.CASH_NUMBER || "01023797028";

app.use(express.static(path.join(__dirname, "public")));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.get("/api/config", (_, res) => {
  res.json({ pricePerMillion: PRICE_PER_MILLION, cashNumber: CASH_NUMBER });
});

app.post("/api/order", upload.single("proof"), async (req, res) => {
  try {
    const { probotId, millions } = req.body;
    const total = Number(millions) * PRICE_PER_MILLION;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.TO_EMAIL || process.env.SMTP_USER,
      subject: "طلب جديد ProBot Credit",
      text: `
ProBot ID: ${probotId}
Millions: ${millions}
Total: ${total} EGP
      `,
      attachments: req.file ? [{ path: req.file.path }] : []
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
