// Ruta solo de desarrollo (break-ui): dibuja la vista del adulto mayor en
// cada estado y en sus peores casos, sin cámara. En producción responde 404.
// Uso: /dev/estados?estado=do-agudo

import { notFound } from "next/navigation";
import { StatePreview } from "./StatePreview";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { estado } = await searchParams;
  return <StatePreview estado={typeof estado === "string" ? estado : "nota"} />;
}
