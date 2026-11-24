# Métricas de uso

Actividad 66. Qué mide el Director Musical en cada sesión, cómo se calcula y para qué sirve en el análisis del piloto. Implementación: `lib/director/sessionMetrics.ts` (registro) y `lib/director/pilotReport.ts` (agregados y CSV).

## Qué es una sesión

Empieza cuando la persona toca **«Empezar»** por primera vez y termina cuando cierra o abandona la página. Las pausas («Pausar» → «Seguir») quedan dentro de la misma sesión. Si se recarga la página, empieza una sesión nueva.

La sesión se guarda al empezar, al pausar, cada 15 s mientras se toca, al pasar a otra app y al salir. Si se corta sin aviso (batería, cierre forzado), queda con su último estado y con `terminada = no`.

## Métricas por sesión

| Columna CSV | Qué es | Para qué sirve |
| --- | --- | --- |
| `participante` | Código puesto en la dirección (`?participante=P01`). Vacío si se abrió sin código. | Agrupar por persona sin guardar su nombre. |
| `duracion_total_s` | Desde el primer «Empezar» hasta el último evento. | Duración de la sesión tal como la vive la persona. |
| `tiempo_activo_s` | Tiempo con la cámara funcionando, **sin** carga ni pausas. | **Métrica principal de duración de sesión.** |
| `tiempo_con_mano_s`, `proporcion_con_mano` | Parte del tiempo activo en que la cámara vio al menos una mano. | Si es baja, la persona no entiende dónde poner la mano o se cansa. |
| `s_hasta_primera_nota` | Desde que la cámara funciona hasta la primera nota tocada. | Facilidad de aprendizaje: cuánto tarda en «entender» el gesto. |
| `notas_tocadas`, `notas_distintas`, `notas_por_minuto` | Pinzas que dispararon una nota. | Nivel de actividad y exploración del rango de notas. |
| `pausas` | Veces que tocó «Pausar». | Cansancio o necesidad de descanso. |
| `instrumento_final`, `instrumentos_usados` | Instrumentos elegidos durante la sesión. | Preferencias; si se usa el selector. |
| `cambios_volumen_boton`, `cambios_volumen_mano` | Cambios de volumen por cada vía. | Si el gesto de dos manos se usa o solo los botones. |
| `camara_denegada`, `errores` | No dio permiso de cámara / falló la preparación. | Barreras técnicas de entrada. |

## Agregados del panel `/piloto`

Las medianas usan solo sesiones con **al menos 30 s de tiempo activo** (las más cortas suelen ser pruebas del facilitador o toques accidentales). Se usa mediana y no promedio porque con pocos participantes un caso extremo distorsiona el promedio.

- **Duración mediana** (min) y **minutos activos totales**.
- **Notas por minuto** (mediana).
- **Con la mano a la vista** (mediana de la proporción).
- **Hasta la primera nota** (mediana, solo sesiones que tocaron).
- **Sesiones que tocaron**: proporción de sesiones analizadas con al menos una nota.
- **Sin cámara o con error**: proporción de todas las sesiones.

## Privacidad

- No se guarda ni se envía imagen, video, audio ni la posición de la mano: solo conteos y tiempos.
- El código de participante solo acepta letras, números, `-` y `_` (máx. 40): no permite escribir nombres con espacios ni RUT con puntos.
- Los datos quedan en el navegador del dispositivo usado. Solo salen si el facilitador descarga el CSV, o hacia AgeCare si el módulo está embebido y configurado (ver [integracion-agecare.md](integracion-agecare.md)).
