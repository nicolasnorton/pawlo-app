# PAWLO™ — Guía Oficial de Publicación en Apple App Store & Google Play Store

Esta arquitectura utiliza **React 19 + TypeScript + Vite + Ionic Capacitor 7** (`app.pawlo.os`) para compilar exactamente el mismo código fuente hacia **Web (PWA)**, **iOS (Apple App Store)** y **Android (Google Play Store)** con rendimiento nativo, soporte de Safe-Areas (`viewport-fit=cover`), barra de navegación inferior ergonómica y plugins nativos (`@capacitor/status-bar`, `@capacitor/haptics`, `@capacitor/app`).

---

## 1. Identificadores Oficiales de la App

| Propiedad | Valor Configurado |
| :--- | :--- |
| **App Name** | `PAWLO` |
| **Bundle ID (iOS) / Application ID (Android)** | `app.pawlo.os` |
| **Versión Inicial** | `2.0.0` (Build `1`) |
| **Directorio Web Compilado** | `dist/` |
| **Configuración Raíz** | [`capacitor.config.ts`](../capacitor.config.ts) |

---

## 2. Flujo Rápido de Compilación y Sincronización

Cada vez que realices cambios en React (`src/`), ejecuta:

```bash
# Compila el bundle de producción en dist/ y sincroniza con iOS y Android
npm run cap:sync
```

Si es la primera vez que generas las carpetas nativas `ios/` y `android/`:

```bash
# 1. Generar proyecto nativo de Xcode (iOS)
npm run cap:add:ios

# 2. Generar proyecto nativo de Android Studio (Android)
npm run cap:add:android

# 3. Sincronizar assets y plugins
npm run cap:sync
```

---

## 3. Publicación en Apple App Store (iOS / iPadOS)

### Requisitos Previos
- Mac con **Xcode 16+** instalado.
- Cuenta activa en **Apple Developer Program** ($99 USD/año).

### Pasos en Xcode
1. Abre el proyecto nativo ejecutando:
   ```bash
   npm run cap:open:ios
   ```
2. En Xcode, selecciona el proyecto **App** en el panel izquierdo:
   - En **Signing & Capabilities**, activa *Automatically manage signing* y selecciona tu **Team** de Apple Developer.
   - Verifica que el **Bundle Identifier** sea `app.pawlo.os`.
3. En `Info.plist`, incluye las descripciones de privacidad requeridas por Apple:
   - `NSLocationWhenInUseUsageDescription`: *"PAWLO utiliza tu ubicación para mostrar alertas de mascotas extraviadas, clínicas veterinarias y transporte Pet Taxi dentro de tu radio cercano."*
   - `NSCameraUsageDescription`: *"PAWLO necesita acceso a tu cámara para subir fotos al álbum de tu mascota, actualizar carnets de vacunación y reportar avistamientos."*
   - `NSPhotoLibraryUsageDescription`: *"PAWLO permite adjuntar fotografías y exámenes clínicos al expediente digital de tu mascota."*
4. Selecciona como destino **Any iOS Device (arm64)** y ve al menú **Product → Archive**.
5. Una vez completado el archivo, haz clic en **Distribute App → App Store Connect → Upload**.

---

## 4. Publicación en Google Play Store (Android)

### Requisitos Previos
- **Android Studio Ladybug / Meerkat** o superior.
- Cuenta en **Google Play Console** ($25 USD pago único).

### Pasos en Android Studio
1. Abre el proyecto nativo ejecutando:
   ```bash
   npm run cap:open:android
   ```
2. Espera a que **Gradle Sync** finalice.
3. Verifica los permisos en `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   ```
4. En el menú superior de Android Studio, selecciona **Build → Generate Signed App Bundle / APK...**
5. Elige **Android App Bundle (.aab)** (formato obligatorio para Google Play).
6. Selecciona o crea tu archivo Keystore (`pawlo-release-key.jks`) y genera el bundle en modo `release`.
7. Sube el archivo `app-release.aab` generado en `android/app/release/` directamente a **Google Play Console → Producción → Crear nueva versión**.
