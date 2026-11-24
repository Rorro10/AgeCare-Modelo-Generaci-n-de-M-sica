# Planning Sprint 7 — Integración y pruebas piloto

Actividad 63 del cronograma. Sprint que lleva del **Hito 4** (interfaz accesible, Review Sprint 6) al **Hito 5** (Avance N4: integración y pruebas piloto, Review Sprint 8).

## Objetivo del sprint

Tener el módulo **integrado de punta a punta** (captura → mapeo → síntesis → interfaz → métricas), listo para correr dentro de AgeCare, y **probarlo con adultos mayores reales** midiendo cuánto y cómo lo usan.

## Backlog del sprint

| Act. | Tarea | Entregable | Estado |
| --- | --- | --- | --- |
| 64 | Integración completa del módulo | Registro de métricas en el flujo principal (`lib/director/sessionMetrics.ts`, `useDirectorMusical.ts`), código de participante por URL, puente con AgeCare (`services/agecareBridge.ts`) | Hecho en código |
| 65 | Reunión con Alloxentric: revisión conceptual de la integración | [integracion-agecare.md](integracion-agecare.md) como pauta, con las preguntas abiertas al final | Pauta lista; falta la reunión |
| 66 | Diseño de pruebas piloto y métricas de uso | [protocolo-pruebas-piloto.md](protocolo-pruebas-piloto.md) y [metricas-de-uso.md](metricas-de-uso.md) | Hecho |
| 67 | Daily / seguimiento semanal | — | Continuo |
| 68 | Ejecución de pruebas piloto con usuarios | Panel del facilitador en `/piloto` (enlaces por participante, exportar CSV) + hoja de observación del protocolo | Herramientas listas; falta ejecutar |
| 69 | Refinamiento Sprint 7 | Ajustes según lo que salga de las primeras sesiones | Pendiente |
| 70 | Análisis de resultados de las pruebas piloto | [plantilla-analisis-resultados.md](plantilla-analisis-resultados.md) + resumen automático del panel | Plantilla lista; faltan datos |
| 71 | Reunión quincenal con el profesor guía | — | Pendiente |
| 72 | Review + Demo y Retrospectiva Sprint 7 | Demo: sesión en vivo + panel `/piloto` con los datos del piloto | Pendiente |

## Definición de terminado (DoD)

- `npm test`, `npm run lint` y `npm run build` pasan.
- Ninguna métrica guarda imagen, video, posición de la mano ni datos personales (solo un código de participante).
- Si guardar métricas falla (modo privado, almacenamiento lleno), la música sigue funcionando igual.
- La vista del adulto mayor no cambia: el registro es invisible para él.

## Riesgos y mitigación

| Riesgo | Mitigación |
| --- | --- |
| Pocos participantes disponibles en las fechas del piloto | Coordinar con Alloxentric el centro o grupo con anticipación; el protocolo funciona desde 5 personas. |
| Las métricas quedan en el dispositivo y se pierden | Exportar el CSV al cierre de cada jornada (paso obligatorio del protocolo); tope de 300 sesiones guardadas. |
| Mala luz o cámara de baja calidad en el lugar | Revisar el lugar antes (lista de preparación del protocolo); llevar un celular de respaldo probado. |
| AgeCare define otro mecanismo de integración en la reunión | El puente está aislado en un archivo (`agecareBridge.ts`): cambiarlo no toca el resto del módulo. |
