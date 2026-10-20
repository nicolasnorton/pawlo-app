import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * SUPABASE EDGE FUNCTION: /supabase/functions/pet-assistant/index.ts
 * MÓDULO: «Asistente de Triaje y Conducta Canina» (Cuenca, Ecuador)
 * BLINDAJE LEGAL:
 * - Cumple Art. 31 del Código de Ética Profesional de la Medicina Veterinaria (Ecuador).
 * - Exige aceptación expresa del descargo clickwrap antes de procesar cualquier consulta.
 * - Cortafuegos farmacológico determinista + restricción de prompt: prohibido indicar
 *   principios activos, nombres comerciales de fármacos o posologías (mg/kg, ml, gotas, etc.).
 */

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type TriageLevel = "RED" | "YELLOW" | "GREEN";
export type UrgencyTimeframe = "Inmediato (0h)" | "Menor a 12h" | "Rutinario";

export interface TriageSchemaOutput {
  triage_level: TriageLevel;
  reasoning: string;
  recommended_action: string;
  urgency_timeframe: UrgencyTimeframe;
}

// Patrones de consulta farmacológica o posológica prohibidos (Pre- y Post-filtro)
const PHARMA_PROHIBITED_PATTERNS: RegExp[] = [
  /\b(dosis|dosificaci[oó]n|posolog[ií]a|cu[aá]ntos?\s*(mg|miligramos|ml|mililitros|gotas|pastillas|tabletas|comprimidos)|mg\s*\/\s*kg|ml\s*\/\s*kg)\b/i,
  /\b(ivermectina|carprofeno|meloxicam|ketoprofeno|tramadol|amoxicilina|cefalexina|doxiciclina|metronidazol|prednisona|dexametasona|furosemida|omeprazol|gabapentina|fenobarbital|apomorfina|atropina|paracetamol|ibuprofeno|aspirina|diclofenaco|naproxeno)\b/i,
  /\b(rimadyl|bravecto|nexgard|simparica|advantix|frontline|drontal|panacur|synulox|convenia|apoquel|cytopoint|cerenia|vetmedin)\b/i,
  /\b(recetar|rec[eé]tame|medicar|automedicar|inyectar|inyecci[oó]n|antibi[oó]tico|analg[eé]sico|antiinflamatorio|sedante|tranquilizante)\b/i,
];

// Patrones de emergencia crítica Nivel ROJO (deterministas de respaldo)
const CRITICAL_RED_PATTERNS: RegExp[] = [
  /\b(torsi[oó]n\s*g[aá]strica|dilataci[oó]n|abdomen\s*(hinchado|duro|distendido)|arcadas\s*sin\s*vomitar)\b/i,
  /\b(atropell(o|ado|aron)|choque|accidente\s*vehicular|traumatismo|fractura\s*expuesta|ca[ií]da\s*de\s*altura)\b/i,
  /\b(convulsi(o|ó)n(es)?|ataque\s*epil[eé]ptico|inconsciente|desmayo|no\s*respira|asfixia|enc[ií]as\s*(azules|blancas|p[aá]lidas))\b/i,
  /\b(hemorragia\s*profusa|sangrado\s*(abundante|incontrolable)|vomita\s*sangre|diarrea\s*con\s*sangre)\b/i,
  /\b(envenenamiento|veneno|raticida|campe[oó]n|chocolate|uvas|xilitol|anticongelante|intoxicaci[oó]n)\b/i,
];

// Patrones de signos físicos que activan la Ruta Sintomática (deepseek-reasoner)
const SYMPTOM_ROUTE_PATTERNS: RegExp[] = [
  /\b(v[oó]mito|diarrea|fiebre|letargo|no\s*quiere\s*comer|anorexia|cojera|cojea|sangre|tos|estornudo|ahogo|jadeo|temblor|dolor|herida|quemadura|picadura|bulto|inflamaci[oó]n|infecci[oó]n|orina|estreñimiento|rasca|alopecia|ojo\s*rojo|secreci[oó]n)\b/i,
];

export function containsPharmacologicalQuery(text: string): boolean {
  return PHARMA_PROHIBITED_PATTERNS.some((regex) => regex.test(text)) ||
    CRITICAL_RED_PATTERNS.some((r) => false); // Evaluación estricta de fármacos
}

export function isCriticalRedEmergency(text: string): boolean {
  return CRITICAL_RED_PATTERNS.some((regex) => regex.test(text));
}

export function classifyRoute(text: string, requestedMode?: string): "triage" | "ethology" {
  if (requestedMode === "triage") return "triage";
  if (requestedMode === "ethology") {
    // Incluso si el usuario está en pestaña de conducta, si describe una emergencia o síntoma orgánico, forzamos triaje
    if (isCriticalRedEmergency(text) || SYMPTOM_ROUTE_PATTERNS.some((r) => r.test(text))) {
      return "triage";
    }
    return "ethology";
  }
  if (isCriticalRedEmergency(text) || SYMPTOM_ROUTE_PATTERNS.some((r) => r.test(text))) {
    return "triage";
  }
  return "ethology";
}

export function validateTriageJson(raw: unknown): TriageSchemaOutput {
  if (!raw || typeof raw !== "object") {
    throw new Error("La salida del modelo no es un objeto JSON válido.");
  }
  const obj = raw as Record<string, unknown>;
  const validLevels: TriageLevel[] = ["RED", "YELLOW", "GREEN"];
  const validTimeframes: UrgencyTimeframe[] = ["Inmediato (0h)", "Menor a 12h", "Rutinario"];

  const level = String(obj.triage_level || "").toUpperCase() as TriageLevel;
  if (!validLevels.includes(level)) {
    throw new Error(`triage_level inválido: ${String(obj.triage_level)}`);
  }

  const timeframe = validTimeframes.includes(obj.urgency_timeframe as UrgencyTimeframe)
    ? (obj.urgency_timeframe as UrgencyTimeframe)
    : level === "RED"
    ? "Inmediato (0h)"
    : level === "YELLOW"
    ? "Menor a 12h"
    : "Rutinario";

  const reasoning = String(obj.reasoning || "").trim();
  const recommendedAction = String(obj.recommended_action || "").trim();

  if (!reasoning || !recommendedAction) {
    throw new Error("Campos reasoning o recommended_action vacíos en JSON de triaje.");
  }

  // Verificar que el propio LLM no haya filtrado ningún fármaco o posología en su respuesta
  if (
    containsPharmacologicalQuery(reasoning) ||
    containsPharmacologicalQuery(recommendedAction)
  ) {
    return {
      triage_level: level,
      reasoning:
        "Se identificaron signos clínicos que requieren valoración presencial por un médico veterinario colegiado.",
      recommended_action:
        "Por seguridad y cumplimiento del Art. 31 del Código de Ética Veterinaria del Ecuador, el Asistente de Triaje y Conducta Canina no prescribe medicamentos ni posologías. Mantenga a la mascota en reposo, hidratada si está consciente y acuda a una clínica veterinaria en Cuenca.",
      urgency_timeframe: timeframe,
    };
  }

  return {
    triage_level: level,
    reasoning,
    recommended_action: recommendedAction,
    urgency_timeframe: timeframe,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      message,
      mode,
      disclaimerAccepted,
      petProfile,
    }: {
      message: string;
      mode?: "triage" | "ethology";
      disclaimerAccepted?: boolean;
      petProfile?: { name?: string; species?: string; breed?: string; weightKg?: number; ageMonths?: number };
    } = await req.json();

    // 1. Verificación de Descargo Obligatorio (Clickwrap Legal - Art. 31)
    if (disclaimerAccepted !== true) {
      return new Response(
        JSON.stringify({
          error:
            "Debe aceptar expresamente el descargo de responsabilidad (Clickwrap) reconociendo que el Asistente de Triaje y Conducta Canina no reemplaza la consulta presencial veterinaria (Art. 31 Código de Ética Veterinaria).",
          code: "CLICKWRAP_REQUIRED",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "El mensaje de consulta no puede estar vacío." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 2. Cortafuegos Farmacológico Estricto (Prohibición de principios activos, marcas y mg/kg)
    // Si además hay signos de Nivel ROJO (ej. envenenamiento por ibuprofeno), priorizamos alerta ROJA sin dar dosis
    const isRed = isCriticalRedEmergency(message);
    if (containsPharmacologicalQuery(message) && !isRed) {
      return new Response(
        JSON.stringify({
          module_title: "Asistente de Triaje y Conducta Canina",
          route: "pharma_blocked",
          blocked: true,
          legal_notice:
            "Cumplimiento Normativo (Art. 31 del Código de Ética Profesional de la Medicina Veterinaria - Ecuador)",
          message:
            "Por seguridad de tu mascota y normativa vigente en Ecuador, este asistente tiene terminantemente prohibido recomendar principios activos, nombres comerciales de medicamentos o posologías (mg/kg, ml o gotas). La automedicación veterinaria causa intoxicaciones graves. Te recomendamos coordinar una valoración presencial en el Hospital Municipal de la Mascota o Clínica Veterinaria Austrovet.",
          triage: {
            triage_level: "YELLOW",
            reasoning:
              "Solicitud de prescripción farmacológica o cálculo de dosis bloqueada por protocolo de seguridad clínica.",
            recommended_action:
              "Suspender cualquier administración de medicamentos humanos o veterinarios no recetados y acudir a consulta presencial para pesaje y prescripción segura.",
            urgency_timeframe: "Menor a 12h",
          } satisfies TriageSchemaOutput,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const activeRoute = classifyRoute(message, mode);
    const petContext = petProfile
      ? `Mascota: ${petProfile.name || "Sin nombre"}, Especie: ${petProfile.species || "canina"}, Raza: ${petProfile.breed || "Mestizo"}, Peso: ${petProfile.weightKg || "N/D"} kg, Edad: ${petProfile.ageMonths || "N/D"} meses.`
      : "Mascota sin ficha seleccionada.";

    // 3. RUTA CONDUCTUAL (ETOLOGÍA) -> deepseek-flash (deepseek-chat)
    if (activeRoute === "ethology") {
      const systemPromptEthology = `Eres el "Asistente de Triaje y Conducta Canina" para tutores en Cuenca, Ecuador.
REGLAS ESTRICTAS DE BLINDAJE LEGAL:
1. NUNCA te llames "Veterinario Virtual" ni emitas "Diagnóstico Clínico" (Art. 31 Código de Ética Veterinaria).
2. TIENES TERMINANTEMENTE PROHIBIDO mencionar principios activos, nombres comerciales de medicamentos o dosis (mg/kg, ml, gotas).
3. Enfoque 100% en etología clínica preventiva, enriquecimiento ambiental, desensibilización sistemática y adiestramiento en refuerzo positivo (prohibido collares de ahogo, púas o castigo físico).
4. Contextualiza tus consejos a Cuenca (paseos con correa en parques lineales del río Tomebamba, Yanuncay, Parque El Paraíso y respeto a la Ordenanza Municipal de Tenencia Responsable de la CGA).`;

      if (!DEEPSEEK_API_KEY) {
        throw new Error("Falta variable de entorno DEEPSEEK_API_KEY en Supabase Edge Functions.");
      }

      const dsRes = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat", // Equivalente productivo de baja latencia (deepseek-flash / V3)
          temperature: 0.3,
          messages: [
            { role: "system", content: systemPromptEthology },
            { role: "user", content: `${petContext}\nConsulta de conducta/etología: ${message}` },
          ],
        }),
      });

      const dsJson = await dsRes.json();
      const replyText: string =
        dsJson.choices?.[0]?.message?.content ||
        "Recomendamos aplicar refuerzo positivo y rutinas de paseo estructuradas con arnés ergonómico.";

      // Post-filtro farmacológico por seguridad
      const safeReply = containsPharmacologicalQuery(replyText)
        ? "Para modificar esta conducta utiliza únicamente refuerzo positivo, enriquecimiento ambiental (juguetes interactivos de olfato) y acompañamiento de un etólogo certificado en Cuenca. No administres sedantes ni fármacos sin evaluación presencial."
        : replyText;

      return new Response(
        JSON.stringify({
          module_title: "Asistente de Triaje y Conducta Canina",
          route: "ethology_flash",
          model_used: "deepseek-flash",
          blocked: false,
          advice: safeReply,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 4. RUTA SINTOMÁTICA (TRIAJE DE SALUD) -> deepseek-reasoner (DeepSeek-R1)
    const systemPromptTriage = `Eres el "Asistente de Triaje y Conducta Canina" en Cuenca, Ecuador.
Tu función es realizar exclusivamente un TRIAJE SINTOMÁTICO ESTRUCTURADO DE 3 NIVELES (NO un diagnóstico clínico).
REGLAS IMPERATIVAS:
1. PROHIBIDO indicar principios activos, nombres comerciales de medicamentos o posologías (mg/kg, ml, tabletas).
2. Clasifica en:
   - "RED": Riesgo vital inmediato (dilatación-torsión gástrica, atropellamiento/traumatismo vehicular, convulsiones continuas, dificultad respiratoria severa, hemorragia profusa, envenenamiento/intoxicación). Urgencia: "Inmediato (0h)".
   - "YELLOW": Signos moderados que requieren atención veterinaria pronta en el día (vómitos repetidos sin sangre, letargo marcado, cojera aguda, fiebre, diarrea persistente). Urgencia: "Menor a 12h".
   - "GREEN": Signos leves o consultas preventivas (cuidados de higiene, desparasitación rutinaria, dudas generales sin compromiso sistémico). Urgencia: "Rutinario".
3. Responde ÚNICAMENTE con un objeto JSON válido que cumpla exactamente este esquema:
{
  "triage_level": "RED" | "YELLOW" | "GREEN",
  "reasoning": "Evaluación breve de las variables fisiológicas descritas (sin diagnosticar ni recetar)",
  "recommended_action": "Medidas de primeros auxilios inmediatos no invasivos o derivación presencial en Cuenca",
  "urgency_timeframe": "Inmediato (0h)" | "Menor a 12h" | "Rutinario"
}`;

    if (!DEEPSEEK_API_KEY) {
      throw new Error("Falta variable de entorno DEEPSEEK_API_KEY en Supabase Edge Functions.");
    }

    const dsReasonerRes = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-reasoner",
        messages: [
          { role: "system", content: systemPromptTriage },
          { role: "user", content: `${petContext}\nReporte de signos físicos: ${message}` },
        ],
      }),
    });

    const dsReasonerJson = await dsReasonerRes.json();
    const rawContent: string = dsReasonerJson.choices?.[0]?.message?.content || "{}";
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    const parsedJson = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    let validatedTriage = validateTriageJson(parsedJson);

    // Si el detector determinista identificó signos críticos (ej. torsión gástrica, atropellamiento, convulsiones), garantizamos nivel RED
    if (isRed && validatedTriage.triage_level !== "RED") {
      validatedTriage = {
        triage_level: "RED",
        reasoning: validatedTriage.reasoning,
        recommended_action: validatedTriage.recommended_action,
        urgency_timeframe: "Inmediato (0h)",
      };
    }

    return new Response(
      JSON.stringify({
        module_title: "Asistente de Triaje y Conducta Canina",
        route: "triage_reasoner",
        model_used: "deepseek-reasoner",
        blocked: false,
        triage: validatedTriage,
        emergency_referral:
          validatedTriage.triage_level === "RED"
            ? {
                primary_facility: "Clínica Veterinaria Austrovet (Urgencias 24h)",
                phone: "074083691",
                address: "Av. González Suárez (frente a Monay Shopping), Cuenca",
                coordinates: { lat: -2.8988, lng: -78.9805 },
                secondary_facility: "Hospital Municipal de la Mascota",
                secondary_phone: "074134520",
              }
            : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
