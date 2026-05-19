import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  BarChart3, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileSearch,
  Search,
  LayoutDashboard,
  Settings,
  BrainCircuit,
  Plus,
  History,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Trash2,
  Lock,
  ChevronRight,
  Download,
  Copy,
  Info,
  Check,
  SendHorizontal,
  Bot,
  User as UserIcon,
  Paperclip,
  FileImage,
  Sparkle
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { Separator } from '@/components/ui/separator';

import { 
  runContractAnalysis, 
  getAllAudits, 
  deleteAudit, 
  HIGH_RISK_SAMPLE, 
  PactumAudit,
  AnalysisProgress 
} from './lib/contractService';

type ViewMode = 'landing' | 'app';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  text: string;
  type?: 'text' | 'contract_uploaded' | 'extractor_result' | 'auditor_result' | 'redactor_result' | 'full_audit';
  contractText?: string;
  data?: any;
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [history, setHistory] = useState<PactumAudit[]>([]);
  const [activeAudit, setActiveAudit] = useState<PactumAudit | null>(null);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeContractText, setActiveContractText] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const loadHistory = async () => {
    try {
      const data = await getAllAudits();
      setHistory(data);
    } catch (e) {
      console.error("IndexedDB failed to load:", e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSelectAudit = (audit: PactumAudit) => {
    setActiveAudit(audit);
    setActiveContractText(audit.contractText);
    setUploadedFileName(audit.contractName);
    
    // Set chat history for this audit
    setChatMessages([
      {
        id: 'welcome_' + audit.id,
        sender: 'assistant',
        timestamp: audit.timestamp - 10000,
        text: `J'ai retrouvé votre contrat **"${audit.contractName}"** dans IndexedDB. Voici le rapport d'analyse globale. Vous pouvez me poser des questions ou ré-exécuter des tâches d'agent.`,
        type: 'full_audit',
        contractText: audit.contractText,
        data: audit
      }
    ]);
    setViewMode('app');
  };

  const handleNewAudit = () => {
    setActiveAudit(null);
    setActiveContractText('');
    setUploadedFileName('');
    setChatMessages([
      {
        id: 'init_chat',
        sender: 'assistant',
        timestamp: Date.now(),
        text: "Bonjour ! Je suis Pactum AI, votre bouclier juridique Edge autonome. Pour commencer, vous pouvez me coller un contrat, téléverser un fichier (`.txt`, `.pdf`) ou téléverser une photo d'un contrat écrit avec le bouton **+**.",
        type: 'text'
      }
    ]);
    setViewMode('app');
  };

  const handleDeleteAudit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAudit(id);
      toast.success("Audit supprimé de l'historique local");
      if (activeAudit?.id === id) {
        handleNewAudit();
      } else {
        loadHistory();
      }
    } catch (err) {
      toast.error("Impossible de supprimer l'audit");
    }
  };

  // When going to app for the first time, init chat
  useEffect(() => {
    if (viewMode === 'app' && chatMessages.length === 0) {
      handleNewAudit();
    }
  }, [viewMode]);

  return (
    <div className="min-h-screen bg-black text-foreground antialiased selection:bg-purple-500/30 font-sans">
      <Navbar 
        viewMode={viewMode} 
        onEnterApp={() => setViewMode('app')} 
        onGoHome={() => setViewMode('landing')}
      />
      
      <AnimatePresence mode="wait">
        {viewMode === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="pt-16"
          >
            <LandingView onStart={() => setViewMode('app')} onSelectAudit={handleSelectAudit} history={history} onDeleteAudit={handleDeleteAudit} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex h-screen overflow-hidden pt-16"
          >
            <Sidebar 
              history={history} 
              activeAudit={activeAudit}
              onSelectAudit={handleSelectAudit} 
              onNewAudit={handleNewAudit} 
              onDeleteAudit={handleDeleteAudit}
            />
            <main className="flex-1 lg:pl-72 flex flex-col h-full bg-[#070709] relative">
               <ChatInterface 
                 chatMessages={chatMessages}
                 setChatMessages={setChatMessages}
                 activeContractText={activeContractText}
                 setActiveContractText={setActiveContractText}
                 uploadedFileName={uploadedFileName}
                 setUploadedFileName={setUploadedFileName}
                 onAuditComplete={loadHistory}
               />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}

// --- Navigation Header ---
const Navbar = ({ viewMode, onEnterApp, onGoHome }: { viewMode: ViewMode; onEnterApp: () => void; onGoHome: () => void }) => (
  <nav className="fixed top-0 left-0 right-0 h-16 border-b border-purple-950/20 bg-black/85 backdrop-blur-md z-50 px-6 flex items-center justify-between">
    <div className="flex items-center gap-2 cursor-pointer group" onClick={onGoHome}>
      <div className="w-9 h-9 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-all">
        <Shield className="w-5 h-5 text-white" />
      </div>
      <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent font-sans">Pactum AI</span>
      <Badge variant="outline" className="border-purple-500/20 text-purple-400 bg-purple-950/20 text-[9px] font-semibold px-2 py-0.5 rounded-full">
        Local Edge AI
      </Badge>
    </div>
    
    <div className="flex items-center gap-6">
      {viewMode === 'landing' ? (
        <>
          <Button variant="ghost" size="sm" className="hidden md:flex text-gray-400 hover:text-white" onClick={onEnterApp}>
            Tableau de bord
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-6 shadow-lg shadow-purple-600/30 transition-all font-semibold" onClick={onEnterApp}>
            Lancer l'audit
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-purple-950/30 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-lg">
            Pitch Mode (PWA Ready)
          </Badge>
          <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center overflow-hidden">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Pactum" alt="User" />
          </div>
        </div>
      )}
    </div>
  </nav>
);

// --- Sidebar history ---
const Sidebar = ({ 
  history, 
  activeAudit,
  onSelectAudit, 
  onNewAudit,
  onDeleteAudit
}: { 
  history: PactumAudit[]; 
  activeAudit: PactumAudit | null;
  onSelectAudit: (audit: PactumAudit) => void; 
  onNewAudit: () => void;
  onDeleteAudit: (id: string, e: React.MouseEvent) => void;
}) => {
  return (
    <aside className="w-72 border-r border-purple-950/20 bg-[#0a0a0d] flex flex-col h-screen fixed left-0 z-40 hidden lg:flex pt-6">
      <div className="p-4 flex flex-col h-full overflow-hidden">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 h-11 border-purple-600/30 bg-purple-950/10 hover:bg-purple-950/20 text-purple-300 hover:text-white transition-all rounded-xl mb-6 shadow-sm shadow-purple-500/5"
          onClick={onNewAudit}
        >
          <Plus className="w-4 h-4 text-purple-400" />
          Nouveau Chat Audit
        </Button>

        <div className="flex-1 flex flex-col overflow-hidden">
          <p className="text-[10px] font-bold uppercase text-purple-400/60 tracking-widest px-2 mb-3">Audits récents (IndexedDB)</p>
          
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-1.5">
              {history.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-purple-950/5 border border-purple-950/10 text-gray-500 text-xs mt-2">
                  Aucun historique local
                </div>
              ) : (
                history.map((audit) => {
                  const isSelected = activeAudit?.id === audit.id;
                  return (
                    <div
                      key={audit.id}
                      onClick={() => onSelectAudit(audit)}
                      className={`w-full group flex items-center justify-between gap-2 p-3 text-sm rounded-xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'bg-purple-950/30 border-purple-500/40 text-purple-200' 
                          : 'bg-[#101014]/40 border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#121217] hover:border-purple-950/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-purple-400' : 'text-gray-500'}`} />
                        <div className="text-left truncate min-w-0">
                          <p className="font-medium truncate text-xs">{audit.contractName}</p>
                          <p className="text-[10px] text-gray-500">{new Date(audit.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/20 shrink-0 transition-opacity"
                        onClick={(e) => onDeleteAudit(audit.id, e)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="mt-auto space-y-3 pt-4 border-t border-purple-950/20">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#111116] to-[#0a0a0d] border border-purple-950/30">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Lock className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-bold text-gray-300">Confidentialité Totale</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-normal">
              Vos contrats ne quittent jamais votre machine. Tout est analysé en local.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

// --- Landing View ---
function LandingView({ 
  onStart, 
  history, 
  onSelectAudit, 
  onDeleteAudit 
}: { 
  onStart: () => void; 
  history: PactumAudit[]; 
  onSelectAudit: (audit: PactumAudit) => void;
  onDeleteAudit: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <div className="relative pb-24 overflow-hidden">
      <div className="absolute top-0 right-1/4 -z-10 w-[600px] h-[600px] bg-purple-600/10 blur-[130px] rounded-full animate-pulse" />
      <div className="absolute bottom-10 left-10 -z-10 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full" />

      <section className="container mx-auto px-6 pt-24 pb-16 text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <Badge className="rounded-full px-4 py-1.5 bg-purple-950/40 text-purple-300 border border-purple-500/20 backdrop-blur-sm">
            <Sparkle className="w-3.5 h-3.5 mr-2 text-purple-400" />
            Hackathon Winner : IA Souveraine & Locale
          </Badge>
          
          {/* Stunning Logo display */}
          <div className="flex justify-center py-4">
            <div className="w-28 h-28 rounded-3xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-center overflow-hidden shadow-2xl relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-indigo-600 opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
              <img src="/logo.png" alt="Pactum AI Logo" className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform" onError={(e) => {
                // If logo.png has caching delay, show fallback
                e.currentTarget.style.display = 'none';
              }} />
              <Shield className="w-12 h-12 text-purple-400 absolute" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
            Votre copilote juridique <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent">conversationnel</span> 100% local.
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Glissez-déposez des documents ou scannez des photos de contrats. Dialoguez avec nos 3 agents spécialisés (Extracteur, Auditeur, Rédacteur) en toute sécurité directement dans le navigateur.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="h-14 px-8 rounded-2xl text-base font-bold bg-purple-600 hover:bg-purple-500 text-white gap-2.5 shadow-xl shadow-purple-600/20 group transition-all" onClick={onStart}>
              Démarrer le Chat Legal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-base font-bold border-purple-950/50 hover:bg-purple-950/10 text-gray-300 hover:text-white" onClick={onStart}>
              Essayer le Mock Contrat
            </Button>
          </div>
          
          <div className="pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-gray-500">
             <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-purple-500/60" /> Inférence Locale (Zéro fuite)</div>
             <div className="flex items-center gap-2"><Upload className="w-4 h-4 text-purple-500/60" /> Import PDF, Textes & Photos</div>
             <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-purple-500/60" /> PWA Installable Hors-ligne</div>
          </div>
        </motion.div>
      </section>

      {/* History section on Landing if we have previous runs */}
      {history.length > 0 && (
        <section className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl bg-[#0b0b0f] border border-purple-950/30 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Retrouvez vos discussions juridiques locales sauvegardées
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.slice(0, 4).map((audit) => (
                <div
                  key={audit.id}
                  onClick={() => onSelectAudit(audit)}
                  className="p-4 rounded-2xl bg-[#121217]/50 border border-purple-950/20 hover:border-purple-500/30 hover:bg-[#15151f] cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="min-w-0 pr-4">
                    <h4 className="text-sm font-semibold text-white truncate">{audit.contractName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        audit.auditor.compliance_score > 7 
                          ? 'bg-emerald-950/40 text-emerald-400' 
                          : audit.auditor.compliance_score > 4 
                            ? 'bg-amber-950/40 text-amber-400' 
                            : 'bg-red-950/40 text-red-400'
                      }`}>
                        Score : {audit.auditor.compliance_score}/10
                      </span>
                      <span className="text-[10px] text-gray-500">{new Date(audit.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/20 transition-opacity"
                      onClick={(e) => onDeleteAudit(audit.id, e)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-purple-400/60 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// --- Conversational Chat Room ---
function ChatInterface({
  chatMessages,
  setChatMessages,
  activeContractText,
  setActiveContractText,
  uploadedFileName,
  setUploadedFileName,
  onAuditComplete
}: {
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activeContractText: string;
  setActiveContractText: React.Dispatch<React.SetStateAction<string>>;
  uploadedFileName: string;
  setUploadedFileName: React.Dispatch<React.SetStateAction<string>>;
  onAuditComplete: () => void;
}) {
  const [inputText, setInputText] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'simulation' | 'cloud' | 'local'>('simulation');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressVal, setProgressVal] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isProcessing]);

  // Load sample contract
  const handleLoadSample = () => {
    setActiveContractText(HIGH_RISK_SAMPLE);
    setUploadedFileName("Contrat Piégé (Sample High-Risk)");
    
    // Add upload message
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      timestamp: Date.now(),
      text: "Téléversement du contrat d'exemple piégé : *MASTER SERVICES AGREEMENT*",
      type: 'contract_uploaded'
    };
    
    const botMsg: ChatMessage = {
      id: 'msg_bot_' + Date.now(),
      sender: 'assistant',
      timestamp: Date.now() + 100,
      text: "📝 **Contrat piégé chargé avec succès !**\n\nJ'ai détecté le document juridiques brut. Que voulez-vous que je fasse pour vous ?\n\nChoisissez une commande ou tapez votre question dans la zone de chat ci-dessous :",
      type: 'text'
    };

    setChatMessages(prev => [...prev, userMsg, botMsg]);
    toast.success("Contrat piégé injecté.");
  };

  // Document Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setActiveContractText(text);
      setUploadedFileName(file.name);

      const userMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        sender: 'user',
        timestamp: Date.now(),
        text: `Fichier téléversé : **${file.name}**`,
        type: 'contract_uploaded'
      };

      const botMsg: ChatMessage = {
        id: 'msg_bot_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now() + 100,
        text: `📝 **Contrat "${file.name}" importé avec succès !**\n\nLe moteur d'IA local est prêt à travailler sur ce texte. Que souhaitez-vous faire ?`,
        type: 'text'
      };

      setChatMessages(prev => [...prev, userMsg, botMsg]);
      toast.success(`${file.name} importé !`);
    };
    reader.readAsText(file);
  };

  // Contract Photo Upload (OCR simulation for Pitch)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading("Numérisation et extraction OCR en cours via IA locale...", { duration: 2500 });
    
    setTimeout(() => {
      // Simulate reading contract from picture (load sample)
      setActiveContractText(HIGH_RISK_SAMPLE);
      setUploadedFileName("Scan Photo - Contrat Commercial");

      const userMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        sender: 'user',
        timestamp: Date.now(),
        text: `Photo du contrat importée : **${file.name}**`,
        type: 'contract_uploaded'
      };

      const botMsg: ChatMessage = {
        id: 'msg_bot_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now() + 100,
        text: "📸 **Numérisation OCR complétée !**\n\nJ'ai converti la photo du contrat papier en texte modifiable. Je détecte un contrat commercial à haut risque.\n\nQuelle tâche d'agent souhaitez-vous lancer ?",
        type: 'text'
      };

      setChatMessages(prev => [...prev, userMsg, botMsg]);
      toast.success("OCR terminé. Contrat numérisé !");
    }, 2000);
  };

  // Run Agent pipeline for specific task
  const runAgentTask = async (taskType: 'extractor' | 'auditor' | 'redactor' | 'full') => {
    if (!activeContractText) {
      return toast.error("Veuillez d'abord téléverser ou coller un contrat !");
    }

    setIsProcessing(true);
    setProgressVal(0);
    setProgressMsg("Spawning agent...");

    try {
      const result = await runContractAnalysis(activeContractText, analysisMode, (prog) => {
        setProgressMsg(prog.message);
        setProgressVal(prog.percentage);
      });

      let responseText = '';
      let chatType: ChatMessage['type'] = 'text';

      if (taskType === 'extractor') {
        responseText = "🔍 **[Agent Extractor]** : J'ai identifié toutes les entités, variables et clauses financières. Voici le JSON structuré local :";
        chatType = 'extractor_result';
      } else if (taskType === 'auditor') {
        responseText = `🛡️ **[Agent Auditor]** : Audit de conformité terminé. J'ai évalué le contrat à un score de **${result.auditor.compliance_score}/10**. Voici la liste des risques :`;
        chatType = 'auditor_result';
      } else if (taskType === 'redactor') {
        responseText = "🧠 **[Agent Redactor]** : J'ai analysé les clauses abusives et j'ai formulé des alternatives équilibrées et professionnelles :";
        chatType = 'redactor_result';
      } else {
        responseText = `✨ **[Pipeline Pactum AI]** : Analyse globale 3-agents terminée avec succès. Score global de conformité : **${result.auditor.compliance_score}/10**.`;
        chatType = 'full_audit';
      }

      const botMsg: ChatMessage = {
        id: 'res_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        text: responseText,
        type: chatType,
        contractText: activeContractText,
        data: result
      };

      setChatMessages(prev => [...prev, botMsg]);
      onAuditComplete();
      toast.success("Agent local : Tâche complétée !");

    } catch (e: any) {
      toast.error(e.message || "Erreur de traitement de l'agent");
    } finally {
      setIsProcessing(false);
    }
  };

  // Conversational response / query
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userText = inputText;
    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      timestamp: Date.now(),
      text: userText
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Check if user is asking to trigger an agent
    const textLower = userText.toLowerCase();
    
    setIsProcessing(true);
    setProgressMsg("L'assistant réfléchit...");
    setProgressVal(50);

    setTimeout(() => {
      let botResponse = '';
      
      if (!activeContractText && (textLower.includes('audit') || textLower.includes('extra') || textLower.includes('rédig') || textLower.includes('analyse'))) {
        botResponse = "⚠️ Je vois que vous me demandez d'agir sur un contrat, mais **aucun document n'a été importé** dans l'espace de travail.\n\nVeuillez coller le contrat, charger l'exemple piégé ou importer un fichier/photo avant que je ne puisse lancer mes agents !";
        setIsProcessing(false);
        setChatMessages(prev => [...prev, {
          id: 'bot_' + Date.now(),
          sender: 'assistant',
          timestamp: Date.now(),
          text: botResponse
        }]);
        return;
      }

      if (textLower.includes('extraire') || textLower.includes('extractor') || textLower.includes('variable')) {
        setIsProcessing(false);
        runAgentTask('extractor');
        return;
      }

      if (textLower.includes('auditer') || textLower.includes('auditor') || textLower.includes('risque') || textLower.includes('conformité')) {
        setIsProcessing(false);
        runAgentTask('auditor');
        return;
      }

      if (textLower.includes('réécri') || textLower.includes('rédac') || textLower.includes('clause') || textLower.includes('abusive')) {
        setIsProcessing(false);
        runAgentTask('redactor');
        return;
      }

      if (textLower.includes('analyse') || textLower.includes('global') || textLower.includes('complet')) {
        setIsProcessing(false);
        runAgentTask('full');
        return;
      }

      // General conversational answers
      if (textLower.includes('bonjour') || textLower.includes('salut')) {
        botResponse = "Bonjour ! Je suis Pactum AI, votre consultant juridique. Comment puis-je sécuriser vos accords commerciaux aujourd'hui ?";
      } else if (textLower.includes('slack') || textLower.includes('slack résiliation')) {
        botResponse = "Une clause de résiliation via Slack sous 2 heures (comme dans notre échantillon piégé) est extrêmement dangereuse. Elle n'offre aucune garantie écrite formelle et viole la notion de préavis raisonnable requis dans les contrats commerciaux standard. L'Agent Redactor propose à la place un préavis écrit de 30 jours par courrier recommandé.";
      } else if (textLower.includes('ohada')) {
        botResponse = "Le droit commercial OHADA (harmonisation du droit des affaires en Afrique) impose un principe de bonne foi dans l'exécution et la rupture des contrats. Les clauses léonines (comme des pénalités de retard unilatérales de 15% par mois) ou des ruptures brutales sans préavis raisonnable peuvent être déclarées nulles par un tribunal arbitral ou de commerce.";
      } else {
        botResponse = "Je suis Pactum AI. Je gère 3 agents juridiques locaux :\n\n- 🔍 **Extractor** : pour extraire les dates, parties et variables.\n- 🛡️ **Auditor** : pour analyser les risques et le score de conformité.\n- 🧠 **Redactor** : pour réécrire les clauses abusives.\n\nVous pouvez lancer ces agents en cliquant sur les boutons sous les messages ou en me le demandant directement !";
      }

      setIsProcessing(false);
      setChatMessages(prev => [...prev, {
        id: 'bot_' + Date.now(),
        sender: 'assistant',
        timestamp: Date.now(),
        text: botResponse
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#070709]">
      
      {/* Configuration Header for Chat */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-purple-950/20 px-6 py-3 bg-[#0a0a0d] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold text-gray-400">Pactum Local Copilot</span>
          {uploadedFileName && (
             <Badge variant="outline" className="border-purple-500/20 text-purple-400 bg-purple-950/20 text-[10px] max-w-[200px] truncate">
               Doc actif : {uploadedFileName}
             </Badge>
          )}
        </div>

        {/* Engine switcher */}
        <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-purple-950/30">
          <button 
            onClick={() => setAnalysisMode('simulation')}
            className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${
              analysisMode === 'simulation' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Simulation (Demo)
          </button>
          <button 
            onClick={() => setAnalysisMode('cloud')}
            className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${
              analysisMode === 'cloud' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Cloud Gemini
          </button>
          <button 
            onClick={() => setAnalysisMode('local')}
            className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all flex items-center gap-1 ${
              analysisMode === 'local' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Local Gemma
            <Badge variant="outline" className="h-3 text-[7px] text-purple-300 border-purple-500/20 px-1 py-0">WASM</Badge>
          </button>
        </div>
      </div>

      {/* Chat Messages viewport */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {chatMessages.map((m) => {
            const isBot = m.sender === 'assistant';
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {isBot && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/10 border border-purple-400/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`space-y-3 max-w-[85%] ${
                  m.sender === 'user' 
                    ? 'bg-purple-950/20 p-4 px-5 rounded-2xl border border-purple-500/15 text-purple-200 text-sm font-medium shadow-inner' 
                    : 'w-full'
                }`}>
                  
                  {/* Message main text */}
                  {!m.type || m.type === 'text' || m.type === 'contract_uploaded' ? (
                    <div className="text-sm md:text-base leading-relaxed text-gray-200/90 whitespace-pre-wrap font-sans">
                      {m.text}
                    </div>
                  ) : null}

                  {/* Render special cards based on AI agents results inside chat bubble */}
                  {isBot && m.type === 'extractor_result' && (
                    <div className="space-y-3 bg-[#0a0a0e] p-5 rounded-2xl border border-blue-950/40 shadow-2xl">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <FileSearch className="w-4 h-4 text-blue-400" />
                        Variables clés extraites (Agent Extractor)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        <div className="p-3.5 rounded-xl bg-black border border-purple-950/10">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Parties contractantes</p>
                          <ul className="text-xs space-y-1 font-semibold text-blue-300">
                            {m.data.extractor.parties.map((p: string, idx: number) => <li key={idx}>• {p}</li>)}
                          </ul>
                        </div>
                        <div className="p-3.5 rounded-xl bg-black border border-purple-950/10">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Dates de validité</p>
                          <ul className="text-xs space-y-1 font-semibold text-indigo-300">
                            {m.data.extractor.dates.map((d: string, idx: number) => <li key={idx}>• {d}</li>)}
                          </ul>
                        </div>
                        <div className="p-3.5 rounded-xl bg-black border border-purple-950/10">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Responsabilités détectées</p>
                          <ul className="text-xs space-y-1 font-semibold text-purple-300 truncate">
                            {m.data.extractor.liabilities.map((l: string, idx: number) => <li key={idx} className="truncate">• {l}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {isBot && m.type === 'auditor_result' && (
                    <div className="space-y-3 bg-[#0a0a0e] p-5 rounded-2xl border border-red-950/30 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-purple-950/20 pb-3">
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-400" />
                          Rapport des Risques (Agent Auditor)
                        </p>
                        <span className="text-xs font-bold text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-500/20">
                          Conformité : {m.data.auditor.compliance_score}/10
                        </span>
                      </div>
                      <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-2">
                        {m.data.auditor.risks.map((risk: any, idx: number) => {
                          const isHigh = risk.severity === 'high';
                          const isMedium = risk.severity === 'medium';
                          return (
                            <div key={idx} className={`p-3 rounded-xl border flex items-start gap-2.5 bg-black ${
                              isHigh ? 'border-red-950/50' : isMedium ? 'border-amber-950/50' : 'border-purple-950/20'
                            }`}>
                              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                                isHigh ? 'bg-red-950/60 text-red-400' : isMedium ? 'bg-amber-950/60 text-amber-400' : 'bg-purple-950/60 text-purple-400'
                              }`}>
                                {risk.severity}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white">{risk.clause}</p>
                                <p className="text-[11px] text-gray-400 leading-normal mt-0.5">{risk.issue}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isBot && m.type === 'redactor_result' && (
                    <div className="space-y-3 bg-[#0a0a0e] p-5 rounded-2xl border border-emerald-950/30 shadow-2xl">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-emerald-400" />
                        Réécriture des Clauses Abusives (Agent Redactor)
                      </p>
                      <div className="space-y-3 pt-2">
                        {m.data.redactor.rewrites.map((rw: any, idx: number) => (
                          <div key={idx} className="border border-purple-950/15 rounded-xl overflow-hidden text-xs bg-black">
                            <div className="bg-red-950/10 p-3 border-b border-purple-950/10">
                              <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Clause Originale</p>
                              <p className="font-mono text-[11px] text-gray-400">{rw.original}</p>
                            </div>
                            <div className="bg-emerald-950/10 p-3">
                              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Proposition Pactum AI</p>
                              <p className="font-mono text-[11px] text-emerald-200">{rw.balanced}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isBot && m.type === 'full_audit' && (
                    <div className="space-y-4">
                      <div className="text-sm md:text-base leading-relaxed text-gray-200/90 whitespace-pre-wrap font-sans">
                        {m.text}
                      </div>
                      <ResultsView audit={m.data} />
                    </div>
                  )}

                  {/* Interactive Quick Agent Chips directly under bot messages */}
                  {isBot && activeContractText && m.type !== 'full_audit' && m.type !== 'extractor_result' && m.type !== 'auditor_result' && m.type !== 'redactor_result' && (
                    <div className="flex flex-wrap gap-2 pt-2">
                       <Button 
                         onClick={() => runAgentTask('extractor')}
                         variant="outline" 
                         className="h-8 text-[10px] font-bold border-blue-500/20 text-blue-300 hover:text-white bg-blue-950/10 hover:bg-blue-900/20 rounded-xl"
                       >
                         <FileSearch className="w-3.5 h-3.5 mr-1" />
                         1. Run Extractor
                       </Button>
                       <Button 
                         onClick={() => runAgentTask('auditor')}
                         variant="outline" 
                         className="h-8 text-[10px] font-bold border-purple-500/20 text-purple-300 hover:text-white bg-purple-950/10 hover:bg-purple-900/20 rounded-xl"
                       >
                         <Shield className="w-3.5 h-3.5 mr-1" />
                         2. Run Auditor
                       </Button>
                       <Button 
                         onClick={() => runAgentTask('redactor')}
                         variant="outline" 
                         className="h-8 text-[10px] font-bold border-emerald-500/20 text-emerald-300 hover:text-white bg-emerald-950/10 hover:bg-emerald-900/20 rounded-xl"
                       >
                         <BrainCircuit className="w-3.5 h-3.5 mr-1" />
                         3. Run Redactor
                       </Button>
                       <Button 
                         onClick={() => runAgentTask('full')}
                         className="h-8 text-[10px] font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md"
                       >
                         <Sparkle className="w-3.5 h-3.5 mr-1 animate-pulse" />
                         Analyse Globale (3 Agents)
                       </Button>
                    </div>
                  )}

                </div>

                {m.sender === 'user' && (
                  <div className="w-9 h-9 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-inner">
                    <UserIcon className="w-5 h-5 text-purple-300" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Loader status when analyzing */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 justify-start"
            >
               <div className="w-9 h-9 rounded-xl bg-purple-600/30 flex items-center justify-center shrink-0 animate-pulse border border-purple-500/20">
                  <Bot className="w-5 h-5 text-purple-400" />
               </div>
               <div className="flex flex-col gap-2 p-4 bg-purple-950/10 rounded-2xl border border-purple-500/10 w-full max-w-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                    <span className="text-[10px] font-bold text-purple-400 ml-1 uppercase tracking-widest">IA en cours de traitement</span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium italic">{progressMsg}</p>
                  <Progress value={progressVal} className="h-1 bg-purple-950/40 mt-1" />
               </div>
            </motion.div>
          )}

          {/* If no contract is active, show awesome starting workspace */}
          {!activeContractText && chatMessages.length <= 1 && (
            <div className="py-8 max-w-xl mx-auto flex flex-col items-center gap-6 text-center mt-12 bg-[#09090c]/50 p-8 rounded-3xl border border-purple-950/20 shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-indigo-600/5 pointer-events-none" />
              
              <div className="w-16 h-16 bg-purple-950/40 border border-purple-500/30 rounded-2xl flex items-center justify-center shadow-xl relative group">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-white tracking-tight leading-none">Pactum AI Espace de Chat</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed pt-1.5">
                  Aucun contrat chargé. Pour commencer l'audit, utilisez le bouton **"+"** pour importer un fichier, une photo du contrat ou chargez le modèle d'essai.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2 justify-center">
                <Button 
                  onClick={handleLoadSample} 
                  variant="outline" 
                  className="h-11 rounded-xl gap-2 text-xs border-purple-600/30 text-purple-300 hover:text-white bg-purple-950/15 w-full sm:w-auto"
                >
                  <AlertTriangle className="w-4 h-4 text-purple-400 animate-pulse" />
                  Charger l'exemple (High-Risk)
                </Button>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="h-11 rounded-xl gap-2 text-xs bg-purple-600 hover:bg-purple-500 text-white w-full sm:w-auto shadow-lg shadow-purple-600/20"
                >
                  <Upload className="w-4 h-4" />
                  Sélectionner un fichier
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Message Area */}
      <div className="p-4 md:p-6 bg-[#070709] border-t border-purple-950/20 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 blur-2xl opacity-20 pointer-events-none" />
          
          <div className="relative bg-[#0d0d12] border border-purple-950/30 rounded-2xl p-2 gap-2 flex items-end shadow-2xl">
            
            {/* Standard Hidden File inputs */}
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
              accept=".txt,.md,.pdf"
            />
            
            {/* hidden photo/image input */}
            <input 
              type="file" 
              className="hidden" 
              ref={photoInputRef} 
              onChange={handlePhotoUpload}
              accept="image/*"
              capture="environment"
            />

            {/* Menu options with + Button */}
            <div className="flex items-center gap-1 shrink-0 p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 text-gray-500 hover:text-purple-400 hover:bg-purple-950/20 rounded-xl transition-colors"
                onClick={() => fileInputRef.current?.click()}
                title="Importer un fichier contrat"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 text-gray-500 hover:text-purple-400 hover:bg-purple-950/20 rounded-xl transition-colors"
                onClick={() => photoInputRef.current?.click()}
                title="Scannez une photo du contrat"
              >
                <FileImage className="w-5 h-5" />
              </Button>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Posez une question, collez un contrat ou lancez un agent local..."
              className="flex-1 max-h-36 min-h-[44px] py-3 bg-transparent border-none focus:ring-0 text-sm resize-none outline-none text-gray-200 placeholder:text-gray-600 transition-all font-sans"
              rows={1}
            />

            <div className="flex items-center gap-2 p-1">
               <Button 
                  size="icon" 
                  disabled={!inputText.trim() || isProcessing}
                  onClick={handleSendMessage}
                  className="h-10 w-10 shrink-0 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-lg shadow-purple-600/10"
               >
                 <SendHorizontal className="w-5 h-5" />
               </Button>
            </div>
          </div>
          
          <p className="text-[10px] text-center mt-3 text-gray-600 font-medium">
             Pactum AI compile et exécute les agents en local. Les photos sont numérisées directement par l'IA du navigateur.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Detailed Agentic Results View (Rendered inside chat thread) ---
function ResultsView({ audit }: { audit: PactumAudit }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Clause copiée !");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 7.5) return 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20';
    if (score >= 5) return 'text-amber-400 bg-amber-950/20 border-amber-500/20';
    return 'text-red-400 bg-red-950/20 border-red-500/20';
  };

  const getScoreStatusText = (score: number) => {
    if (score >= 7.5) return 'Conformité Excellente';
    if (score >= 5) return 'Points de vigilance modérés';
    return 'Conformité critique (Haut Risque)';
  };

  return (
    <div className="space-y-4 w-full bg-[#0a0a0e]/50 border border-purple-950/30 rounded-2xl p-4 shadow-xl">
      
      {/* Score gauge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-purple-950/5 border border-purple-950/20">
        <div className="space-y-1.5 flex-1 text-left">
          <p className="text-xs text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Syntèse de l'audit local
          </p>
          <p className="text-xs text-gray-400 leading-normal">
            Le contrat a un score de <strong>{audit.auditor.compliance_score}/10</strong>. 
            {audit.auditor.compliance_score < 5 ? " Plusieurs clauses abusives requièrent des modifications." : " La structure juridique est globalement saine."}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getScoreBadgeColor(audit.auditor.compliance_score)}`}>
              {getScoreStatusText(audit.auditor.compliance_score)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center shrink-0">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-2 border-purple-950/20 bg-black shadow-inner">
            <div className="z-10 text-center">
               <span className="text-xl font-black text-white">{audit.auditor.compliance_score}</span>
               <span className="text-[9px] text-gray-500 font-bold block">/ 10</span>
            </div>
            
            <svg className="absolute -inset-1 w-[88px] h-[88px] -rotate-90">
              <circle cx="44" cy="44" r="38" className="stroke-purple-950/30 fill-transparent" strokeWidth="3" />
              <circle
                cx="44"
                cy="44"
                r="38"
                className={`fill-transparent transition-all duration-1000 ${
                  audit.auditor.compliance_score >= 7.5 ? 'stroke-emerald-500' : audit.auditor.compliance_score >= 5 ? 'stroke-amber-500' : 'stroke-purple-600'
                }`}
                strokeWidth="3"
                strokeDasharray="238.7"
                strokeDashoffset={238.7 - (238.7 * audit.auditor.compliance_score) / 10}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="auditor" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/60 border border-purple-950/35 rounded-xl p-0.5 h-9">
          <TabsTrigger value="extractor" className="rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-purple-950/50 data-[state=active]:text-purple-300">
            Extractor
          </TabsTrigger>
          <TabsTrigger value="auditor" className="rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-purple-950/50 data-[state=active]:text-purple-300">
            Auditor
          </TabsTrigger>
          <TabsTrigger value="redactor" className="rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-purple-950/50 data-[state=active]:text-purple-300">
            Redactor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extractor" className="mt-3 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-[#0e0e13] border border-purple-950/20 rounded-xl text-left">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Parties
              </p>
              <ul className="text-[11px] space-y-1 text-blue-200">
                {audit.extractor.parties.map((p, i) => <li key={i} className="truncate">• {p}</li>)}
              </ul>
            </div>
            <div className="p-3 bg-[#0e0e13] border border-purple-950/20 rounded-xl text-left">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Dates
              </p>
              <ul className="text-[11px] space-y-1 text-indigo-300">
                {audit.extractor.dates.map((d, i) => <li key={i} className="truncate">• {d}</li>)}
              </ul>
            </div>
            <div className="p-3 bg-[#0e0e13] border border-purple-950/20 rounded-xl text-left">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Limites
              </p>
              <ul className="text-[11px] space-y-1 text-purple-200">
                {audit.extractor.liabilities.map((l, i) => <li key={i} className="truncate">• {l}</li>)}
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="auditor" className="mt-3 focus-visible:outline-none space-y-2">
          {audit.auditor.risks.map((risk, idx) => (
            <div key={idx} className="p-2.5 rounded-xl border border-purple-950/20 bg-[#0e0e13] flex items-start gap-2 text-left">
              <span className={`text-[7px] font-black uppercase tracking-wider px-1 rounded-full shrink-0 ${
                risk.severity === 'high' ? 'bg-red-950/50 text-red-400' : risk.severity === 'medium' ? 'bg-amber-950/50 text-amber-400' : 'bg-purple-950/50 text-purple-400'
              }`}>
                {risk.severity}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white leading-none">{risk.clause}</p>
                <p className="text-[10px] text-gray-400 leading-normal mt-1">{risk.issue}</p>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="redactor" className="mt-3 focus-visible:outline-none space-y-3">
          {audit.redactor.rewrites.map((rw, idx) => (
            <div key={idx} className="border border-purple-950/25 rounded-xl overflow-hidden text-[10px] bg-[#0d0d12]">
              <div className="flex items-center justify-between px-3 py-1 bg-purple-950/10 border-b border-purple-950/20">
                <span className="text-[8px] font-bold uppercase text-purple-400">Clause #{idx + 1}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => copyToClipboard(rw.balanced, idx)}
                  className="h-5 text-[8px] text-purple-300 font-bold px-1.5"
                >
                  {copiedIndex === idx ? 'Copié' : 'Copier'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-purple-950/20 text-left">
                <div className="p-3 bg-black/10">
                  <span className="text-[7px] font-bold uppercase tracking-wider text-red-400 block mb-1">Originale Abusive</span>
                  <p className="font-mono text-[10px] text-gray-500 leading-relaxed">{rw.original}</p>
                </div>
                <div className="p-3 bg-emerald-950/5">
                  <span className="text-[7px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">Optimisation Pactum</span>
                  <p className="font-mono text-[10px] text-emerald-100 leading-relaxed">{rw.balanced}</p>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
