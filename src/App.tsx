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
  Check
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

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [history, setHistory] = useState<PactumAudit[]>([]);
  const [currentAudit, setCurrentAudit] = useState<PactumAudit | null>(null);
  
  // Reload IndexedDB history
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
  }, [currentAudit]);

  const handleSelectAudit = (audit: PactumAudit) => {
    setCurrentAudit(audit);
    setViewMode('app');
  };

  const handleNewAudit = () => {
    setCurrentAudit(null);
    setViewMode('app');
  };

  const handleDeleteAudit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAudit(id);
      toast.success("Audit supprimé de l'historique local");
      if (currentAudit?.id === id) {
        setCurrentAudit(null);
      }
      loadHistory();
    } catch (err) {
      toast.error("Impossible de supprimer l'audit");
    }
  };

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
              currentAudit={currentAudit}
              onSelectAudit={handleSelectAudit} 
              onNewAudit={handleNewAudit} 
              onDeleteAudit={handleDeleteAudit}
            />
            <main className="flex-1 lg:pl-72 flex flex-col h-full bg-[#070709] overflow-y-auto">
               <AuditInterface 
                 currentAudit={currentAudit} 
                 setCurrentAudit={setCurrentAudit} 
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
      <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">Pactum AI</span>
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
            Pitch Mode (Hackathon)
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
  currentAudit,
  onSelectAudit, 
  onNewAudit,
  onDeleteAudit
}: { 
  history: PactumAudit[]; 
  currentAudit: PactumAudit | null;
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
          Nouvel Audit de Contrat
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
                  const isSelected = currentAudit?.id === audit.id;
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
      {/* Background Blobs */}
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
            <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-400" />
            Pitch Hackathon : Souveraineté Juridique Locale
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
            Le bouclier juridique <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent">local</span> et <span className="text-gray-400 underline decoration-purple-600 decoration-wavy underline-offset-8">autonome</span>.
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Fini les abonnements serveurs et les risques de fuites de données sensibles. Pactum AI orchestre une pipeline de 3 agents juridiques directement dans votre navigateur web.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button size="lg" className="h-14 px-8 rounded-2xl text-base font-bold bg-purple-600 hover:bg-purple-500 text-white gap-2.5 shadow-xl shadow-purple-600/20 group transition-all" onClick={onStart}>
              Lancer Pactum AI
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-base font-bold border-purple-950/50 hover:bg-purple-950/10 text-gray-300 hover:text-white" onClick={onStart}>
              Voir la démo Hackathon
            </Button>
          </div>
          
          <div className="pt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-gray-500">
             <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-purple-500/60" /> 100% Hors-ligne & Confidentiel</div>
             <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500/60" /> Zéro frais d'infrastructure</div>
             <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-purple-500/60" /> Multi-normes (DPA, GDPR, OHADA)</div>
          </div>
        </motion.div>
      </section>

      {/* Agents Architecture */}
      <section className="container mx-auto px-6 py-12 max-w-6xl">
        <h2 className="text-2xl font-bold text-center text-white mb-10">L'architecture multi-agent autonome de Pactum AI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { 
               title: "Agent 1 : L'Extracteur", 
               desc: "Cartographie instantanément les dates clés, les parties prenantes et les limites de responsabilité du contrat sous forme de variables structurées.", 
               icon: FileSearch, 
               accent: "border-blue-500/20 bg-blue-950/5 text-blue-400"
             },
             { 
               title: "Agent 2 : L'Auditeur", 
               desc: "Analyse la conformité du contrat contre vos playbooks (droit commercial, RGPD, OHADA) et calcule un score global de conformité de 0 à 10.", 
               icon: Shield, 
               accent: "border-purple-500/20 bg-purple-950/5 text-purple-400"
             },
             { 
               title: "Agent 3 : Le Rédacteur", 
               desc: "Formule des alternatives justes et équilibrées pour chaque clause jugée abusive ou hautement déséquilibrée, prêtes à être acceptées.", 
               icon: BrainCircuit, 
               accent: "border-emerald-500/20 bg-emerald-950/5 text-emerald-400"
             },
           ].map((feature, i) => (
             <Card key={i} className="bg-[#0b0b0f]/80 backdrop-blur-sm border-purple-950/20 hover:border-purple-600/30 transition-all shadow-xl">
               <CardContent className="p-8 space-y-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${feature.accent}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
               </CardContent>
             </Card>
           ))}
        </div>
      </section>

      {/* History section on Landing if we have previous runs */}
      {history.length > 0 && (
        <section className="container mx-auto px-6 py-12 max-w-4xl">
          <div className="p-6 md:p-8 rounded-3xl bg-[#0b0b0f] border border-purple-950/30 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Retrouvez vos analyses locales sauvegardées dans le navigateur
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

// --- Main Interactive Workspace ---
function AuditInterface({ 
  currentAudit, 
  setCurrentAudit, 
  onAuditComplete 
}: { 
  currentAudit: PactumAudit | null; 
  setCurrentAudit: (audit: PactumAudit | null) => void;
  onAuditComplete: () => void;
}) {
  const [contractText, setContractText] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'simulation' | 'cloud' | 'local'>('simulation');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress>({
    status: 'idle',
    message: '',
    percentage: 0
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if historical audit is selected
  useEffect(() => {
    if (currentAudit) {
      setContractText(currentAudit.contractText);
    } else {
      setContractText('');
    }
  }, [currentAudit]);

  const loadDemo = () => {
    setContractText(HIGH_RISK_SAMPLE);
    toast.success("Contrat piégé (High-Risk Sample) injecté !");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const startAnalysis = async () => {
    if (!contractText.trim()) {
      return toast.error("Veuillez d'abord coller le texte de votre contrat.");
    }
    
    setIsAnalyzing(true);
    setProgress({ status: 'initializing', message: 'Initialisation...', percentage: 0 });

    try {
      const result = await runContractAnalysis(contractText, analysisMode, (prog) => {
        setProgress(prog);
      });
      
      setCurrentAudit(result);
      onAuditComplete();
      toast.success("Analyse multi-agent effectuée avec succès !");
    } catch (e: any) {
      toast.error(e.message || "Échec de l'audit local");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      
      {/* If currently auditing, show immersive agent handoff screen */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-24 space-y-8 bg-[#0b0b0f] border border-purple-950/20 rounded-3xl p-8 shadow-2xl">
          <div className="relative">
             <div className="absolute -inset-4 bg-purple-600/20 blur-3xl rounded-full animate-pulse" />
             <div className="w-24 h-24 rounded-full border-[3px] border-purple-600 border-t-transparent animate-spin relative overflow-hidden" />
             <Shield className="w-9 h-9 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <div className="text-center space-y-4 w-full max-w-md">
             <div className="space-y-1.5">
               <h3 className="text-xl font-bold text-white uppercase tracking-wider">Pipeline Agentique Active</h3>
               <p className="text-sm text-purple-400/90 font-medium h-6">
                  {progress.message}
               </p>
             </div>
             
             <div className="space-y-1">
               <Progress value={progress.percentage} className="h-1.5 bg-purple-950/40" />
               <div className="flex justify-between text-[10px] text-gray-500 font-semibold uppercase tracking-wider pt-1">
                 <span>Démarrage</span>
                 <span>Extractor</span>
                 <span>Auditor</span>
                 <span>Redactor</span>
                 <span>Prêt</span>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Main Workspace (Input or Results) */}
      {!isAnalyzing && (
        <AnimatePresence mode="wait">
          {!currentAudit ? (
            <motion.div 
              key="workspace-input"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                     <FileSearch className="w-6 h-6 text-purple-400" />
                     Espace d'analyse
                   </h2>
                   <p className="text-xs text-gray-500 mt-0.5">Glissez ou collez votre contrat pour l'analyse locale instantanée.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-purple-300 hover:text-white bg-purple-950/20 hover:bg-purple-950/40 border border-purple-500/10 font-bold px-3.5 py-1.5 rounded-xl transition-all"
                    onClick={loadDemo}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-purple-400 animate-pulse" />
                    Load High-Risk Sample
                  </Button>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-[#0b0b0f] border border-purple-950/30 rounded-2xl overflow-hidden shadow-2xl">
                  
                  {/* Mode Config Panel */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-purple-950/30 bg-purple-950/5">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="font-semibold">Moteur d'IA :</span>
                      <div className="flex bg-black/60 p-0.5 rounded-lg border border-purple-950/30">
                        <button 
                          onClick={() => setAnalysisMode('simulation')}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                            analysisMode === 'simulation' 
                              ? 'bg-purple-600 text-white' 
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          Simulation (Hackathon)
                        </button>
                        <button 
                          onClick={() => setAnalysisMode('cloud')}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                            analysisMode === 'cloud' 
                              ? 'bg-purple-600 text-white' 
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          Gemini Cloud API
                        </button>
                        <button 
                          onClick={() => setAnalysisMode('local')}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                            analysisMode === 'local' 
                              ? 'bg-purple-600 text-white' 
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          Local Gemma 2B
                          <Badge variant="outline" className="h-3 text-[7px] text-purple-300 border-purple-500/20 bg-purple-950/20 px-1 py-0">
                            WASM
                          </Badge>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      {analysisMode === 'simulation' && (
                        <span className="flex items-center gap-1 text-[11px] text-purple-300 font-semibold bg-purple-950/20 px-2.5 py-1 rounded-md border border-purple-500/10">
                          <Sparkles className="w-3 h-3" /> Pitch ultra-rapide
                        </span>
                      )}
                      {analysisMode === 'cloud' && (
                        <span className="flex items-center gap-1 text-[11px] text-blue-300 font-semibold bg-blue-950/20 px-2.5 py-1 rounded-md border border-blue-500/10">
                          <Zap className="w-3 h-3" /> Gemini 3.5 Flash
                        </span>
                      )}
                      {analysisMode === 'local' && (
                        <span className="flex items-center gap-1 text-[11px] text-amber-300 font-semibold bg-amber-950/20 px-2.5 py-1 rounded-md border border-amber-500/10">
                          <Lock className="w-3 h-3" /> 100% Hors-ligne / WebGPU
                        </span>
                      )}
                    </div>
                  </div>

                  <textarea 
                    ref={textareaRef}
                    className="w-full h-80 p-6 md:p-8 font-mono text-xs leading-relaxed outline-none resize-none bg-transparent text-gray-300 placeholder:text-gray-600"
                    placeholder="Collez ou tapez le texte de votre accord juridique ici..."
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                  />
                  
                  {/* Footer Actions */}
                  <div className="p-4 border-t border-purple-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0a0a0d]">
                    <div className="text-[10px] text-gray-500 leading-normal max-w-md">
                      Pactum AI combine 3 agents : <strong>l'Extracteur</strong> de variables, <strong>l'Auditeur</strong> pour la sévérité du risque, et <strong>le Rédacteur</strong> pour la réécriture.
                    </div>
                    <Button 
                      size="lg" 
                      className="h-12 px-8 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white gap-2 shadow-lg shadow-purple-600/15 group shrink-0" 
                      onClick={startAnalysis}
                    >
                      <span>Analyser le contrat</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>

                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="workspace-results"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-950/20 pb-4">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-3">
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="p-0 h-8 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold"
                       onClick={() => setCurrentAudit(null)}
                     >
                       ← Retour
                     </Button>
                     <Badge variant="outline" className="border-purple-600/30 text-purple-400 bg-purple-950/10 text-[9px] font-bold">
                       ID: {currentAudit.id}
                     </Badge>
                  </div>
                  <h2 className="text-xl font-extrabold text-white truncate mt-1">
                    {currentAudit.contractName}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 border-purple-950/40 hover:bg-purple-950/10 text-gray-400 hover:text-white text-xs font-semibold rounded-lg"
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentAudit, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `pactum_audit_${currentAudit.id}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      toast.success("Rapport exporté en JSON");
                    }}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Exporter JSON
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 border-purple-950/40 hover:bg-purple-950/10 text-gray-400 hover:text-white text-xs font-semibold rounded-lg"
                    onClick={() => {
                      setCurrentAudit(null);
                      toast.info("Prêt pour une nouvelle analyse");
                    }}
                  >
                    Nouvel Audit
                  </Button>
                </div>
              </div>

              <ResultsView audit={currentAudit} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

    </div>
  );
}

// --- Detailed Agentic Results View ---
function ResultsView({ audit }: { audit: PactumAudit }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Clause copiée dans le presse-papiers !");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 7.5) return 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20';
    if (score >= 5) return 'text-amber-400 bg-amber-950/20 border-amber-500/20';
    return 'text-red-400 bg-red-950/20 border-red-500/20';
  };

  const getScoreStatusText = (score: number) => {
    if (score >= 7.5) return 'Conformité Excellente';
    if (score >= 5) return 'Conformité Modérée (Points de vigilance)';
    return 'Conformité Critique (Haut risque détecté)';
  };

  return (
    <div className="space-y-8 w-full">
      
      {/* Executive Summary & Score Card */}
      <Card className="bg-[#0b0b0f] border-purple-950/30 overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5 pointer-events-none" />
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              Synthèse Globale de l'Auditeur Pactum
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Ce contrat a été analysé en local par nos agents. La conformité générale est évaluée à <strong>{audit.auditor.compliance_score}/10</strong>.
              {audit.auditor.compliance_score < 5 ? (
                <span> Plusieurs clauses présentent des risques juridiques et commerciaux importants qui nécessitent une réécriture ou négociation.</span>
              ) : (
                <span> Le contrat est globalement structuré de manière professionnelle, avec peu d'asymétries majeures.</span>
              )}
            </p>
            
            <div className="flex items-center gap-2.5 pt-2">
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${getScoreBadgeColor(audit.auditor.compliance_score)}`}>
                {getScoreStatusText(audit.auditor.compliance_score)}
              </span>
              <span className="text-[10px] text-gray-500">
                Playbook Commercial (OHADA/GDPR par défaut)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center shrink-0">
            <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4 border-purple-950/20 bg-black shadow-inner">
              <div className="absolute inset-2 rounded-full border border-purple-500/20 bg-[#0d0d12]" />
              <div className="z-10 text-center">
                 <span className="text-3xl font-black text-white">{audit.auditor.compliance_score}</span>
                 <span className="text-xs text-gray-500 font-bold block mt-0.5">/ 10</span>
              </div>
              
              {/* Outer stroke showing progress based on score */}
              <svg className="absolute -inset-1.5 w-[120px] h-[120px] -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="stroke-purple-950/30 fill-transparent"
                  strokeWidth="4"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className={`fill-transparent transition-all duration-1000 ${
                    audit.auditor.compliance_score >= 7.5 
                      ? 'stroke-emerald-500' 
                      : audit.auditor.compliance_score >= 5 
                        ? 'stroke-amber-500' 
                        : 'stroke-purple-600'
                  }`}
                  strokeWidth="4"
                  strokeDasharray="326.7"
                  strokeDashoffset={326.7 - (326.7 * audit.auditor.compliance_score) / 10}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Agent Tabs Layout */}
      <Tabs defaultValue="auditor" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#0a0a0d] border border-purple-950/20 rounded-2xl p-1 h-12">
          <TabsTrigger value="extractor" className="rounded-xl text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-purple-950/50 data-[state=active]:text-purple-300">
            <FileSearch className="w-4 h-4 mr-2" />
            1. Extractor JSON
          </TabsTrigger>
          <TabsTrigger value="auditor" className="rounded-xl text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-purple-950/50 data-[state=active]:text-purple-300">
            <Shield className="w-4 h-4 mr-2" />
            2. Auditor Risks
          </TabsTrigger>
          <TabsTrigger value="redactor" className="rounded-xl text-xs font-bold uppercase tracking-wider transition-all data-[state=active]:bg-purple-950/50 data-[state=active]:text-purple-300">
            <BrainCircuit className="w-4 h-4 mr-2" />
            3. Redactor Proposals
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Extractor */}
        <TabsContent value="extractor" className="mt-4 focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <Card className="bg-[#0b0b0f] border-purple-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Parties Prenantes
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-500">
                  Entités contractantes identifiées par l'Extracteur.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {audit.extractor.parties.length === 0 ? (
                  <p className="text-xs text-gray-500">Aucune partie extraite.</p>
                ) : (
                  audit.extractor.parties.map((p, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black border border-purple-950/10 text-xs font-medium text-purple-200">
                      {p}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#0b0b0f] border-purple-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Dates Clés
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-500">
                  Échéances et périodes de validité extraites.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {audit.extractor.dates.length === 0 ? (
                  <p className="text-xs text-gray-500">Aucune date extraite.</p>
                ) : (
                  audit.extractor.dates.map((d, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black border border-purple-950/10 text-xs font-medium text-indigo-300">
                      {d}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#0b0b0f] border-purple-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Responsabilité & Dettes
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-500">
                  Clauses d'indemnisation et limites de dettes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {audit.extractor.liabilities.length === 0 ? (
                  <p className="text-xs text-gray-500">Aucun périmètre de responsabilité.</p>
                ) : (
                  audit.extractor.liabilities.map((l, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black border border-purple-950/10 text-xs font-medium text-purple-300">
                      {l}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Tab 2: Auditor Risks */}
        <TabsContent value="auditor" className="mt-4 focus-visible:outline-none space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              Vecteurs de Risques Identifiés
            </h4>
            <Badge variant="outline" className="border-purple-600/30 text-purple-300 bg-purple-950/10 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {audit.auditor.risks.length} Anomalies Détectées
            </Badge>
          </div>

          <div className="space-y-3.5">
            {audit.auditor.risks.length === 0 ? (
              <div className="p-8 text-center bg-[#0b0b0f] border border-purple-950/20 rounded-2xl text-gray-400 text-sm">
                Aucun risque détecté. Le contrat est conforme au playbook de référence.
              </div>
            ) : (
              audit.auditor.risks.map((risk, idx) => {
                const isHigh = risk.severity === 'high';
                const isMedium = risk.severity === 'medium';
                
                return (
                  <div 
                    key={idx}
                    className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row gap-4 justify-between bg-[#0b0b0f] ${
                      isHigh 
                        ? 'border-red-950/50 hover:border-red-500/30 hover:bg-red-950/5' 
                        : isMedium 
                          ? 'border-amber-950/50 hover:border-amber-500/30 hover:bg-amber-950/5'
                          : 'border-purple-950/30 hover:border-purple-600/30 hover:bg-purple-950/5'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`uppercase text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full ${
                            isHigh 
                              ? 'bg-red-950/60 text-red-400 border border-red-500/20' 
                              : isMedium 
                                ? 'bg-amber-950/60 text-amber-400 border border-amber-500/20' 
                                : 'bg-purple-950/60 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {risk.severity === 'high' ? 'Élevé' : risk.severity === 'medium' ? 'Moyen' : 'Faible'}
                        </Badge>
                        <h4 className="text-sm font-bold text-white tracking-tight">{risk.clause}</h4>
                      </div>
                      
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">
                        {risk.issue}
                      </p>
                    </div>

                    <div className="flex items-center shrink-0 gap-2">
                      <div className="text-[10px] text-gray-500 italic bg-black/40 border border-purple-950/15 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        Analyzé par Pactum Auditor Agent
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Redactor Proposals */}
        <TabsContent value="redactor" className="mt-4 focus-visible:outline-none space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              Réécriture et Alternatives Équilibrées (Side-by-Side)
            </h4>
            <Badge variant="outline" className="border-emerald-600/30 text-emerald-400 bg-emerald-950/10 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {audit.redactor.rewrites.length} Clauses Optimisées
            </Badge>
          </div>

          <div className="space-y-4">
            {audit.redactor.rewrites.length === 0 ? (
              <div className="p-8 text-center bg-[#0b0b0f] border border-purple-950/20 rounded-2xl text-gray-400 text-sm">
                Aucune proposition de réécriture requise.
              </div>
            ) : (
              audit.redactor.rewrites.map((item, idx) => (
                <div key={idx} className="border border-purple-950/20 rounded-2xl overflow-hidden bg-[#0b0b0f] shadow-xl">
                  
                  {/* Title Bar */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-950/20 bg-purple-950/5">
                    <span className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">Proposition de clause #{idx + 1}</span>
                    
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(item.balanced, idx)}
                      className="h-7 text-[10px] font-bold text-purple-300 hover:text-white px-2 rounded-lg gap-1 hover:bg-purple-950/20"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copier l'alternative
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Side-by-side grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-purple-950/20">
                    
                    {/* Left: Original Abusive Clause */}
                    <div className="p-4 md:p-6 bg-black/20">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-red-400 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500/70" />
                        Clause Abusive d'origine
                      </div>
                      <p className="font-mono text-[11px] leading-relaxed text-gray-400 whitespace-pre-wrap">
                        {item.original}
                      </p>
                    </div>

                    {/* Right: Balanced Proposal */}
                    <div className="p-4 md:p-6 bg-emerald-950/5">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
                        Alternative Équilibrée (Pactum Redactor)
                      </div>
                      <p className="font-mono text-[11px] leading-relaxed text-emerald-200 whitespace-pre-wrap">
                        {item.balanced}
                      </p>
                    </div>

                  </div>

                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
