// Servicio de cámara: encender y apagar el stream de video.

export async function startCameraStream(video: HTMLVideoElement) {
  // En un celular vertical se pide el video también vertical (3:4): un video
  // horizontal quedaría limitado por el ancho de la pantalla y se vería
  // chico, aunque sobre alto. "ideal" deja que el navegador use lo más
  // cercano que tenga. facingMode "user": la cámara frontal, la que mira a
  // la persona.
  const portrait = window.innerHeight > window.innerWidth;
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: portrait ? 480 : 640 },
      height: { ideal: portrait ? 640 : 480 },
      aspectRatio: { ideal: portrait ? 3 / 4 : 4 / 3 },
    },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
}

export function stopCameraStream(video: HTMLVideoElement | null) {
  const stream = video?.srcObject as MediaStream | null | undefined;
  stream?.getTracks().forEach((t) => t.stop());
  if (video) video.srcObject = null;
}

// getUserMedia rechaza con NotAllowedError cuando la persona (o la política
// del navegador) niega la cámara, y con SecurityError fuera de HTTPS.
export function isCameraPermissionError(err: unknown) {
  return (
    err instanceof DOMException &&
    (err.name === "NotAllowedError" || err.name === "SecurityError")
  );
}
