// ============================================================================
// CAPA DE DOMINIO & INFRAESTRUCTURA (CLEAN ARCHITECTURE / FEATURE-FIRST)
// ARCHIVO: mobile_app/src/core/api/supabaseClient.ts
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://cuenca-fauna.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon";

// Prohibido exponer claves secretas (GHL_PRIVATE_ACCESS_TOKEN / DEEPSEEK_API_KEY) en el cliente móvil.
// Toda operación sensible se delega a Supabase Edge Functions.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export interface GeoPointWGS84 {
  latitude: number;  // EPSG:4326 (Ej. Cuenca: -2.9001)
  longitude: number; // EPSG:4326 (Ej. Cuenca: -79.0059)
}

export interface LostPetAlert {
  id: string;
  user_id: string;
  pet_id?: string | null;
  pet_name: string;
  alert_type: "lost" | "sighted";
  status: "active" | "reunited" | "closed";
  description: string;
  distinctive_traits?: string;
  contact_phone: string;
  photos: string[];
  incident_location: GeoPointWGS84;
  created_at: string;
}

export interface TriageResponse {
  triage_level: "RED" | "YELLOW" | "GREEN";
  reasoning: string;
  recommended_action: string;
  urgency_timeframe: "Inmediato (0h)" | "Menor a 12h" | "Rutinario";
}

// 1. Consulta RPC PostGIS: Alertas activas en un radio en metros (ST_DWithin + GiST)
export async function fetchActiveAlertsInRadius(
  center: GeoPointWGS84,
  radiusMeters: number = 5000
): Promise<LostPetAlert[]> {
  const { data, error } = await supabase.rpc("get_active_alerts_in_radius", {
    center_lng: center.longitude,
    center_lat: center.latitude,
    radius_meters: radiusMeters,
  });

  if (error) throw new Error(`Error PostGIS RPC: ${error.message}`);
  return (data || []) as LostPetAlert[];
}

// 2. Invocación de Edge Function: Sincronización GHL API v2 + Universal Link WhatsApp
export async function requestServiceViaGhlAndWhatsApp(payload: {
  contactData: {
    fullName: string;
    phone: string;
    email?: string;
    paymentPreference: "Pichincha" | "Produbanco" | "Deuna_P2P" | "Contraentrega";
    sectorCuenca: string;
  };
  petData: {
    name: string;
    breed: string;
    weightKg: number;
    microchipId?: string;
  };
  serviceDetails: {
    title: string;
    category: string;
    estimatedPrice: number;
    providerWhatsappE164: string;
  };
}): Promise<{ success: boolean; contactId: string; opportunityId: string; whatsappUrl: string }> {
  const { data, error } = await supabase.functions.invoke("create-ghl-lead", {
    body: payload,
  });

  if (error) throw new Error(`Error en Edge Function create-ghl-lead: ${error.message}`);
  return data;
}

// 3. Invocación de Edge Function: «Asistente de Triaje y Conducta Canina» (DeepSeek)
export async function queryPetAssistant(payload: {
  message: string;
  mode?: "triage" | "ethology";
  disclaimerAccepted: boolean;
  petProfile?: {
    name: string;
    species: "canine" | "feline" | "other";
    breed: string;
    weightKg: number;
    ageMonths: number;
  };
}) {
  if (!payload.disclaimerAccepted) {
    throw new Error("Debe aceptar el descargo obligatorio (Clickwrap) antes de usar el asistente.");
  }

  const { data, error } = await supabase.functions.invoke("pet-assistant", {
    body: payload,
  });

  if (error) throw new Error(`Error en Edge Function pet-assistant: ${error.message}`);
  return data;
}
