import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Gemini Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Playbooks (Internal Mock Database for Hackathon)
const playbooks: Record<string, any> = {
  "us_tech": {
    name: "US Tech Vendor Standard",
    rules: [
      { id: "L1", clause: "Liability Cap", standard: "Should not exceed 12 months fees.", severity: "high" },
      { id: "I1", clause: "Indemnification", standard: "Should be mutual, not one-sided.", severity: "medium" },
      { id: "T1", clause: "Termination for Convenience", standard: "Should require at least 30 days notice.", severity: "medium" },
      { id: "P1", clause: "Payment Terms", standard: "Should not exceed Net 60.", severity: "low" }
    ]
  },
  "eu_gdpr": {
    name: "EU Commercial Code (GDPR focus)",
    rules: [
      { id: "D1", clause: "Data Processing", standard: "Must explicitly mention DPA and GDPR compliance.", severity: "high" },
      { id: "L2", clause: "Governing Law", standard: "Should be within EU member states.", severity: "medium" },
      { id: "A1", clause: "Audit Rights", standard: "Customer must have right to audit data security.", severity: "high" }
    ]
  }
};

// Agent 1: The Extractor
app.post("/api/agents/extract", async (req, res) => {
  try {
    const { text } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract core variables from this contract text into structured JSON. Focus on: Parties, Effective Date, Expiration, Liability Limits, Penalties. Output ONLY valid JSON.
      
      Contract Text: ${text.substring(0, 5000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            parties: { type: Type.ARRAY, items: { type: Type.STRING } },
            dates: {
              type: Type.OBJECT,
              properties: {
                effective: { type: Type.STRING },
                expiration: { type: Type.STRING }
              }
            },
            liability: { type: Type.STRING },
            penalties: { type: Type.STRING },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    res.json(JSON.parse(response.text!));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agent 2: The Auditor
app.post("/api/agents/audit", async (req, res) => {
  try {
    const { text, playbookId } = req.body;
    const playbook = playbooks[playbookId] || playbooks["us_tech"];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a legal auditor. Compare the provided contract text against these compliance standards:
      ${JSON.stringify(playbook.rules)}
      
      Flag high-risk or abusive clauses. For each flag, provide: clause name, risk description, severity (low, medium, high), and the original text segment.
      
      Output ONLY valid JSON.
      
      Contract Text: ${text.substring(0, 5000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              clause: { type: Type.STRING },
              risk: { type: Type.STRING },
              severity: { type: Type.STRING },
              originalText: { type: Type.STRING }
            }
          }
        }
      }
    });

    res.json({ playbookName: playbook.name, flags: JSON.parse(response.text!) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agent 3: The Redactor
app.post("/api/agents/redact", async (req, res) => {
  try {
    const { originalText, risk, clause } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a legal redactor. Rewrite the following flagged clause to be balanced and fair for both parties, while addressing the specified risk. Maintain a professional legal tone.
      
      Clause: ${clause}
      Risk: ${risk}
      Original Segment: ${originalText}
      
      Return ONLY the rewritten text.`,
    });

    res.json({ redactedText: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
