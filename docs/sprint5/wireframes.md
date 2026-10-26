# Sprint 5 · Actividad 49 — Wireframes de la vista del adulto mayor

Módulo **Director Musical** (AgeCare). Usuarios: adultos mayores, con posible
temblor y baja visión. Estos wireframes definen **qué ve, qué lee y qué puede
tocar** la persona en cada estado, antes de programar la Actividad 51.

## Principios que guían todos los estados

- **Una cosa importante a la vez.** La nota actual es lo más grande de la
  pantalla; el resto se subordina a ella (jerarquía por tamaño, peso y color).
- **Siempre se sabe qué hacer después.** Una única línea de mensaje dice el
  siguiente paso en lenguaje simple. Es la única región `aria-live="polite"`.
- **Los controles van cerca de lo que afectan.** El indicador de franjas está
  pegado a la cámara: la persona ve su mano y, al lado, la altura y la nota.
- **Nada que exija precisión.** Botones de ≥ 64 px de alto, ícono + texto, un
  solo toque. Sin sliders, swipes ni doble clic. Foco visible y grueso.
- **Mismo lugar, mismo comportamiento.** El área de la nota, la cámara, la
  línea de mensaje y la fila de botones no cambian de sitio entre estados;
  solo cambia su contenido. Así nada "salta" de lugar.

## Revisión tras la primera prueba (celular primero)

Al probarla, la pantalla no cabía (había que bajar para el volumen), la
cámara se veía chica y el mensaje "Muestra tu mano" aparecía dos veces. Se
ajustó así, y prima sobre los esquemas de abajo donde difieran:

- **Pensada para celular vertical.** La pantalla ocupa exactamente el alto de
  la ventana: logo AgeCare (sin fondo) centrado con el título, nota compacta,
  cámara con sus franjas tomando todo el espacio libre, mensaje, "Pausar" a lo
  ancho, nivel de volumen y "Más suave" / "Más fuerte" lado a lado. Todo se ve
  sin bajar (verificado en 360×640, 390×664, 412×780 y 1366×650).
- **La imagen de la cámara se ve completa**, con bandas negras si sobra
  espacio; las franjas miden lo mismo que la imagen visible.
- **El mensaje no se repite**: si dice lo mismo que la tarjeta grande o el
  aviso de la cámara, solo lo oye el lector de pantalla.
- **Siempre tema claro**, para que el logo se lea.

```
┌──────────────────────────┐
│   [logo] Director Musical│
│ ┌──────────────────────┐ │
│ │      Sol agudo       │ │  ← nota compacta
│ └──────────────────────┘ │
│ ┌──────────────────┐┌──┐ │
│ │                  ││La│ │
│ │     CÁMARA       ││..│ │  ← todo el alto libre
│ │                  ││Do│ │
│ └──────────────────┘└──┘ │
│  Sube o baja la mano…    │
│ ┌──────────────────────┐ │
│ │      ⏸  Pausar       │ │
│ └──────────────────────┘ │
│    Volumen ▮▮▮▯▯ 3 de 5  │
│ ┌──────────┐┌──────────┐ │
│ │🔉 M. suave││🔊 M. fuerte│ │
│ └──────────┘└──────────┘ │
└──────────────────────────┘
```

## Esqueleto común (pantalla ancha)

Todo centrado en una columna de ~60 rem de ancho máximo.

```
┌──────────────────────────────────────────────────────────────┐
│ [logo] Director Musical                                      │  ← encabezado
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                 ┌──────────────────────────┐                 │
│                 │                          │                 │
│                 │      ÁREA DE LA NOTA     │                 │  ← nota gigante
│                 │     (o mensaje guía)     │                 │    o guía grande
│                 └──────────────────────────┘                 │
│                                                              │
│        ┌────────────────────────────────┐ ┌──────────┐       │
│        │                                │ │ La       │       │
│        │                                │ │ Sol      │       │
│        │            CÁMARA              │ │ Mi       │       │  ← cámara (espejo)
│        │         (en espejo)            │ │ Re       │       │    + 10 franjas
│        │                                │ │ Do       │       │
│        │                                │ │ La       │       │
│        │                                │ │ ...      │       │
│        └────────────────────────────────┘ └──────────┘       │
│                                                              │
│          « línea de mensaje: el siguiente paso »             │  ← aria-live
│                                                              │
│   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│   │ ▶  Empezar     │ │ 🔉 Más suave   │ │ 🔊 Más fuerte  │   │  ← botones ≥ 64 px
│   └────────────────┘ └────────────────┘ └────────────────┘   │
│                     Volumen ▮▮▮▯▯  3 de 5                    │
└──────────────────────────────────────────────────────────────┘
```

### Pantalla angosta o zoom al 200 %

Con zoom al 200 % un portátil de 1280 px queda en ~640 px CSS: mismo orden,
todo apilado, sin scroll horizontal. Las franjas **siguen al lado** de la
cámara (más angostas, solo con el nombre) porque su sentido depende de estar
a la misma altura que la imagen. Los botones pasan a una columna.

```
┌──────────────────────────────┐
│ [logo] Director Musical      │
├──────────────────────────────┤
│   ┌──────────────────────┐   │
│   │    ÁREA DE LA NOTA   │   │
│   └──────────────────────┘   │
│ ┌────────────────────┐ ┌───┐ │
│ │                    │ │La │ │
│ │      CÁMARA        │ │Sol│ │
│ │                    │ │...│ │
│ └────────────────────┘ └───┘ │
│  « línea de mensaje »        │
│ ┌──────────────────────────┐ │
│ │ ▶  Empezar               │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 🔉 Más suave             │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 🔊 Más fuerte            │ │
│ └──────────────────────────┘ │
│   Volumen ▮▮▮▯▯  3 de 5      │
└──────────────────────────────┘
```

### El indicador de 10 franjas

Arriba la nota más aguda, abajo la más grave (igual que subir y bajar la
mano). Cada franja muestra su nombre y el color de su nota. La franja donde
está la mano se rellena con el color de la nota y lleva una flecha `◀`.

```
 ┌──────────┐
 │ La       │  9  (agudo)
 │ Sol      │  8
 │ Mi       │  7
 │ Re       │  6
 │▓Do▓▓▓▓▓◀ │  5  ← aquí está tu mano
 │ La       │  4
 │ Sol      │  3
 │ Mi       │  2
 │ Re       │  1
 │ Do       │  0  (grave)
 └──────────┘
```

Para un lector de pantalla es una lista con el nombre "Altura de tu mano" y
la franja actual marcada con `aria-current`. No se anuncia en vivo: cambia
demasiado seguido.

---

## Estado 1 — Inicio (antes de "Empezar")

```
┌──────────────────────────────────────────────────────────────┐
│ [logo] Director Musical                                      │
├──────────────────────────────────────────────────────────────┤
│                 ┌──────────────────────────┐                 │
│                 │           ♪              │                 │
│                 │   Toca música con tu     │                 │
│                 │          mano            │                 │
│                 └──────────────────────────┘                 │
│        ┌────────────────────────────────┐ ┌──────────┐       │
│        │                                │ │ La       │       │
│        │          📷                    │ │ Sol      │       │
│        │   La cámara está apagada       │ │ ...      │       │
│        │                                │ │ Do       │       │
│        └────────────────────────────────┘ └──────────┘       │
│   El navegador te pedirá usar la cámara. Toca «Permitir».    │
│                  ┌──────────────────────┐                    │
│                  │  ▶   Empezar         │                    │
│                  └──────────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

- **Ve:** título "Toca música con tu mano", la cámara apagada, las franjas en
  gris (sin nota activa) y **un solo botón**: Empezar.
- **Lee:** "El navegador te pedirá usar la cámara. Toca «Permitir»." Avisar
  antes del diálogo del navegador evita que lo rechace por sorpresa.
- **Puede tocar:** Empezar (recibe el foco al cargar la página).
- **No aparecen** los botones de volumen: todavía no hay sonido que ajustar y
  una sola opción hace obvio el primer paso.

## Estado 2 — Cargando

```
│                 ┌──────────────────────────┐                 │
│                 │           ⏳             │                 │
│                 │      Preparando…         │                 │
│                 └──────────────────────────┘                 │
│        ┌────────────────────────────────┐ ┌──────────┐       │
│        │   Preparando la cámara y       │ │ (gris)   │       │
│        │   la música…                   │ │          │       │
│        └────────────────────────────────┘ └──────────┘       │
│              Preparando la cámara y la música…               │
│                  ┌──────────────────────┐                    │
│                  │  ⏳  Preparando…      │  (deshabilitado)   │
│                  └──────────────────────┘                    │
```

- **Ve:** el botón cambia a "Preparando…" en el mismo lugar (no desaparece,
  así el foco no se pierde). Un indicador de actividad simple.
- **Lee / se anuncia:** "Preparando la cámara y la música…".
- **Puede tocar:** nada (el botón queda `disabled` con `aria-busy`).
- Con `prefers-reduced-motion`, el indicador no gira: solo el texto.

## Estado 3 — Permiso de cámara denegado

```
│                 ┌──────────────────────────┐                 │
│                 │           🚫📷           │                 │
│                 │  No podemos ver la       │                 │
│                 │  cámara                  │                 │
│                 └──────────────────────────┘                 │
│        ┌────────────────────────────────┐ ┌──────────┐       │
│        │ Para permitirla:               │ │ (gris)   │       │
│        │ 1. Toca el candado 🔒 junto a  │ │          │       │
│        │    la dirección de la página.  │ │          │       │
│        │ 2. Elige «Permitir» en Cámara. │ │          │       │
│        │ 3. Toca «Intentar de nuevo».   │ │          │       │
│        └────────────────────────────────┘ └──────────┘       │
│           No tenemos permiso para usar la cámara.            │
│                  ┌──────────────────────┐                    │
│                  │  ↻  Intentar de nuevo │                   │
│                  └──────────────────────┘                    │
```

- **Ve:** el área de la cámara cambia a 3 pasos numerados, cortos.
- **Lee / se anuncia:** "No tenemos permiso para usar la cámara."
- **Puede tocar:** Intentar de nuevo (recibe el foco).
- Se distingue del error genérico por el `NotAllowedError` de `getUserMedia`.
  El tono no culpa a la persona.

## Estado 4 — Sin mano (funcionando, sin mano por más de 3 s)

```
│                 ┌──────────────────────────┐                 │
│                 │           ✋             │                 │
│                 │   Muestra tu mano a la   │                 │
│                 │        cámara            │                 │
│                 └──────────────────────────┘                 │
│        ┌────────────────────────────────┐ ┌──────────┐       │
│        │                                │ │ La       │       │
│        │     (imagen de la cámara)      │ │ ...      │       │
│        │                                │ │ (sin     │       │
│        │                                │ │  franja  │       │
│        │                                │ │  activa) │       │
│        └────────────────────────────────┘ └──────────┘       │
│                 Muestra tu mano a la cámara                  │
│   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│   │ ⏸  Pausar      │ │ 🔉 Más suave   │ │ 🔊 Más fuerte  │   │
│   └────────────────┘ └────────────────┘ └────────────────┘   │
│                     Volumen ▮▮▮▯▯  3 de 5                    │
```

- **Ve:** el área de la nota se reemplaza por la **guía grande** "Muestra tu
  mano a la cámara". Ninguna franja activa.
- **Lee / se anuncia:** "Muestra tu mano a la cámara".
- **Puede tocar:** Pausar, Más suave, Más fuerte.
- **Los 3 s:** si la mano se pierde un momento (parpadeo de la detección o la
  mano sale y vuelve), durante los primeros 3 s se mantiene la última nota y
  no se anuncia nada; recién pasados 3 s aparece la guía. Al iniciar, como
  todavía no se ha visto ninguna mano, la guía aparece de inmediato.

## Estado 5 — Mano visible, sin pinza

```
│                 ┌──────────────────────────┐                 │
│                 │                          │                 │
│                 │           Mi             │  ← color de Mi  │
│                 │                          │                 │
│                 └──────────────────────────┘                 │
│        ┌────────────────────────────────┐ ┌──────────┐       │
│        │                                │ │ La       │       │
│        │          ✋ (puntos de la      │ │ Sol      │       │
│        │              mano dibujados)   │ │▓Mi▓▓▓▓◀  │       │
│        │                                │ │ Re       │       │
│        │                                │ │ Do       │       │
│        └────────────────────────────────┘ └──────────┘       │
│   Sube o baja la mano para elegir la nota.                   │
│   Junta el pulgar y el índice para tocar.                    │
│   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│   │ ⏸  Pausar      │ │ 🔉 Más suave   │ │ 🔊 Más fuerte  │   │
│   └────────────────┘ └────────────────┘ └────────────────┘   │
```

- **Ve:** la nota gigante con su nombre en español y su color; la franja
  correspondiente rellena con ese color y la flecha `◀`.
- **Lee / se anuncia (una vez, al aparecer la mano):** "Sube o baja la mano
  para elegir la nota. Junta el pulgar y el índice para tocar."
- **Puede tocar:** Pausar, Más suave, Más fuerte.
- **Al cambiar de nota sin tocarla:** solo cambia el color de la franja y el
  nombre/color de la nota. **Sin movimiento** (subir y bajar la mano es la
  interacción más frecuente; animarla cansaría y distraería).
- La nota visible **no se anuncia** al lector de pantalla en cada cambio.

## Estado 6 — Tocando nota (pinza detectada)

```
│                 ┌──────────────────────────┐                 │
│                 │╔════════════════════════╗│                 │
│                 │║          Mi            ║│  ← pulso breve  │
│                 │╚════════════════════════╝│                 │
│                 └──────────────────────────┘                 │
│        ┌────────────────────────────────┐ ┌──────────┐       │
│        │          👌 (pinza: puntos     │ │ Sol      │       │
│        │              resaltados)       │ │█Mi██████◀│ ← brilla
│        │                                │ │ Re       │       │
│        └────────────────────────────────┘ └──────────┘       │
│   Sube o baja la mano para elegir la nota.                   │
│   Junta el pulgar y el índice para tocar.                    │
```

- **Ve:** en el **mismo cuadro** en que suena la nota, la tarjeta de la nota
  da un pulso breve (crece levemente y vuelve, 150–200 ms, ease-out, sin
  rebote) y la franja activa se ilumina. Los puntos de la mano se resaltan
  mientras dura la pinza.
- **Oye:** la nota.
- **Lee / se anuncia:** nada nuevo (el mensaje no cambia).
- **Puede tocar:** Pausar, Más suave, Más fuerte.
- Con `prefers-reduced-motion`: sin escala, solo el destello de color.

## Estado 7 — En pausa

```
│                 ┌──────────────────────────┐                 │
│                 │           ⏸             │                 │
│                 │        En pausa          │                 │
│                 └──────────────────────────┘                 │
│        ┌────────────────────────────────┐ ┌──────────┐       │
│        │   (cámara congelada/apagada,   │ │ (gris)   │       │
│        │    atenuada)                   │ │          │       │
│        └────────────────────────────────┘ └──────────┘       │
│              En pausa. Toca «Seguir» para continuar.         │
│   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│   │ ▶  Seguir      │ │ 🔉 Más suave   │ │ 🔊 Más fuerte  │   │
│   └────────────────┘ └────────────────┘ └────────────────┘   │
```

- **Ve:** "En pausa" en el área de la nota, la cámara atenuada, franjas en
  gris. El botón principal sigue en el mismo lugar, ahora "Seguir".
- **Lee / se anuncia:** "En pausa. Toca «Seguir» para continuar."
- **Puede tocar:** Seguir, Más suave, Más fuerte.
- No suena nada aunque haya una mano en cuadro.

## Estado 8 — Error

```
│                 ┌──────────────────────────┐                 │
│                 │           ⚠️             │                 │
│                 │    Algo salió mal        │                 │
│                 └──────────────────────────┘                 │
│        ┌────────────────────────────────┐ ┌──────────┐       │
│        │ No pudimos preparar la música. │ │ (gris)   │       │
│        │ Revisa que la cámara esté      │ │          │       │
│        │ conectada y vuelve a intentar. │ │          │       │
│        └────────────────────────────────┘ └──────────┘       │
│            Algo salió mal. Toca «Intentar de nuevo».         │
│                  ┌──────────────────────┐                    │
│                  │  ↻  Intentar de nuevo │                   │
│                  └──────────────────────┘                    │
```

- **Ve:** mensaje simple, sin el texto técnico del error (ese va a
  `console.error` para el equipo).
- **Lee / se anuncia:** "Algo salió mal. Toca «Intentar de nuevo»."
- **Puede tocar:** Intentar de nuevo (recibe el foco).
- Cubre: cámara no encontrada o en uso, fallo al cargar el modelo o el audio.

---

## Resumen por estado

| Estado | Área de la nota | Mensaje (aria-live) | Botón principal | Volumen |
| --- | --- | --- | --- | --- |
| Inicio | "Toca música con tu mano" | "El navegador te pedirá usar la cámara…" | ▶ Empezar | oculto |
| Cargando | "Preparando…" | "Preparando la cámara y la música…" | ⏳ Preparando… (deshab.) | oculto |
| Permiso denegado | "No podemos ver la cámara" | "No tenemos permiso para usar la cámara." | ↻ Intentar de nuevo | oculto |
| Sin mano (> 3 s) | ✋ guía grande | "Muestra tu mano a la cámara" | ⏸ Pausar | visible |
| Mano sin pinza | Nota + color | "Sube o baja la mano… Junta el pulgar…" | ⏸ Pausar | visible |
| Tocando nota | Nota + pulso | (sin cambio) | ⏸ Pausar | visible |
| En pausa | "En pausa" | "En pausa. Toca «Seguir»…" | ▶ Seguir | visible |
| Error | "Algo salió mal" | "Algo salió mal. Toca «Intentar de nuevo»." | ↻ Intentar de nuevo | oculto |

## Nombres de las notas

Las 10 notas de la escala pentatónica (dos octavas) se muestran por su nombre
en español. El color va por nombre (los dos "Do" comparten color). En la nota
gigante, la octava de arriba se distingue con texto: "Do agudo", "Re agudo",
etc. En las franjas basta el nombre corto, porque su posición ya dice si es
grave o aguda.

| Índice | Nota | Nota gigante | Índice | Nota | Nota gigante |
| --- | --- | --- | --- | --- | --- |
| 0 | C4 | Do | 5 | C5 | Do agudo |
| 1 | D4 | Re | 6 | D5 | Re agudo |
| 2 | E4 | Mi | 7 | E5 | Mi agudo |
| 3 | G4 | Sol | 8 | G5 | Sol agudo |
| 4 | A4 | La | 9 | A5 | La agudo |

Los colores exactos y su contraste (≥ 4.5:1) se documentan en la Actividad 51.

## Preguntas abiertas (necesito tu OK)

1. **Pausa:** propongo que "Pausar" apague la cámara y detenga el sonido
   (privacidad: la luz de la cámara se apaga), y que "Seguir" la vuelva a
   prender sin recargar el modelo (el permiso ya está dado, es casi
   inmediato). ¿O prefieres que la cámara siga encendida en pausa?
2. **Etiqueta al reanudar:** "Seguir" en vez de volver a "Empezar". ¿Te sirve?
3. **Volumen con dos fuentes:** propongo un solo nivel de volumen que mueven
   tanto los botones (de a un paso, 5 niveles) como la segunda mano; manda el
   último que actuó y el indicador "Volumen 3 de 5" siempre muestra el valor
   real. ¿De acuerdo?
4. **Color por nombre vs. por franja:** 5 colores (uno por nombre de nota) en
   vez de 10. Es más fácil de aprender ("Mi siempre es verde"). ¿Ok?
5. **Ubicación de la nota:** la dejé centrada arriba de la cámara, como
   pediste. Alternativa: a la derecha de las franjas, para que franja y nota
   queden juntas. Me quedo con arriba salvo que prefieras la otra.
