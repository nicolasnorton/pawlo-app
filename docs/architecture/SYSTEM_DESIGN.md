# Arquitectura Técnica — KIRUPET™

Este documento describe la topología técnica, el flujo de datos y la seguridad del sistema **KIRUPET™** (`com.kirupet.app`).

---

## 1. Topología del Sistema

```mermaid
graph TD
    Client["Cliente Web / Mobile (React 19 + TypeScript + Capacitor)"] --> EdgeGateway["Supabase Edge Functions Gateway (Deno)"]
    Client --> Leaflet["Cartografía en Vivo (OpenStreetMap / Leaflet)"]
    
    subgraph SupabasePlatform["Supabase Platform"]
        EdgeGateway --> DB[("PostgreSQL 15 + PostGIS (EPSG:4326)")]
        EdgeGateway --> FunctionAssistant["pet-assistant (Kiru IA / DeepSeek Router)"]
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
    participant UI as Interfaz KIRUPET
    participant Edge as Edge Function (create-ghl-lead)
    participant CRM as GoHighLevel API v2
    participant WA as WhatsApp Proveedor

    User->>UI: Completa solicitud de servicio y selecciona método de pago
    UI->>Edge: POST /create-ghl-lead con datos de contacto y paciente
    
    alt Sincronización GHL Exitosa
        Edge->>CRM: Crear Contacto + Oportunidad
        CRM-->>Edge: OK (ID Oportunidad)
    else Fallo o Timeout de CRM Externo
        Edge->>Edge: Activar Fallback Outbox (Ref Local KIRU-CUE-XXXX)
    end

    Edge-->>UI: Devuelve enlace wa.me garantizado con contexto
    UI->>WA: Redirección con mensaje pre-llenado listo para enviar
```

---

## 3. Modelo de Datos Geoespacial

### Tabla: `public.lost_pet_alerts`
Almacena reportes en tiempo real de mascotas extraviadas y avistamientos ciudadanos:

```sql
create table if not exists public.lost_pet_alerts (
  id uuid primary key default gen_random_uuid(),
  pet_name text not null,
  species text not null check (species in ('dog', 'cat', 'other')),
  status text not null check (status in ('lost', 'sighted', 'resolved')),
  description text,
  location geography(Point, 4326) not null,
  photo_url text,
  contact_phone text not null,
  reward_amount numeric default 0,
  created_at timestamptz default now()
);

-- Índice espacial fundamental para consultas sub-10ms
create index if not exists lost_pet_alerts_location_gist 
on public.lost_pet_alerts using gist (location);
```

---

## 4. Función de Búsqueda por Radio (`find_nearby_pets`)

```sql
create or replace function public.find_nearby_pets(
  center_lat double precision,
  center_lng double precision,
  radius_meters double precision default 5000
)
returns table (
  id uuid,
  pet_name text,
  species text,
  status text,
  description text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  contact_phone text,
  reward_amount numeric,
  created_at timestamptz
)
language sql
stable
as $$
  select 
    a.id,
    a.pet_name,
    a.species,
    a.status,
    a.description,
    st_y(a.location::geometry) as latitude,
    st_x(a.location::geometry) as longitude,
    st_distance(a.location, st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography) as distance_meters,
    a.contact_phone,
    a.reward_amount,
    a.created_at
  from public.lost_pet_alerts a
  where st_dwithin(
    a.location,
    st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
    radius_meters
  )
  order by distance_meters asc;
$$;
```

---

## 5. Pruebas y Validación Automatizada

La suite sintética `tests/run_validation_suite.py` verifica de forma continua:
1. **Cortafuegos Farmacológico**: 100% de tasa de bloqueo ante consultas de dosificación y fármacos tóxicos.
2. **Latencia Espacial**: Medición del tiempo de ejecución de consultas PostGIS (objetivo < 10ms, verificado en 0.172ms).
3. **Resiliencia de Enlaces**: Integridad de formato E.164 y codificación URL de parámetros.
