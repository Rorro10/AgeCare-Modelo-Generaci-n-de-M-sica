# Sprint 5 · Contraste de colores de la vista del adulto mayor

Razón de contraste según WCAG 2.x (luminancia relativa). Mínimo exigido en
este proyecto: **4.5:1 para todo texto**, incluso el grande (WCAG AA pide
3:1 para texto grande; aquí se exige más por baja visión).

El contraste de los colores de nota contra el texto blanco se verifica
automáticamente en `tests/noteDisplay.test.ts`, con la misma fórmula
(`contrastRatio` en `lib/director/noteDisplay.ts`).

## Colores por nota

Se usan como fondo de la nota gigante y de la franja activa, con texto
blanco (`#FFFFFF`) encima. Las dos octavas de una nota comparten color.

| Nota | Color | Hex | Texto blanco encima | Contra el fondo claro `#FAF7F2` |
| --- | --- | --- | --- | --- |
| Do | rojo | `#B91C1C` | **6.47:1** | 6.05:1 |
| Re | naranjo tostado | `#A14E05` | **5.82:1** | 5.45:1 |
| Mi | verde | `#15803D` | **5.02:1** | 4.69:1 |
| Sol | azul | `#1D4ED8` | **6.70:1** | 6.27:1 |
| La | morado | `#7E22CE` | **6.98:1** | 6.53:1 |

En modo oscuro el texto sobre estos colores sigue siendo blanco, así que su
contraste no cambia. El borde del bloque de color contra el fondo oscuro
`#0C0A09` queda entre 2.83:1 y 3.94:1. No afecta la lectura de la nota: lo
que se lee es el texto blanco sobre el color.

El color nunca es la única señal: la nota siempre lleva su nombre escrito y
la franja activa además lleva la flecha `◀`.

## Resto de la interfaz

| Elemento | Texto | Fondo | Claro | Oscuro |
| --- | --- | --- | --- | --- |
| Texto general | `#1C1917` / `#FAFAF9` | `#FAF7F2` / `#0C0A09` | 16.37:1 | 18.92:1 |
| Tarjeta de aviso, botón secundario | `#1C1917` / `#FAFAF9` | `#FFFFFF` / `#1C1917` | 17.49:1 | 16.74:1 |
| Franja inactiva | `#292524` / `#F5F5F4` | `#E7E5E4` / `#292524` | 12.08:1 | 13.90:1 |
| Botón principal | `#FAF7F2` / `#0C0A09` | `#1C1917` / `#FAFAF9` | 16.37:1 | 18.92:1 |
| Aviso sobre la cámara | `#FFFFFF` | `#1C1917` (stone-900) | 17.49:1 | 17.49:1 |
| Anillo de foco (no es texto, mín. 3:1) | `#0369A1` / `#7DD3FC` | `#FAF7F2` / `#0C0A09` | 5.55:1 | 11.85:1 |

Los botones que no están disponibles en ese momento (volumen en el tope,
"Preparando…") se muestran al 60 % de opacidad. WCAG exime a los controles
inactivos, pero el texto sigue siendo legible y el botón conserva el foco.
