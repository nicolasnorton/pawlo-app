# Arquitectura Técnica — PAWLO™

Este documento describe la topología técnica, el flujo de datos y la seguridad del sistema **PAWLO™**.

---

## 1. Topología del Sistema

```mermaid
graph TD
    Client["Cliente Web / Mobile (React 19 + TypeScript)"] --> EdgeGateway["Supabase Edge Functions Gateway (Deno)"]
    Client --> Leaflet["Cartografía en Vivo (OpenStreetMap / Leaflet)"]
    
    subgraph SupabasePlatform["Supabase Platform"]
        EdgeGateway --> DB[("PostgreSQL 15 + PostGIS (EPSG:4326)")]
        EdgeGateway --> FunctionAssistant["pet-assistant (DeepSeek Router)"]
        EdgeGateway --> FunctionLead["create-ghl-lead (Outbox Resilient)"]
        DB --> RLS["Row Level Security (RLS)"]
        DB --> SpatialIndex["GiST R-Tree Indexing"]
    end

    subgraph ExternalServices["Servicios y Pasarelas Externas"]
        FunctionAssistant --> DeepSeekAPI["DeepSeek-V3 / R1 Reasoner API"]
        FunctionLead --> GHL["GoHighLevel CRM API v2"]
        FunctionLead -. Fallback .-> WhatsAppDirect["WhatsApp Directo (E.164 + Deuna / Pichincha)"]
    end
```

---

## 2. Flujo de Resiliencia en Comercio Conversacional

```mermaid
sequenceDiagram
    autonumber
    actor User as Tutor de Mascota
    participant UI as Interfaz PAWLO
    participant Edge as Edge Function (create-ghl-lead)
    participant CRM as GoHighLevel API v2
    participant WA as WhatsApp Proveedor

    User->>UI: Completa solicitud de servicio y selecciona método de pago
    UI->>Edge: POST /create-ghl-lead con datos de contacto y paciente
    
    alt Sincronización GHL Exitosa
        Edge->>CRM: Crear Contacto + Oportunidad
        CRM-->>Edge: OK (ID Oportunidad)
    else Fallo o Timeout de CRM Externo
        Edge->>Edge: Activar Fallback Outbox (Ref Local PWL-CUE-XXXX)
    end

    Edge-->>UI: Devuelve enlace wa.me garantizado con contexto
    UI->>WA: Redirección con mensaje pre-llenado listo para enviar
```

---

## 3. Modelo de Datos Geoespacial

### Tabla: `public.lost_pet_alerts`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único primario |
| `pet_name` | VARCHAR(80) | Nombre de la mascota |
| `alert_type` | VARCHAR(20) | Tipo: `lost` o `sighted` |
| `incident_location` | GEOGRAPHY(Point, 4326) | Coordenadas WGS84 indexadas con GiST |
| `status` | VARCHAR(20) | Estado: `active`, `reunited`, `closed` |
| `contact_phone` | VARCHAR(50) | Teléfono de contacto directo |

### Función RPC: `get_active_alerts_in_radius`
```sql
CREATE OR REPLACE FUNCTION public.get_active_alerts_in_radius(
    center_lng DOUBLE PRECISION,
    center_lat DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 5000
)
RETURNS TABLE (...) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.lost_pet_alerts
    WHERE status = 'active'
      AND ST_DWithin(
          incident_location,
          ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
          radius_meters
      );
END;
$$ LANGUAGE plpgsql STABLE;
```
