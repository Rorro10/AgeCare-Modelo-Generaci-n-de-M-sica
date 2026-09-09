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

## Notas para el equipo

- **Offline-first (OE1) pendiente**: hoy MediaPipe carga el modelo y el WASM desde CDNs externos (jsDelivr / Google Storage) la primera vez. Para cumplir "funcionamiento offline-first" de verdad, el siguiente paso es copiar esos archivos a `/public` y apuntar `FilesetResolver`/`modelAssetPath` a rutas locales, más un service worker (`next-pwa`) para cachear todo.
- **Gestos**: los umbrales (`PINCH_THRESHOLD`, la escala de notas, qué landmark controla qué) están todos como constantes al inicio de `components/DirectorMusical.tsx` — son el punto de partida para las pruebas de precisión/latencia que le tocan a Camilo en el Sprint 2.
- **UI accesible**: la pantalla actual es solo funcional, no cumple todavía los criterios de "vista del adulto mayor" (mosaicos grandes, alto contraste, tolerancia a temblores) — eso es el foco del Hito 4.
