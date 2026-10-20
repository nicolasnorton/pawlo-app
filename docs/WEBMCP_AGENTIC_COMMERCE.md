# KIRUPET™ WebMCP & Arquitectura de Comercio Agéntico (2026)

## 1. Visión & Objetivos
KIRUPET™ implementa el estándar emergente **WebMCP (Web Model Context Protocol)** guiado por las directrices de *Modern Web Guidance* (Google Chrome & W3C Agentic Web Community). 

El objetivo es doble:
1. **Comercio Agéntico Autónomo**: Permitir que agentes IA de navegación (Chrome DevTools MCP, Claude in Chrome, Gemini Browser Agent, ChatGPT Web Extension o asistentes en segundo plano) interactúen directamente con el catálogo, agreguen productos al carrito y preparen pedidos sin requerir scraping frágil de selectores CSS.
2. **Minimización Extrema de Servidor & DeepSeek API (Cero Costo)**: Transferir más del 90% del razonamiento clínico y de bienestar a la capa del dispositivo/navegador (*Edge Computing*) mediante un motor de triaje determinístico local persistido en **IndexedDB**, garantizando cero latencia (1ms), privacidad absoluta y un cortafuegos farmacológico estricto guiado por **Kiru IA**.

---

## 2. Los Dos Pilares de WebMCP en KIRUPET™

### A. Herramientas Imperativas (`document.modelContext.registerTool`)
KIRUPET™ implementa detección de capacidades y registro con control de ciclo de vida (`AbortController`):

```typescript
// Detección nativa con fallback transparente
const modelContext = (document as any).modelContext || (navigator as any).modelContext;
if (modelContext && typeof modelContext.registerTool === 'function') {
  modelContext.registerTool({
    name: 'pawlo_search_catalog', // o alias kirupet_search_catalog
    description: 'Busca productos en el catálogo de alimentos y farmacia de KIRUPET',
    readOnlyHint: true,
    parameters: { ... },
    signal: abortController.signal,
    execute: async (params) => { ... }
  });
}
```

En navegadores sin WebMCP experimental habilitado, se expone un protocolo universal estandarizado en:
- `window.kirupetWebMCP` (y alias compatible `window.pawloWebMCP`)
- `window.kirupetAgentTools` (y alias compatible `window.pawloAgentTools`)
- Evento DOM de difusión: `window.dispatchEvent(new CustomEvent('webmcp:ready'))`

### Catálogo de Herramientas Registradas (8 Herramientas de Producción):
| Nombre de la Herramienta | Tipo | `readOnlyHint` | Propósito |
| :--- | :--- | :---: | :--- |
| `pawlo_search_catalog` | Búsqueda | `true` | Filtra por término, categoría, especie y precio máximo en catálogo local |
| `pawlo_get_product_detail` | Lectura | `true` | Devuelve especificaciones técnicas y requisitos de receta veterinaria |
| `pawlo_manage_cart` | Mutación | `false` | Añade (`add`), actualiza cantidad (`update_qty`) o remueve (`remove`) productos |
| `pawlo_get_cart_and_checkout_summary` | Lectura | `true` | Genera cálculo de delivery express, subtotal y payload de WhatsApp / Deuna |
| `pawlo_list_user_pets` | Bóveda | `true` | Retorna mascotas registradas, peso, edad, alergias, carnet de vacunas y chip |
| `pawlo_calculate_diet_ration` | Biometría | `true` | Calcula el RER ($70 \times \text{kg}^{0.75}$), MER y ración diaria exacta en gramos |
| `pawlo_verify_microchip` | Seguridad | `true` | Valida códigos RFID FDX-B de 15 dígitos bajo normas ISO 11784/11785 |
| `pawlo_triage_symptom` | Neural Edge | `true` | Ejecuta triaje clínico local con cortafuegos farmacológico sin gastar API |

---

### B. Formularios Declarativos WebMCP (`toolname`, `tooldescription`, `toolautosubmit`)
En cumplimiento de *Modern Web Guidance*, los formularios críticos del DOM incorporan atributos declarativos para que cualquier agente con acceso al DOM pueda descubrirlos y completarlos de forma semántica:

1. **Búsqueda en Tienda**:
   ```html
   <form 
     toolname="pawlo_search_catalog"
     tooldescription="Búsqueda de productos de alimentación, farmacia y juguetes con filtros de especie y categoría"
     toolautosubmit="true">
     <input name="query" type="text" />
   </form>
   ```

2. **Checkout Express**:
   ```html
   <form 
     toolname="pawlo_checkout_cart"
     tooldescription="Formulario para despachar el pedido con dirección de entrega y forma de pago"
     toolautosubmit="true">
     ...
   </form>
   ```

3. **Reserva de Servicios Clínicos & Pet Taxi**:
   ```html
   <form 
     toolname="pawlo_book_service"
     tooldescription="Reserva servicios veterinarios, hospedaje o transporte pet taxi con expediente KIRUPET"
     toolautosubmit="true">
     ...
   </form>
   ```

4. **Verificación Biométrica de Microchip**:
   ```html
   <form 
     toolname="pawlo_verify_microchip"
     tooldescription="Valida microchip biométrico ISO 11784/11785 FDX-B de 15 dígitos de forma local"
     toolautosubmit="true">
     <input name="chipNumber" type="text" />
   </form>
   ```

---

## 3. Motor Edge de Triaje Clínico & Cortafuegos Farmacológico (Kiru IA)

### A. Cortafuegos Regulatorio
Para proteger la vida de caninos y felinos y evitar responsabilidad legal médica:
- **Detección**: Fármacos humanos (*ibuprofeno, paracetamol, amoxicilina, aspirina, diclofenaco, ivermectina, tramadol, ketoprofeno, naproxeno*).
- **Intención**: Consultas de dosificación (*cuántas gotas, cuántos mg, cada cuánto, qué dosis*).
- **Acción Inmediata**: Bloqueo absoluto a nivel de navegador (0ms, 0 tokens a DeepSeek). Explica la fisiopatología del daño (necrosis papilar renal, hemorragia gastrointestinal y daño hepático fulminante) y deriva a hospital presencial 24/7.

### B. Persistencia & Telemetría en IndexedDB (`pawlo_offline_vault_v1`)
- **`triage_cache`**: Almacena las consultas pasadas por hash semántico de especie y síntomas. Si el usuario o un agente repite una consulta o signo similar, se resuelve desde el disco local en 1ms.
- **`agent_telemetry`**: Registra llamadas evitadas a la API de DeepSeek, tokens ahorrados y ancho de banda preservado por Kiru IA.

---

## 4. Consola Interactiva WebMCP en la App
Los usuarios y desarrolladores pueden abrir la **Consola Agéntica** directamente desde la barra de telemetría superior o desde la Tienda:
- Muestra el estado del protocolo (Nativo Chromium vs Bridge Universal).
- Contador en vivo de llamadas DeepSeek evitadas y tokens ahorrados.
- Consola de ejecución en vivo con plantillas JSON para probar cualquiera de las 8 herramientas.
- Resumen didáctico de cómo los agentes exploran la web moderna.
