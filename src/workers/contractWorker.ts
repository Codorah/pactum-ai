import { FilesetResolver, LlmInference } from "@mediapipe/tasks-genai";

let llmInference: any = null;

async function initGemma(modelPath: string = "gemma-2b-it-cpu.tflite", wasmPath: string = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm") {
  try {
    self.postMessage({ type: 'status', status: 'loading_wasm', message: 'Loading WebAssembly files...' });
    const genai = await FilesetResolver.forGenAiTasks(wasmPath);
    
    self.postMessage({ type: 'status', status: 'loading_model', message: 'Loading Gemma 2B model...' });
    llmInference = await LlmInference.createFromOptions(genai, {
      baseOptions: { modelAssetPath: modelPath },
    });
    self.postMessage({ type: 'status', status: 'ready', message: 'Local AI engine ready' });
  } catch (error: any) {
    self.postMessage({ type: 'error', error: error.message || 'Failed to initialize MediaPipe Gemma' });
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { action, text, modelPath, wasmPath } = e.data;
  
  if (action === 'init') {
    await initGemma(modelPath, wasmPath);
  } else if (action === 'analyze') {
    if (!llmInference) {
      self.postMessage({ type: 'error', error: 'AI engine not initialized' });
      return;
    }
    
    self.postMessage({ type: 'status', status: 'analyzing', message: 'Running multi-agent pipeline...' });
    
    const prompt = `You are Pactum AI. Your role is to act as an autonomous pipeline of 3 legal agents. For the contract text provided below, you MUST respond EXCLUSIVELY with the following strict JSON schema:

{
  "extractor": {
    "parties": ["party A", "party B"],
    "dates": ["Effective: date", "Expiration: date"],
    "liabilities": ["limitation of liability clause details"]
  },
  "auditor": {
    "risks": [
      {
        "clause": "Name of risky clause",
        "issue": "Detailed legal issue explanation under commercial law standard",
        "severity": "high" | "medium" | "low"
      }
    ],
    "compliance_score": 0-10
  },
  "redactor": {
    "rewrites": [
      {
        "original": "Original raw clause text",
        "balanced": "Rewritten professional, balanced, fair clause text"
      }
    ]
  }
}

Instructions:
- Extractor: Identify critical contract variables.
- Auditor: Analyze risks carefully. Flag one-sided, abusive or high-liability clauses (like termination with 2 hours notice, unlimited liability, Net 90 payment).
- Redactor: Propose professional, balanced alternative drafting.

[CONTRACT]:
${text}

[OUTPUT_FORMAT]: JSON`;

    try {
      const response = await llmInference.generateResponse(prompt);
      self.postMessage({ type: 'result', data: response });
    } catch (error: any) {
      self.postMessage({ type: 'error', error: error.message || 'Inference failed' });
    }
  }
};
