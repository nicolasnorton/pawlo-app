/**
 * Extensiones de tipos para WebMCP (Web Model Context Protocol)
 * Modern Web Guidance para Formularios Declarativos y ModelContext API.
 */

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: any) => void;
      unregisterTool?: (name: string) => void;
    };
  }

  interface Navigator {
    modelContext?: {
      registerTool: (tool: any) => void;
    };
  }

  interface Window {
    pawloWebMCP?: any;
    pawloAgentTools?: any;
  }
}

declare module 'react' {
  interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
    toolautosubmit?: string | boolean;
  }
}

export {};
