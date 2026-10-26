// Servicio de cámara: encender y apagar el stream de video.

export async function startCameraStream(video: HTMLVideoElement) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
}

export function stopCameraStream(video: HTMLVideoElement | null) {
  const stream = video?.srcObject as MediaStream | null | undefined;
  stream?.getTracks().forEach((t) => t.stop());
}
