// Service d'orchestration pour l'analyse de contrat Pactum AI

// --- Types ---
export interface PactumAudit {
  id: string;
  contractName: string;
  contractText: string;
  timestamp: number;
  extractor: {
    parties: string[];
    dates: string[];
    liabilities: string[];
  };
  auditor: {
    risks: Array<{
      clause: string;
      issue: string;
      severity: 'high' | 'medium' | 'low';
    }>;
    compliance_score: number; // 0 to 10
  };
  redactor: {
    rewrites: Array<{
      original: string;
      balanced: string;
    }>;
  };
}

// --- IndexedDB Configuration ---
const DB_NAME = 'PactumAIDB';
const DB_VERSION = 1;
const STORE_NAME = 'audits';

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveAudit(audit: PactumAudit): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(audit);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllAudits(): Promise<PactumAudit[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAudit(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// --- High Quality High-Risk Mock Data for Demo ---
export const HIGH_RISK_SAMPLE = `MASTER SERVICES AGREEMENT

This Agreement is made between TechGlobal Inc. ("Client") and FastCode Solutions ("Vendor").

1. PAYMENT TERMS
Client shall pay Vendor within 90 days of receipt of invoice. Late payments shall accrue interest at 15% per month.

2. LIABILITY
Vendor's total liability for any claims arising under this agreement shall be unlimited. Client agrees to indemnify Vendor against all third-party claims regardless of fault.

3. DATA PROTECTION
Vendor will process data as it sees fit. No specific security standards are guaranteed.

4. TERMINATION
Either party may terminate this agreement with 2 hours written notice via Slack.`;

const MOCK_RESPONSE_SAMPLE: Omit<PactumAudit, 'id' | 'contractName' | 'contractText' | 'timestamp'> = {
  extractor: {
    parties: ["TechGlobal Inc. (Client)", "FastCode Solutions (Vendor)"],
    dates: ["Effective: Upon signing", "Expiration: Indefinite (until terminated)"],
    liabilities: [
      "Vendor's liability: Unlimited",
      "Client indemnifies Vendor against all third-party claims regardless of fault"
    ]
  },
  auditor: {
    compliance_score: 2.5,
    risks: [
      {
        clause: "Résiliation sans préavis (2 heures)",
        issue: "Une clause de résiliation sous 2 heures par Slack est extrêmement risquée en droit commercial. Elle ne permet pas de transition opérationnelle et viole le principe de préavis raisonnable.",
        severity: "high"
      },
      {
        clause: "Responsabilité illimitée du prestataire",
        issue: "La responsabilité illimitée du Vendor couplée à une obligation d'indemnisation inconditionnelle est une clause abusivement déséquilibrée pouvant conduire à la faillite commerciale.",
        severity: "high"
      },
      {
        clause: "Taux de retard usuraire (15% par mois)",
        issue: "Un intérêt de retard de 15% par mois équivaut à 180% par an. C'est un taux usuraire illégal dans la majorité des pays (OHADA / Europe / USA). Le taux standard de retard doit être aligné sur le taux légal en vigueur.",
        severity: "high"
      },
      {
        clause: "Défaut de conformité des données (GDPR)",
        issue: "Traiter les données 'comme bon lui semble' sans engagement de sécurité viole directement l'obligation de DPA (Data Processing Agreement) requise par le RGPD (GDPR).",
        severity: "medium"
      }
    ]
  },
  redactor: {
    rewrites: [
      {
        original: "Either party may terminate this agreement with 2 hours written notice via Slack.",
        balanced: "Either party may terminate this Agreement for convenience upon thirty (30) days prior written notice to the other party, sent via registered mail with acknowledgment of receipt or verified corporate email."
      },
      {
        original: "Vendor's total liability for any claims arising under this agreement shall be unlimited. Client agrees to indemnify Vendor against all third-party claims regardless of fault.",
        balanced: "Vendor's aggregate liability under this Agreement shall be limited to the total fees paid by Client to Vendor in the twelve (12) months preceding the claim. Each party shall indemnify the other only for direct damages resulting from its gross negligence or willful misconduct."
      },
      {
        original: "Late payments shall accrue interest at 15% per month.",
        balanced: "Late payments shall accrue interest at the rate of 1% per month (12% per annum) or the maximum rate permitted by applicable law, whichever is lower."
      },
      {
        original: "Vendor will process data as it sees fit. No specific security standards are guaranteed.",
        balanced: "Vendor shall process personal data exclusively in compliance with the Data Processing Agreement (DPA) attached hereto as Exhibit B, in accordance with GDPR and applicable laws, implementing standard technical and organizational security measures."
      }
    ]
  }
};

// Simple Fallback Generator for custom contracts during simulation/mock mode
function generateGenericMock(text: string): Omit<PactumAudit, 'id' | 'contractName' | 'contractText' | 'timestamp'> {
  // Simple regex-based extractions to feel "smart"
  const partyRegex = /between\s+([A-Z][a-zA-Z0-9\s,.]+)\s+\(?["'](Client|Vendor|Party A)["']\)?\s+and\s+([A-Z][a-zA-Z0-9\s,.]+)\s+\(?["'](Vendor|Client|Party B)["']\)?/i;
  const match = text.match(partyRegex);
  
  const parties = match ? [match[1].trim(), match[3].trim()] : ["Party A (Client)", "Party B (Provider)"];
  
  return {
    extractor: {
      parties,
      dates: ["Effective Date: Provisory", "Expiration: 1 Year from sign-off"],
      liabilities: ["Governing Law: Default jurisdiction", "Standard Limitation of Liability: 1x Contract Value"]
    },
    auditor: {
      compliance_score: 7.2,
      risks: [
        {
          clause: "Jurisdiction & Governing Law",
          issue: "No specific governing law was explicitly found in the first section. This could lead to jurisdictional disputes if not clearly defined.",
          severity: "medium"
        },
        {
          clause: "Intellectual Property Clause",
          issue: "Ensure that background IP remains with the creator, and only custom deliverables are transferred upon full payment. A default clause should be inserted.",
          severity: "low"
        }
      ]
    },
    redactor: {
      rewrites: [
        {
          original: "Governing law not specified.",
          balanced: "This Agreement shall be governed by and construed in accordance with the commercial laws of the primary place of business of the Vendor, without giving effect to conflict of laws principles."
        }
      ]
    }
  };
}

// --- Orchestrated Analysis Function ---
export interface AnalysisProgress {
  status: 'idle' | 'initializing' | 'extracting' | 'auditing' | 'redacting' | 'saving' | 'complete';
  message: string;
  percentage: number;
}

export async function runContractAnalysis(
  contractText: string,
  mode: 'local' | 'cloud' | 'simulation',
  onProgress: (prog: AnalysisProgress) => void
): Promise<PactumAudit> {
  const auditId = 'audit_' + Date.now().toString(36);
  
  // Extract a brief name
  const titleMatch = contractText.match(/^([^\n]+)/);
  const contractName = titleMatch ? titleMatch[1].substring(0, 50).trim() : 'Contract Audit ' + new Date().toLocaleDateString();

  if (mode === 'simulation') {
    // Elegant Multi-Agent handoff simulation with progress reporting
    onProgress({ status: 'initializing', message: 'Starting Pactum Local Engine (Simulated)...', percentage: 10 });
    await new Promise(r => setTimeout(r, 600));

    onProgress({ status: 'extracting', message: 'Agent [Extractor] identifying parties, dates and liability scopes...', percentage: 35 });
    await new Promise(r => setTimeout(r, 900));

    onProgress({ status: 'auditing', message: 'Agent [Auditor] scanning against legal rulesets & OHADA/GDPR standards...', percentage: 65 });
    await new Promise(r => setTimeout(r, 900));

    onProgress({ status: 'redacting', message: 'Agent [Redactor] drafting fair, professional alternative clauses...', percentage: 85 });
    await new Promise(r => setTimeout(r, 700));

    onProgress({ status: 'saving', message: 'Persisting audit in local IndexedDB...', percentage: 95 });
    await new Promise(r => setTimeout(r, 300));

    const isHighRisk = contractText.includes('TechGlobal Inc.') || contractText.includes('90 days') || contractText.includes('2 hours');
    const baseData = isHighRisk ? MOCK_RESPONSE_SAMPLE : generateGenericMock(contractText);
    
    const result: PactumAudit = {
      id: auditId,
      contractName,
      contractText,
      timestamp: Date.now(),
      ...baseData
    };

    await saveAudit(result);
    onProgress({ status: 'complete', message: 'Audit completed!', percentage: 100 });
    return result;
  }

  if (mode === 'cloud') {
    // Communicate with our Gemini API endpoints defined in server.ts
    onProgress({ status: 'initializing', message: 'Connecting to Gemini Secure Cloud Pipeline...', percentage: 10 });
    
    try {
      onProgress({ status: 'extracting', message: 'Agent [Extractor] scanning document variables...', percentage: 30 });
      const extRes = await fetch('/api/agents/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contractText })
      });
      if (!extRes.ok) throw new Error('Extractor failed');
      const extData = await extRes.json();

      onProgress({ status: 'auditing', message: 'Agent [Auditor] analyzing risks and compliance scores...', percentage: 60 });
      const audRes = await fetch('/api/agents/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contractText, playbookId: 'us_tech' })
      });
      if (!audRes.ok) throw new Error('Auditor failed');
      const audData = await audRes.json();

      onProgress({ status: 'redacting', message: 'Agent [Redactor] generating optimized alternative rewrites...', percentage: 85 });
      
      // We will perform rewrites on all high/medium severity risks
      const rewrites: Array<{ original: string; balanced: string }> = [];
      const flags = audData.flags || [];
      
      for (const flag of flags) {
        if (flag.severity === 'high' || flag.severity === 'medium') {
          try {
            const redRes = await fetch('/api/agents/redact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ originalText: flag.originalText || flag.risk, risk: flag.risk, clause: flag.clause })
            });
            if (redRes.ok) {
              const redData = await redRes.json();
              rewrites.push({
                original: flag.originalText || flag.risk,
                balanced: redData.redactedText || 'Rewritten clause'
              });
            }
          } catch (e) {
            // Ignore single failures and continue
          }
        }
      }

      onProgress({ status: 'saving', message: 'Saving results to local archive...', percentage: 95 });
      
      // Calculate a mockup compliance score if not directly supplied (10 - number of high risks * 2 - medium risks * 1)
      const highRiskCount = flags.filter((f: any) => f.severity === 'high').length;
      const medRiskCount = flags.filter((f: any) => f.severity === 'medium').length;
      const score = Math.max(0, Math.min(10, 10 - (highRiskCount * 2) - (medRiskCount * 0.75)));

      const result: PactumAudit = {
        id: auditId,
        contractName,
        contractText,
        timestamp: Date.now(),
        extractor: {
          parties: extData.parties || ["Not specified"],
          dates: [
            extData.dates?.effective ? `Effective: ${extData.dates.effective}` : "Effective: N/A",
            extData.dates?.expiration ? `Expiration: ${extData.dates.expiration}` : "Expiration: N/A"
          ],
          liabilities: extData.liability ? [extData.liability] : ["No explicit limitation found"]
        },
        auditor: {
          risks: flags.map((f: any) => ({
            clause: f.clause || 'Risque',
            issue: f.risk || 'Clause déséquilibrée',
            severity: (f.severity === 'high' || f.severity === 'medium' || f.severity === 'low') ? f.severity : 'medium'
          })),
          compliance_score: parseFloat(score.toFixed(1))
        },
        redactor: {
          rewrites: rewrites.length > 0 ? rewrites : [
            { original: "See risks for individual clauses.", balanced: "Clauses balanced individually." }
          ]
        }
      };

      await saveAudit(result);
      onProgress({ status: 'complete', message: 'Audit completed!', percentage: 100 });
      return result;

    } catch (err: any) {
      console.error(err);
      throw new Error('Cloud analysis failed. Make sure server is running and GEMINI_API_KEY is configured.');
    }
  }

  // local mode using the Web Worker with MediaPipe
  return new Promise((resolve, reject) => {
    onProgress({ status: 'initializing', message: 'Spawning Web Worker & loading model (First launch can take time)...', percentage: 10 });
    
    try {
      const worker = new Worker(new URL('../workers/contractWorker.ts', import.meta.url), {
        type: 'module'
      });

      // Timeout safety (2 minutes)
      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Local engine execution timed out. Gemma 2B model takes a long time to load. Please try Simulation/Mock or Cloud mode.'));
      }, 120000);

      worker.onmessage = async (e: MessageEvent) => {
        const { type, status, message, data, error } = e.data;

        if (type === 'status') {
          if (status === 'loading_wasm') {
            onProgress({ status: 'initializing', message: 'Loading WebAssembly support files...', percentage: 20 });
          } else if (status === 'loading_model') {
            onProgress({ status: 'initializing', message: 'Downloading/Loading local Gemma-2B IT model into browser cache...', percentage: 40 });
          } else if (status === 'ready') {
            onProgress({ status: 'initializing', message: 'Gemma 2B engine ready! Initiating contract scan...', percentage: 50 });
            worker.postMessage({ action: 'analyze', text: contractText });
          } else if (status === 'analyzing') {
            onProgress({ status: 'auditing', message: 'Running 3-Agent pipeline locally on WebGPU/CPU...', percentage: 75 });
          }
        } else if (type === 'result') {
          clearTimeout(timeout);
          worker.terminate();
          onProgress({ status: 'saving', message: 'Saving results to local secure archive...', percentage: 95 });

          try {
            // Parse local Gemma response
            const parsedData = JSON.parse(data);
            
            const result: PactumAudit = {
              id: auditId,
              contractName,
              contractText,
              timestamp: Date.now(),
              extractor: {
                parties: parsedData.extractor?.parties || ["Not specified"],
                dates: parsedData.extractor?.dates || ["N/A"],
                liabilities: parsedData.extractor?.liabilities || ["N/A"]
              },
              auditor: {
                risks: parsedData.auditor?.risks || [],
                compliance_score: parsedData.auditor?.compliance_score ?? 5.0
              },
              redactor: {
                rewrites: parsedData.redactor?.rewrites || []
              }
            };

            await saveAudit(result);
            onProgress({ status: 'complete', message: 'Audit completed locally!', percentage: 100 });
            resolve(result);
          } catch (pErr) {
            // Attempt to clean JSON in case of bad generation formatting
            console.error("Failed to parse LLM response directly, attempting fallback cleaner", data);
            reject(new Error("Local LLM generated invalid JSON formatting. Try using Cloud or Simulation mode."));
          }
        } else if (type === 'error') {
          clearTimeout(timeout);
          worker.terminate();
          reject(new Error(error || 'Web Worker internal execution error'));
        }
      };

      // Initialize the worker with defaults
      worker.postMessage({ action: 'init' });

    } catch (e: any) {
      reject(new Error('Unable to create Web Worker: ' + e.message));
    }
  });
}
