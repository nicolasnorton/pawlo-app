import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_TOKEN = Deno.env.get("GHL_PRIVATE_ACCESS_TOKEN");
const GHL_LOCATION_ID = Deno.env.get("GHL_LOCATION_ID");
const GHL_PIPELINE_ID = Deno.env.get("GHL_SERVICES_PIPELINE_ID");
const GHL_STAGE_ID = Deno.env.get("GHL_NEW_LEAD_STAGE_ID");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ContactPayload {
  fullName: string;
  phone: string;
  email?: string;
  paymentPreference?: "Pichincha" | "Produbanco" | "Deuna_P2P" | "Contraentrega";
  sectorCuenca?: string;
}

interface PetPayload {
  name: string;
  breed?: string;
  weightKg?: number;
  species?: "canine" | "feline" | "other";
  microchipId?: string;
}

interface ServicePayload {
  title: string;
  category: string;
  estimatedPrice?: number;
  providerName?: string;
  providerWhatsappE164?: string;
}

function normalizeEcuadorPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("593")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) {
    return `+593${digits.substring(1)}`;
  }
  return `+593${digits}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      contactData,
      petData,
      serviceDetails,
    }: {
      contactData: ContactPayload;
      petData: PetPayload;
      serviceDetails: ServicePayload;
    } = await req.json();

    if (!contactData?.fullName || !contactData?.phone || !petData?.name || !serviceDetails?.title) {
      return new Response(
        JSON.stringify({
          error: "Datos incompletos: se requiere contactData (fullName, phone), petData (name) y serviceDetails (title).",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const formattedPhone = normalizeEcuadorPhone(contactData.phone);
    const targetWaPhone = (serviceDetails.providerWhatsappE164 || "593998408369").replace(/\D/g, "");
    
    // Fallback de contingencia: generamos un ID de respaldo local
    const fallbackId = `CUE-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let contactId = fallbackId;
    let opportunityId: string | null = null;
    let ghlSynchronized = false;
    let syncError: string | null = null;

    // FASE 2: Intento de sincronización con GoHighLevel API v2 con degradación elegante
    if (GHL_TOKEN && GHL_LOCATION_ID) {
      try {
        const contactRes = await fetch(`${GHL_API_BASE}/contacts/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GHL_TOKEN}`,
            "Version": "2021-07-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locationId: GHL_LOCATION_ID,
            name: contactData.fullName.trim(),
            phone: formattedPhone,
            email: contactData.email || undefined,
            city: "Cuenca",
            state: "Azuay",
            country: "EC",
            tags: [
              "app-mascotas-cuenca",
              serviceDetails.category,
              contactData.paymentPreference ? `pago-${contactData.paymentPreference.toLowerCase()}` : "pago-por-definir",
            ],
            customFields: [
              { key: "nombre_mascota", field_value: petData.name },
              { key: "raza_mascota", field_value: petData.breed || "Mestizo" },
              { key: "peso_kg", field_value: String(petData.weightKg ?? "") },
              { key: "microchip_cga", field_value: petData.microchipId || "No registrado" },
              { key: "sector_cuenca", field_value: contactData.sectorCuenca || "Cuenca Urbano" },
              { key: "metodo_pago_preferido", field_value: contactData.paymentPreference || "Deuna_P2P" },
            ],
          }),
        });

        if (contactRes.ok) {
          const contactJson = await contactRes.json();
          if (contactJson.contact?.id) {
            contactId = contactJson.contact.id;
            ghlSynchronized = true;

            // Crear Oportunidad en Pipeline
            if (GHL_PIPELINE_ID && GHL_STAGE_ID) {
              const oppRes = await fetch(`${GHL_API_BASE}/opportunities/`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${GHL_TOKEN}`,
                  "Version": "2021-07-28",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  locationId: GHL_LOCATION_ID,
                  pipelineId: GHL_PIPELINE_ID,
                  pipelineStageId: GHL_STAGE_ID,
                  name: `${contactData.fullName} - ${serviceDetails.title} (${petData.name})`,
                  status: "open",
                  contactId: contactId,
                  monetaryValue: Number(serviceDetails.estimatedPrice || 0),
                }),
              });
              if (oppRes.ok) {
                const oppJson = await oppRes.json();
                opportunityId = oppJson.opportunity?.id || null;
              }
            }
          }
        } else {
          syncError = `GHL HTTP ${contactRes.status}`;
        }
      } catch (err) {
        syncError = (err as Error).message;
        console.warn("Fallo de conexión GHL, activando fallback de WhatsApp:", syncError);
      }
    } else {
      syncError = "GHL credentials not configured; operating in direct resilient mode";
    }

    // 3. Construir Universal Link de WhatsApp (wa.me) GARANTIZADO aunque GHL falle
    const oppReference = opportunityId || `CUE-${contactId.slice(0, 8).toUpperCase()}`;
    const waText = `Hola, solicito coordinar el servicio de ${serviceDetails.title} para mi mascota ${petData.name} en Cuenca. Ref: ${oppReference}. Sector: ${contactData.sectorCuenca || "Cuenca"}. Método de pago: ${contactData.paymentPreference || "Deuna"}.`;
    const whatsappUrl = `https://wa.me/${targetWaPhone}?text=${encodeURIComponent(waText)}`;

    return new Response(
      JSON.stringify({
        success: true,
        contactId,
        opportunityId: oppReference,
        ghlSynchronized,
        syncNotice: syncError ? "Procesado vía canal directo con soporte de contingencia." : "Sincronizado con CRM GHL.",
        whatsappUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
