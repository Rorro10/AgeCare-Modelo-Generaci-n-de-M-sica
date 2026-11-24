# Integración con la suite AgeCare

Actividades 64 (integración del módulo) y 65 (revisión conceptual con Alloxentric). Este documento sirve de pauta para la reunión: describe cómo está integrado hoy el módulo y qué se propone para conectarlo a AgeCare. Las preguntas abiertas del final son las que hay que cerrar con Alloxentric.

## 1. El módulo integrado de punta a punta

```
Cámara ─► MediaPipe Hands ─► Motor de mapeo ─────► Tone.js ─► Sonido
(camera.ts) (handTracker.ts)  (gestureMapper,        (audioEngine.ts)
                              noteStabilizer,
                              volumeControl)
                                   │
                                   ├──► Interfaz accesible (viewModel + components/director)
                                   │
                                   └──► Métricas de sesión (sessionMetrics.ts)
                                           ├─► Guardado local (sessionStore.ts) ─► Panel /piloto ─► CSV
                                           └─► AgeCare por postMessage (agecareBridge.ts)
```

Todo corre en el navegador del adulto mayor. No hay servidor propio ni se envía video: así se validó en la Fase 1.

## 2. Propuesta: embeber el módulo en AgeCare con un iframe

AgeCare abre el Director Musical dentro de su propia interfaz:

```html
<iframe
  src="https://<despliegue-del-modulo>/?participante=<id-usuario-agecare>"
  allow="camera; autoplay"
  style="width: 100%; height: 100dvh; border: 0"
  title="Director Musical"
></iframe>
```

- `allow="camera; autoplay"` es **obligatorio**: sin él el navegador no deja usar la cámara dentro del iframe.
- `participante` es el identificador que AgeCare quiera asociar a la sesión (solo letras, números, `-` y `_`, máx. 40). Debe ser un id interno, no el nombre ni el RUT.
- El módulo ya funciona en celular vertical, que es como se usaría desde la app.

## 3. Mensajes que el módulo envía a AgeCare

Cuando corre dentro del iframe, el módulo envía mensajes `postMessage` a la ventana de AgeCare **solo** si se configuró el origen de AgeCare al desplegar:

```
NEXT_PUBLIC_AGECARE_ORIGIN=https://app.agecare.cl   # ejemplo; el real lo define Alloxentric
```

(En Vercel: *Project → Settings → Environment Variables*, y volver a desplegar.) Sin esa variable no se envía nada.

Formato de cada mensaje:

```json
{
  "source": "director-musical",
  "version": 1,
  "type": "session-update",
  "session": {
    "version": 1,
    "id": "6f1c…",
    "participant": "usr_123",
    "startedAt": "2026-11-24T15:00:00.000Z",
    "updatedAt": "2026-11-24T15:08:12.400Z",
    "ended": false,
    "totalSeconds": 492.4,
    "activeSeconds": 455.1,
    "handVisibleSeconds": 371.0,
    "handVisibleRatio": 0.815,
    "secondsToFirstNote": 9.8,
    "notesPlayed": 104,
    "distinctNotes": 9,
    "notesPerMinute": 13.7,
    "pauses": 1,
    "instrument": "campanas",
    "instrumentsUsed": ["piano", "campanas"],
    "volumeChanges": { "boton": 2, "mano": 0 },
    "volumeStep": 4,
    "cameraDenied": false,
    "errors": 0
  }
}
```

*(Valores de ejemplo para mostrar el formato.)*

- `type: "session-update"`: al empezar, al pausar, cada ~15 s mientras se toca y al pasar a otra app.
- `type: "session-end"`: al cerrar o salir del módulo. Es el que AgeCare debería guardar.
- El mismo `session.id` se repite en todos los mensajes de una sesión: AgeCare puede quedarse con el último.

Ejemplo de recepción del lado de AgeCare:

```js
window.addEventListener("message", (event) => {
  if (event.origin !== "https://<despliegue-del-modulo>") return;
  const msg = event.data;
  if (msg?.source !== "director-musical" || msg.version !== 1) return;
  guardarSesionMusical(msg.session); // upsert por msg.session.id
});
```

Definición de cada campo: [metricas-de-uso.md](metricas-de-uso.md).

## 4. Lo que queda fuera de esta propuesta

- **Backend propio**: el módulo no guarda nada en servidores; persistir las sesiones es responsabilidad de AgeCare (o se define otra vía en la reunión).
- **Recargar sin internet**: una vez cargada la página funciona sin conexión, pero aún no hay service worker para abrirla sin internet.
- **Autenticación**: el módulo no conoce usuarios; confía en el `participante` que le pasa AgeCare.

## 5. Preguntas para la reunión con Alloxentric

1. ¿AgeCare puede embeber módulos web en iframe (app móvil con WebView o web)? Si es WebView nativa, ¿da permiso de cámara a la página?
2. ¿Cuál es el origen exacto de AgeCare para `NEXT_PUBLIC_AGECARE_ORIGIN`? ¿Hay entornos de prueba y producción distintos?
3. ¿Qué identificador de usuario se usará como `participante`?
4. ¿Qué métricas les interesan para el cuidador o el profesional? ¿Falta o sobra alguna?
5. ¿Prefieren recibir cada actualización o solo `session-end`?
6. ¿Quién despliega el módulo en producción (Vercel del equipo o infraestructura de Alloxentric)?
7. ¿Hay requisitos de privacidad o consentimiento propios de AgeCare que debamos cumplir en el piloto?

### Acuerdos de la reunión

*(Completar durante la reunión: fecha, asistentes, respuestas y tareas que salen para el Sprint 8.)*
