# Director Musical — AgeCare

Módulo de generación de música por gestos para AgeCare (Proyecto de Especialidad, GPI UTEM 2026-II — cliente Alloxentric).

El adulto mayor crea música moviendo la mano frente a la cámara: la altura de la mano elige la nota (siempre dentro de una escala pentatónica, así que siempre suena bien) y el gesto de "pinza" (pulgar + índice) toca esa nota. Todo corre **en el navegador**, sin enviar video a ningún servidor y sin usar IA generativa — así se validó en la Fase 1 del proyecto.

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind** — desplegado en Vercel.
- **MediaPipe Hands** (`@mediapipe/tasks-vision`) — reconocimiento de manos on-device (WASM), sin servidor.
- **Tone.js** — síntesis de audio (Web Audio API) para tocar las notas.

Este es un **prototipo funcional del Hito 2** (reconocimiento gestual básico), pensado como punto de partida para el equipo. No están implementados todavía: el motor de mapeo avanzado (Hito 3), la interfaz accesible final (Hito 4), ni la sincronización con el backend de AgeCare.

## Correr en local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). El navegador va a pedir permiso de cámara — hay que aceptarlo. Funciona mejor en Chrome/Edge (WebGPU/WebGL para el delegate "GPU" de MediaPipe).

## Subir a GitHub

```bash
git add -A
git commit -m "Prototipo inicial: captura de gestos + síntesis de audio"
git branch -M main
git remote add origin https://github.com/<usuario-o-equipo>/director-musical.git
git push -u origin main
```

Si ya tienen un repo del equipo, usen ese `remote` en vez de crear uno nuevo.

## Desplegar en Vercel (para que Alloxentric y el profesor vean el avance)

1. Entrar a [vercel.com](https://vercel.com) y crear una cuenta (se puede con la cuenta de GitHub directamente — gratis para este uso).
2. Click en **"Add New" → "Project"**.
3. Elegir **"Import Git Repository"** y seleccionar el repo `director-musical` que acaban de subir. Si no aparece, hay que autorizar a Vercel a acceder a GitHub (botón "Configure GitHub App").
4. Vercel detecta automáticamente que es un proyecto Next.js — no hay que tocar nada en "Build and Output Settings" ni agregar variables de entorno (el módulo no usa ninguna).
5. Click en **"Deploy"**. En 1-2 minutos queda arriba en una URL tipo `director-musical.vercel.app`.

Desde ahí, **cada `git push` a `main` genera un deploy nuevo automáticamente**, y cada Pull Request genera un "Preview Deployment" con su propia URL — ideal para que el equipo trabaje en ramas separadas y Alloxentric/el profesor vean cada avance sin que nadie tenga que mandar nada a mano.

## Modo sin internet (OE1)

MediaPipe ya no descarga nada de CDNs externos: el WASM y el modelo se sirven desde `public/mediapipe/` (rutas en `lib/director/services/handTracker.ts`). Una vez cargada la página, la detección de manos y el audio funcionan sin conexión. **Todavía no hay service worker**, así que recargar la página sin internet no funciona; eso queda para un sprint siguiente.

| Archivo en `public/mediapipe/` | De dónde salió | Versión | SHA-256 |
| --- | --- | --- | --- |
| `wasm/vision_wasm_internal.js` | `node_modules/@mediapipe/tasks-vision/wasm/` | `@mediapipe/tasks-vision` 1.0.1 | `e170ee67dd4e16c1a6fcd8840a206687e5a59b22c20e4a902bc445b095454d73` |
| `wasm/vision_wasm_internal.wasm` | ídem | 1.0.1 | `8da277a733926eacd0474b8704b36742d6ec3231c57a860c5b889dff8f1df886` |
| `wasm/vision_wasm_nosimd_internal.js` | ídem | 1.0.1 | `e81d715a3d42cc3373602eb2f7aff795d164934db680e32496b65dab537f9658` |
| `wasm/vision_wasm_nosimd_internal.wasm` | ídem | 1.0.1 | `a28483cd42e74e855bf5ebdb6b40d9b66a5b49e35e95020bc97669e6822a3192` |
| `hand_landmarker.task` | `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task` | modelo float16, versión 1 | `fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1` |

- `FilesetResolver.forVisionTasks()` elige en el navegador entre la variante SIMD (`vision_wasm_internal`) y la de navegadores sin SIMD (`vision_wasm_nosimd_internal`), por eso se copian las dos. Las variantes `*_module_internal` solo se usan con `useModule = true` y no se copian.
- **Si se actualiza `@mediapipe/tasks-vision`, hay que volver a copiar el WASM** (debe calzar con la versión del paquete JS):

  ```bash
  cp node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.* \
     node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_nosimd_internal.* \
     public/mediapipe/wasm/
  ```

## Notas para el equipo

- **Gestos**: los umbrales (pinza, suavizado, histéresis, escala de notas, volumen) están como constantes en `lib/director/domain.ts`, cada una con su justificación.
- **Vista del adulto mayor (Sprint 5)**: wireframes en `docs/sprint5/wireframes.md` y contraste de colores en `docs/sprint5/contraste.md`.
