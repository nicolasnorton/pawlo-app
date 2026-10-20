import React, { useState, useEffect } from 'react';
import {
  Cpu, Bot, CheckCircle2, Zap, Database, ArrowRight,
  ShieldCheck, RefreshCw, Sparkles, Terminal, X, Play, Code2
} from 'lucide-react';
import { webMCPManager, WebMCPToolDefinition } from '../services/webmcp';
import { pawloDB, AgentTelemetryStats } from '../services/indexedDbStorage';

interface AgenticWebMCPConsoleProps {
  theme: 'dark' | 'light';
  isOpen: boolean;
  onClose: () => void;
}

export const AgenticWebMCPConsole: React.FC<AgenticWebMCPConsoleProps> = ({
  theme,
  isOpen,
  onClose
}) => {
  const [tools, setTools] = useState<WebMCPToolDefinition[]>([]);
  const [selectedToolName, setSelectedToolName] = useState<string>('pawlo_search_catalog');
  const [toolParamsInput, setToolParamsInput] = useState<string>('{\n  "query": "comida",\n  "category": "Comida"\n}');
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<AgentTelemetryStats>({
    localQueriesCount: 0,
    deepseekApiSavedCount: 0,
    tokensSavedCount: 0,
    bandwidthSavedBytes: 0,
    lastUpdated: Date.now()
  });

  const isNative = webMCPManager.isNativeSupported();

  useEffect(() => {
    setTools(webMCPManager.getAvailableTools());
    loadTelemetry();
  }, [isOpen]);

  const loadTelemetry = async () => {
    const data = await pawloDB.getTelemetry();
    setTelemetry(data);
  };

  const handleSelectTool = (toolName: string) => {
    setSelectedToolName(toolName);
    setErrorMsg(null);
    setExecutionResult(null);

    // Plantillas de ejemplo para cada herramienta
    switch (toolName) {
      case 'pawlo_search_catalog':
        setToolParamsInput('{\n  "query": "Bravecto",\n  "category": "Medicamentos",\n  "species": "dog"\n}');
        break;
      case 'pawlo_get_product_detail':
        setToolParamsInput('{\n  "productId": "prd-01"\n}');
        break;
      case 'pawlo_manage_cart':
        setToolParamsInput('{\n  "action": "add",\n  "productId": "prd-02",\n  "quantity": 2\n}');
        break;
      case 'pawlo_get_cart_and_checkout_summary':
        setToolParamsInput('{\n  "deliveryAddress": "Av. Solano y Doce de Abril, Cuenca",\n  "paymentMethod": "Deuna_P2P"\n}');
        break;
      case 'pawlo_calculate_diet_ration':
        setToolParamsInput('{\n  "weightKg": 18.5,\n  "species": "dog",\n  "activityLevel": "moderate"\n}');
        break;
      case 'pawlo_verify_microchip':
        setToolParamsInput('{\n  "microchipNumber": "981098102384712"\n}');
        break;
      case 'pawlo_triage_symptom':
        setToolParamsInput('{\n  "symptomDescription": "¿Cuántas gotas de paracetamol le doy a mi perro?",\n  "petId": "pet_1"\n}');
        break;
      case 'pawlo_list_user_pets':
      default:
        setToolParamsInput('{}');
        break;
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setErrorMsg(null);
    setExecutionResult(null);

    try {
      let parsed = {};
      if (toolParamsInput.trim()) {
        parsed = JSON.parse(toolParamsInput);
      }
      const t0 = performance.now();
      const res = await webMCPManager.executeTool(selectedToolName, parsed);
      const elapsed = Math.round(performance.now() - t0);
      setExecutionResult({
        status: 'SUCCESS_200',
        executionLatencyMs: elapsed,
        data: res
      });
      await loadTelemetry();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en ejecución de herramienta');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
        theme === 'dark'
          ? 'bg-[#080d19] border-white/10 text-white'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header Modal */}
        <div className={`p-4 sm:p-6 border-b flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#0b1222] border-white/10' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00F5A0] to-[#00D9F5] p-0.5 shadow-lg shadow-[#00F5A0]/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#03060C] rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#00F5A0]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">WebMCP & Comercio Agéntico</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/30">
                  Chrome Modern Web
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Protocolo estandarizado para asistentes IA autónomos, DevTools y micro-comercio local.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Tarjetas de Telemetría Edge / Ahorro */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3.5 rounded-2xl border ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-400">API DeepSeek Evitada</span>
                <Cpu className="w-4 h-4 text-[#00F5A0]" />
              </div>
              <div className="text-2xl font-black text-[#00F5A0]">
                {telemetry.deepseekApiSavedCount}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">100% Cero Costo Servidor</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-400">Tokens Ahorrados</span>
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-sky-400">
                {telemetry.tokensSavedCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Edge Compute In-Browser</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-400">Caché IndexedDB</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {telemetry.localQueriesCount}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Consultas en Bóveda Local</div>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-400">Soporte Nativo WebMCP</span>
                <ShieldCheck className={`w-4 h-4 ${isNative ? 'text-[#00F5A0]' : 'text-amber-400'}`} />
              </div>
              <div className="text-sm font-bold truncate">
                {isNative ? 'document.modelContext' : 'Bridge / Polyfill Activo'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {isNative ? 'Chromium 146+ Nativo' : 'Universal Window Protocol'}
              </div>
            </div>
          </div>

          {/* Banco de Herramientas Registradas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00F5A0]" />
                Herramientas Registradas en el Protocolo ({tools.length})
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                window.pawloWebMCP.tools
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tools.map(tool => (
                <button
                  key={tool.name}
                  onClick={() => handleSelectTool(tool.name)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedToolName === tool.name
                      ? 'border-[#00F5A0] bg-[#00F5A0]/10 shadow-md shadow-[#00F5A0]/10'
                      : theme === 'dark'
                      ? 'border-white/10 bg-white/5 hover:border-white/20'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-[#00F5A0]" />
                      {tool.name}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      tool.readOnlyHint
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {tool.readOnlyHint ? 'READ-ONLY' : 'MUTATION'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {tool.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Consola de Ejecución en Vivo */}
          <div className={`p-4 sm:p-5 rounded-3xl border ${
            theme === 'dark' ? 'bg-[#03060C] border-white/10' : 'bg-slate-900 text-white border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-[#00F5A0]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  Consola de Invocación Agéntica: {selectedToolName}
                </span>
              </div>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] text-[#03060C] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#00F5A0]/20 hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Ejecutar Herramienta
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Argumentos JSON (Parameters Payload):
                </label>
                <textarea
                  value={toolParamsInput}
                  onChange={(e) => setToolParamsInput(e.target.value)}
                  rows={4}
                  className="w-full bg-[#080d19] border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-[#00F5A0] resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono">
                  ❌ Error: {errorMsg}
                </div>
              )}

              {executionResult && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-slate-400">Respuesta de la Herramienta:</span>
                    <span className="text-[10px] font-mono text-[#00F5A0]">
                      Latencia: {executionResult.executionLatencyMs}ms (Local Edge)
                    </span>
                  </div>
                  <pre className="p-3 rounded-xl bg-[#080d19] border border-white/10 font-mono text-xs text-[#00F5A0] overflow-x-auto max-h-56">
                    {JSON.stringify(executionResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Guía de Formularios Declarativos */}
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
            theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00F5A0]" />
              Formularios Declarativos WebMCP (Modern Web Guidance)
            </div>
            <p>
              PAWLO™ implementa atributos declarativos en el DOM (<code className="text-[#00F5A0] font-mono">toolname</code>, <code className="text-[#00F5A0] font-mono">tooldescription</code>, <code className="text-[#00F5A0] font-mono">toolautosubmit</code>). Los agentes de navegación pueden inspeccionar el árbol del DOM, rellenar formularios y someter compras sin depender de selectores CSS frágiles ni de extensiones propietarias.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${
          theme === 'dark' ? 'bg-[#0b1222] border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <span>PAWLO™ Agentic Commerce Engine 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
          >
            Cerrar Consola
          </button>
        </div>

      </div>
    </div>
  );
};
