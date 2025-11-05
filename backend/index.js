// server.js (Integrated Backend with Feedback Under Each User Response)

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import PDFDocument from "pdfkit";
import companyRoutes from "./routes/companyRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// --- 1. MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// --- 2. Cloudflare R2 Configuration ---
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// --- 3. PDF Generation & Upload Route ---
app.post("/api/upload", async (req, res) => {
  try {
    const { filename, content, role, companyType } = req.body;
    if (!filename || !content)
      return res.status(400).json({ error: "Filename and content required." });

    const sanitizedFilename = filename.endsWith(".pdf")
      ? filename
      : `${filename}.pdf`;
    const uniqueFilename = `interviews/${Date.now()}-${sanitizedFilename}`;

    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
      const chunks = [];

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      const contentWidth = pageWidth - 2 * margin;
      const userIndent = 200;

      // Header
      doc.fillColor("#1E40AF").rect(0, 0, pageWidth, 80).fill();
      doc.fillColor("#FFFFFF").fontSize(20).font("Helvetica-Bold").text("AI Mock Interview Report", margin, 25);
      doc.fontSize(11).font("Helvetica").text(`Position: ${role || "N/A"}  •  Company: ${companyType || "N/A"}`, margin, 55);
      doc.moveDown(2);

      const lines = content.split("\n");
      let lastUserMessage = false;

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) {
          doc.moveDown(0.5);
          continue;
        }

        // === FINAL ANALYSIS ===
        if (trimmed === "=== FINAL ANALYSIS ===") {
          doc.addPage();
          doc.moveDown(0.5);
          doc.fillColor("#059669")
            .fontSize(18)
            .font("Helvetica-Bold")
            .text("--- Performance Analysis & Recommendations ---", { lineGap: 10 });
          doc.moveDown(1);
          lastUserMessage = false;
          continue;
        }

        let prefix = "";
        let message = trimmed;
        let isChat = false;
        let currentX = margin;
        let chatWidth = contentWidth;

        // --- Horizontal Line before AI Interview Section ---
        if (trimmed.startsWith("AI:") || trimmed.startsWith("Assistant:")) {
          doc.moveDown(0.5);
          doc.strokeColor("#9CA3AF")
            .lineWidth(0.5)
            .moveTo(margin, doc.y)
            .lineTo(pageWidth - margin, doc.y)
            .stroke();
          doc.moveDown(0.5);
        }

        // Chat message types
        if (trimmed.startsWith("AI:") || trimmed.startsWith("Assistant:")) {
          isChat = true;
          lastUserMessage = false;
          prefix = "AI Interviewer: ";
          message = trimmed.replace(/^(AI:|Assistant:)\s*/i, "").trim();
          doc.fillColor("#1E40AF").font("Helvetica-Bold").fontSize(10);
        } else if (trimmed.startsWith("User:")) {
          isChat = true;
          lastUserMessage = true;
          prefix = "You: ";
          message = trimmed.replace(/^User:\s*/i, "").trim();
          doc.fillColor("#059669").font("Helvetica-Bold").fontSize(10);
          currentX = margin + userIndent;
          chatWidth = contentWidth - userIndent;
        }

        if (isChat) {
          doc.x = currentX;
          doc.text(prefix, { continued: true, width: chatWidth });
          doc.fillColor("#333333").font("Helvetica").text(message, { width: chatWidth });
          doc.moveDown(0.5);

          // 🟡 Immediately check next line for feedback (FIXED LOGIC FROM server.js)
          const nextLine = lines[i + 1] ? lines[i + 1].trim() : "";
          if (
            lastUserMessage &&
            (nextLine.startsWith("[Feedback]:") ||
              nextLine.startsWith("Suggestions for Improvement:"))
          ) {
            const feedbackLine = lines[i + 1].trim();
            let suggestion = "";
            let exampleImprovement = "";

            if (feedbackLine.startsWith("[Feedback]:")) {
              const fullFeedback = feedbackLine.replace(/^\[Feedback]:\s*/i, "").trim();
              const parts = fullFeedback.split("|||");
              suggestion = parts[0].trim();
              exampleImprovement = parts[1] ? parts[1].trim() : "";
            } else {
              suggestion = feedbackLine.replace("Suggestions for Improvement:", "").trim();
              const possibleExample = lines[i + 2] ? lines[i + 2].trim() : "";
              if (possibleExample.startsWith("Example Improvement:")) {
                exampleImprovement = possibleExample.replace("Example Improvement:", "").trim();
              }
            }

            // ✅ PROPERLY CALCULATE BOX HEIGHT (from server.js)
            const feedbackX = margin + userIndent;
            const feedbackWidth = contentWidth - userIndent;
            const padding = 10;

            // Calculate heights for each component
            doc.font("Helvetica-Bold").fontSize(10);
            const headerHeight = doc.heightOfString("SUGGESTION:", {
              width: feedbackWidth - 2 * padding,
            });
            
            doc.font("Helvetica").fontSize(9);
            const suggestionHeight = doc.heightOfString(suggestion, {
              width: feedbackWidth - 2 * padding,
              lineGap: 3,
            });

            let exampleHeight = 0;
            if (exampleImprovement) {
              doc.font("Helvetica-Bold").fontSize(9);
              const exampleHeaderHeight = doc.heightOfString("Example Improvement:", {
                width: feedbackWidth - 2 * padding,
              });
              doc.font("Helvetica").fontSize(9);
              const exampleTextHeight = doc.heightOfString(exampleImprovement, {
                width: feedbackWidth - 2 * padding,
                lineGap: 3,
              });
              exampleHeight = exampleHeaderHeight + exampleTextHeight + 5;
            }

            const contentInternalHeight = headerHeight + suggestionHeight + exampleHeight;
            const blockHeight = contentInternalHeight + 2 * padding + 15;

            // Check if we need a new page
            if (doc.y + blockHeight + 10 > pageHeight - 60) {
              doc.addPage();
            }

            const initialY = doc.y;

            // Draw feedback background
            doc.fillColor("#FFFBEB")
              .rect(feedbackX, initialY, feedbackWidth, blockHeight)
              .fill();
            doc.strokeColor("#FBBF24")
              .rect(feedbackX, initialY, feedbackWidth, blockHeight)
              .lineWidth(1.5)
              .stroke();

            doc.x = feedbackX + padding;
            let currentTextY = initialY + padding;
            doc.y = currentTextY;

            // Suggestion Header
            doc.fillColor("#B45309").font("Helvetica-Bold").fontSize(10);
            doc.text("SUGGESTION:", { width: feedbackWidth - 2 * padding });

            // Suggestion Body
            currentTextY = doc.y + 2;
            doc.y = currentTextY;
            doc.fillColor("#78350F").font("Helvetica").fontSize(9);
            doc.text(suggestion, {
              width: feedbackWidth - 2 * padding,
              lineGap: 3,
            });

            // Example Improvement
            if (exampleImprovement) {
              currentTextY = doc.y + 5;
              doc.y = currentTextY;

              doc.fillColor("#B45309").font("Helvetica-Bold").fontSize(9);
              doc.text("Example Improvement:", { width: feedbackWidth - 2 * padding });

              currentTextY = doc.y + 2;
              doc.y = currentTextY;
              doc.fillColor("#78350F").font("Helvetica").fontSize(9);
              doc.text(exampleImprovement, {
                width: feedbackWidth - 2 * padding,
                lineGap: 3,
              });
            }

            doc.y = initialY + blockHeight;

            // Full separator after feedback block
            doc.moveDown(0.5);
            doc.strokeColor("#9CA3AF")
              .lineWidth(0.5)
              .moveTo(margin, doc.y)
              .lineTo(pageWidth - margin, doc.y)
              .stroke();

            doc.moveDown(0.5);

            // Skip the feedback line(s) we just processed
            i++; // Skip [Feedback]: line
            if (exampleImprovement && lines[i + 1] && lines[i + 1].trim().startsWith("Example Improvement:")) {
              i++; // Skip Example Improvement line if it was separate
            }
          }
          continue;
        }

        // Regular analysis content
        doc.x = margin;
        doc.fillColor("#333333").font("Helvetica").fontSize(11);
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          const headerText = trimmed.replace(/\*\*/g, "");
          doc.moveDown(0.5);
          doc.font("Helvetica-Bold").fontSize(12).text(headerText);
          doc.moveDown(0.5);
        } else if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
          const bulletText = trimmed.substring(1).trim();
          doc.font("Helvetica").fontSize(11);
          doc.text(`• ${bulletText}`, { indent: 15, lineGap: 3 });
        } else if (/^\d+\./.test(trimmed)) {
          doc.font("Helvetica").fontSize(11);
          doc.text(trimmed, { indent: 15, lineGap: 3 });
        } else {
          doc.font("Helvetica").fontSize(11).text(trimmed);
          doc.moveDown(0.2);
        }
      }

      // Footer
      const footerText = "🤖 Generated by AI Interview Assistant";
      doc.flushPages();
      const pageCount = doc.bufferedPageRange().count;
      
      for (let j = 0; j < pageCount; j++) {
        doc.switchToPage(j);
        doc.moveTo(margin, pageHeight - 50)
          .lineTo(pageWidth - margin, pageHeight - 50)
          .stroke("#9CA3AF");
        
        doc.fillColor("#9CA3AF")
          .fontSize(9)
          .font("Helvetica-Oblique")
          .text(footerText, 0, pageHeight - 40, { align: "center", width: pageWidth });
        
        doc.text(`Page ${j + 1} of ${pageCount}`, pageWidth - margin - 50, pageHeight - 40, {
          align: "right",
          width: 100,
        });
      }

      doc.end();
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    // --- Upload to Cloudflare R2 ---
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFilename,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    });
    await r2Client.send(uploadCommand);

    const publicUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${uniqueFilename}`;
    res.json({ success: true, publicUrl });
  } catch (err) {
    console.error("PDF Upload Error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// --- 4. Routes ---
app.use("/api/companies", companyRoutes);
app.use("/api/interview", interviewRoutes);

// --- 5. Health checks ---
app.get("/", (req, res) => {
  res.send("🚀 Virtual Interview Backend Running Successfully!");
});
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// --- 6. Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (process.env.R2_BUCKET_NAME) console.log(`📁 R2 Bucket: ${process.env.R2_BUCKET_NAME}`);
});