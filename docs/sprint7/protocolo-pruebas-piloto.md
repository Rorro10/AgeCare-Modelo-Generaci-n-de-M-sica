# Protocolo de pruebas piloto de usabilidad

Actividades 66 (diseño) y 68 (ejecución). Guía para que cualquier integrante del equipo conduzca una sesión igual que los demás, de modo que los resultados sean comparables.

## 1. Objetivo

Comprobar si adultos mayores pueden **usar el Director Musical sin ayuda** y **cuánto tiempo se mantienen usándolo**, e identificar los problemas de uso que se deben corregir en el Sprint 8.

Preguntas que responde el piloto:

1. ¿Logran empezar y tocar su primera nota sin ayuda? ¿Cuánto tardan?
2. ¿Entienden los dos gestos (altura = nota, pinza = tocar)?
3. ¿Cuánto dura una sesión de juego libre?
4. ¿Qué partes de la interfaz generan dudas o errores?
5. ¿Les resulta agradable? ¿Lo volverían a usar?

## 2. Participantes

- **Cantidad**: 5 a 8 personas (con 5 ya aparecen la mayoría de los problemas de usabilidad graves).
- **Inclusión**: 60 años o más; puede ver una pantalla de celular o tablet a 50 cm (con sus lentes habituales); puede mover al menos una mano.
- **Exclusión**: deterioro cognitivo que impida dar consentimiento; problemas de salud que hagan incómodo levantar la mano varios minutos.
- **Reclutamiento**: coordinado con Alloxentric (usuarios o centros vinculados a AgeCare).
- A cada persona se le asigna un código **P01, P02…** La relación código ↔ nombre queda solo en la hoja de consentimiento en papel, nunca en el dispositivo ni en el CSV.

## 3. Consentimiento

Antes de empezar, leer en voz alta y pedir firma:

> Estamos probando un juego para hacer música moviendo la mano frente a la cámara. Lo que evaluamos es el juego, no a usted: si algo no se entiende, es un problema del juego. La cámara se usa solo para ver su mano en el momento; no se graba ni se guarda ninguna imagen. Anotaremos cuánto tiempo juega y cuántas notas toca, con un código y sin su nombre. Puede detenerse cuando quiera, sin dar explicaciones.

## 4. Preparación (antes de cada jornada)

- [ ] Dispositivo cargado (celular o tablet; idealmente el mismo para todos) y con volumen alto.
- [ ] Soporte o atril para dejarlo fijo, a la altura del pecho, a ~50 cm.
- [ ] Lugar con luz de frente (no ventana detrás de la persona) y sin ruido fuerte.
- [ ] Abrir la app una vez, aceptar el permiso de cámara y probar que suena (así la persona no ve el aviso de permiso del navegador si no corresponde al objetivo).
- [ ] En el panel `/piloto`, generar el enlace de cada participante (`/?participante=P01`).
- [ ] Hoja de observación impresa (sección 7) y cronómetro.

> Para medir también la entrada (permiso de cámara), en **una** de las sesiones se puede partir desde un navegador sin permiso. Anotarlo en la hoja.

## 5. Desarrollo de la sesión (~20 min)

1. **Bienvenida y consentimiento** (3 min).
2. **Abrir el enlace del participante** en el dispositivo. No explicar todavía cómo se usa.
3. **Tareas guiadas** (8 min). Leer cada consigna tal cual; esperar hasta 60 s antes de dar una pista. Anotar éxito, tiempo y ayuda en la hoja.

   | Tarea | Consigna (decir tal cual) | Éxito si… |
   | --- | --- | --- |
   | T1 | «Empiece el juego.» | Toca «Empezar» y la cámara se enciende. |
   | T2 | «Toque una nota.» | Suena al menos una nota (pinza). |
   | T3 | «Toque una nota más aguda y luego una más grave.» | Cambia de nota subiendo y bajando la mano. |
   | T4 | «Suba el volumen.» | Usa «Más fuerte» o separa las dos manos. |
   | T5 | «Haga una pausa y luego siga tocando.» | Usa «Pausar» y luego «Seguir». |
   | T6 | «Cambie el sonido a otro instrumento.» | En pausa, elige otro instrumento. |

   Pistas permitidas, en este orden: (1) repetir la consigna; (2) señalar la zona de la pantalla; (3) mostrar el gesto. Anotar cuál se usó.
4. **Juego libre** (hasta 10 min): «Ahora puede tocar lo que quiera, el tiempo que quiera. Avíseme cuando quiera terminar.» No intervenir. Anotar comentarios espontáneos.
5. **Cuestionario breve** (3 min, sección 6).
6. **Cierre**: agradecer. Cerrar la pestaña (así la sesión queda como terminada).

**Al terminar la jornada:** entrar a `/piloto` → **Descargar CSV** → subirlo a la carpeta compartida del equipo con la fecha en el nombre. Solo después de verificar que el archivo abre, se puede usar «Borrar sesiones».

## 6. Cuestionario posterior

Leer cada frase y mostrar una escala de 5 caritas (1 = muy en desacuerdo … 5 = muy de acuerdo). Adaptado y reducido de SUS para no cansar.

1. Fue fácil aprender a tocar.
2. Supe en todo momento qué tenía que hacer.
3. Los textos y botones se veían bien.
4. Me sentí cómodo/a moviendo la mano frente a la cámara.
5. Me gustó la música que hice.
6. Me gustaría volver a usarlo.

Preguntas abiertas: «¿Qué fue lo más difícil?», «¿Qué le cambiaría?»

## 7. Hoja de observación (una por participante)

```
Código: ____   Fecha: ________   Facilitador: ________   Dispositivo: ________
Luz del lugar: buena / regular / mala      ¿Usa lentes?: sí / no

Tarea | Éxito (sí/no/parcial) | Tiempo (s) | Pista usada (0/1/2/3) | Observaciones
T1    |                       |            |                       |
T2    |                       |            |                       |
T3    |                       |            |                       |
T4    |                       |            |                       |
T5    |                       |            |                       |
T6    |                       |            |                       |

Juego libre — duración (min): ____   ¿Terminó por?: aburrimiento / cansancio / tiempo / otro: ____
Comentarios espontáneos:

Cuestionario (1-5):  Q1 __  Q2 __  Q3 __  Q4 __  Q5 __  Q6 __
Lo más difícil:
Qué cambiaría:
```

## 8. Criterios de éxito (propuestos)

Metas iniciales para conversar con Alloxentric y el profesor guía antes del piloto. Se fijan **antes** de ver los datos para no ajustarlas a los resultados.

| Indicador | Fuente | Meta propuesta |
| --- | --- | --- |
| Participantes que completan T1 y T2 sin pista | Hoja de observación | ≥ 80 % |
| Mediana de tiempo hasta la primera nota | Panel `/piloto` | ≤ 60 s |
| Mediana de duración del juego libre (tiempo activo) | Panel `/piloto` | ≥ 5 min |
| Mediana de proporción con la mano a la vista | Panel `/piloto` | ≥ 60 % |
| Sesiones sin cámara o con error | Panel `/piloto` | 0 errores bloqueantes |
| Promedio de Q1 y Q6 | Cuestionario | ≥ 4 de 5 |
