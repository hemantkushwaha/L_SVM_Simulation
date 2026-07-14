import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load local environment variables (if any)
dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Express middlewares
  app.use(express.json());

  // API Route: Explain SVM boundary using Gemini
  app.post("/api/explain", async (req, res) => {
    try {
      const { points, params, metrics, question } = req.body;

      const ai = getGeminiClient();

      // Construct a highly descriptive prompt for the AI Coach
      const prompt = `
You are an expert Machine Learning Laboratory AI Tutor. Your goal is to guide students on understanding Support Vector Machines (SVM).
The student is currently running an interactive SVM simulation with the following details:

- Dataset size: ${points ? points.length : 0} points in 2D space.
- Kernel function: ${params?.kernel || 'unknown'}
- Hyperparameters: C = ${params?.C || 'N/A'}, gamma = ${params?.gamma || 'N/A'}, degree = ${params?.degree || 'N/A'}, class_weight = ${params?.classWeight || 'N/A'}
- Model Performance Metrics:
  * Accuracy: ${metrics ? (metrics.accuracy * 100).toFixed(1) + '%' : 'N/A'}
  * Precision: ${metrics ? (metrics.precision * 100).toFixed(1) + '%' : 'N/A'}
  * Recall: ${metrics ? (metrics.recall * 100).toFixed(1) + '%' : 'N/A'}
  * F1 Score: ${metrics ? (metrics.f1 * 100).toFixed(1) + '%' : 'N/A'}
  * Confusion Matrix: TN=${metrics?.confusionMatrix?.tn ?? 0}, FP=${metrics?.confusionMatrix?.fp ?? 0}, FN=${metrics?.confusionMatrix?.fn ?? 0}, TP=${metrics?.confusionMatrix?.tp ?? 0}
  * Support Vectors count: ${metrics?.supportVectorIndices ? metrics.supportVectorIndices.length : 'N/A'}

${question ? `The student is currently stuck on this specific lab question: "${question}"` : 'Please provide a general educational analysis of their decision boundary. Is it overfitting? Underfitting? What can they tune next? Keep your explanation brief, visual, and highly encouraging.'}

Give your answer in a helpful, conversational, easy-to-understand student tone using Markdown. Keep it targeted, concise (less than 300 words), and focus on explaining the geometric intuition (margins, separation boundaries, support vectors) of their choices. Do not give complex formulas unless it is direct.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ explanation: response.text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Serve static files / Vite middleware
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

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
  process.exit(1);
});
