// Íconos en SVG en línea (sin dependencias). Miden 1em: crecen con el texto
// que acompañan y con el zoom del navegador. Siempre van junto a un texto
// visible, por eso son aria-hidden.

import type { IconName } from "@/lib/director/viewModel";

export type AnyIconName = IconName | "volume-down" | "volume-up";

const PATHS: Record<AnyIconName, React.ReactNode> = {
  play: <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  retry: (
    <>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v5h-5" />
    </>
  ),
  loading: <path d="M21 12a9 9 0 1 1-6.22-8.56" />,
  music: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  hand: (
    <>
      <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M11 11.5V4a1.5 1.5 0 0 1 3 0v7.5" />
      <path d="M14 11.5V5.5a1.5 1.5 0 0 1 3 0V13" />
      <path d="M17 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.3 15a1.6 1.6 0 0 1 2.5-2L8 15" />
    </>
  ),
  "camera-off": (
    <>
      <path d="M3 3l18 18" />
      <path d="M9.5 5H15l2 2.5h2A2 2 0 0 1 21 9.5v8" />
      <path d="M17.5 19.5H5A2 2 0 0 1 3 17.5v-8A2 2 0 0 1 5 7.5h1" />
      <path d="M10 10.5a3 3 0 0 0 4 4" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.5 2.5 20h19z" />
      <path d="M12 10v4" />
      <path d="M12 17v.5" />
    </>
  ),
  "volume-down": (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
    </>
  ),
  "volume-up": (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18.5 6a8 8 0 0 1 0 12" />
    </>
  ),
};

export function Icon({ name, className = "" }: { name: AnyIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
