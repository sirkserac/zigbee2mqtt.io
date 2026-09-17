import type { SymbolType } from '@/types/project';

interface AreiSymbolProps {
  type: SymbolType;
  size?: number;
  className?: string;
  strokeColor?: string;
}

/**
 * Vereenvoudigde, genormaliseerde AREI-symbolen (40x40 viewBox) voor gebruik
 * op het situatieschema en in de symbolenbibliotheek. De vormgeving volgt
 * de klassieke Belgische elektrische schematekens (cirkel + attribuutlijnen)
 * en is bewust minimalistisch zodat symbolen leesbaar blijven op A4/A3-print.
 */
export function AreiSymbol({ type, size = 32, className, strokeColor = 'currentColor' }: AreiSymbolProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 40 40',
    className,
    fill: 'none',
    stroke: strokeColor,
    strokeWidth: 1.6,
  };

  switch (type) {
    case 'stopcontact':
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="14" />
          <line x1="14" y1="20" x2="26" y2="20" />
        </svg>
      );
    case 'stopcontact_geaard':
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="14" />
          <line x1="14" y1="20" x2="26" y2="20" />
          <line x1="20" y1="14" x2="20" y2="26" />
        </svg>
      );
    case 'lichtpunt':
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="14" />
          <line x1="10" y1="10" x2="30" y2="30" />
          <line x1="30" y1="10" x2="10" y2="30" />
        </svg>
      );
    case 'rookmelder':
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="14" />
          <text x="20" y="24" textAnchor="middle" fontSize="12" stroke="none" fill={strokeColor}>
            RM
          </text>
        </svg>
      );
    case 'data_aansluiting':
      return (
        <svg {...common}>
          <rect x="8" y="14" width="24" height="12" rx="2" />
          <text x="20" y="23" textAnchor="middle" fontSize="8" stroke="none" fill={strokeColor}>
            DATA
          </text>
        </svg>
      );
    case 'tv_aansluiting':
      return (
        <svg {...common}>
          <rect x="8" y="14" width="24" height="12" rx="2" />
          <text x="20" y="23" textAnchor="middle" fontSize="9" stroke="none" fill={strokeColor}>
            TV
          </text>
        </svg>
      );
    case 'schakelaar_enkelpolig':
      return (
        <svg {...common}>
          <line x1="8" y1="30" x2="18" y2="30" />
          <line x1="18" y1="30" x2="30" y2="14" />
          <circle cx="8" cy="30" r="1.6" fill={strokeColor} />
          <circle cx="30" cy="14" r="1.6" fill={strokeColor} />
        </svg>
      );
    case 'schakelaar_wissel':
      return (
        <svg {...common}>
          <line x1="6" y1="30" x2="16" y2="30" />
          <line x1="16" y1="30" x2="30" y2="16" />
          <line x1="16" y1="30" x2="30" y2="30" strokeDasharray="2 2" />
          <circle cx="6" cy="30" r="1.6" fill={strokeColor} />
        </svg>
      );
    case 'schakelaar_kruis':
      return (
        <svg {...common}>
          <line x1="6" y1="30" x2="14" y2="30" />
          <line x1="14" y1="30" x2="28" y2="14" />
          <line x1="14" y1="24" x2="28" y2="30" strokeDasharray="2 2" />
          <line x1="14" y1="30" x2="28" y2="24" strokeDasharray="2 2" />
        </svg>
      );
    case 'drukknop':
      return (
        <svg {...common}>
          <circle cx="20" cy="20" r="10" />
          <line x1="12" y1="28" x2="28" y2="12" />
        </svg>
      );
    case 'verdeelbord':
      return (
        <svg {...common}>
          <rect x="6" y="8" width="28" height="24" rx="1" />
          <line x1="6" y1="16" x2="34" y2="16" />
          <line x1="12" y1="16" x2="12" y2="32" />
          <line x1="20" y1="16" x2="20" y2="32" />
          <line x1="28" y1="16" x2="28" y2="32" />
        </svg>
      );
    case 'automaat':
      return (
        <svg {...common}>
          <rect x="12" y="6" width="16" height="28" rx="1.5" />
          <line x1="20" y1="12" x2="20" y2="22" />
          <circle cx="20" cy="26" r="2" />
        </svg>
      );
    case 'differentieel':
      return (
        <svg {...common}>
          <rect x="8" y="6" width="24" height="28" rx="1.5" />
          <circle cx="20" cy="16" r="5" />
          <text x="20" y="30" textAnchor="middle" fontSize="8" stroke="none" fill={strokeColor}>
            Δ
          </text>
        </svg>
      );
    case 'aardingsklem':
      return (
        <svg {...common}>
          <line x1="20" y1="6" x2="20" y2="20" />
          <line x1="10" y1="20" x2="30" y2="20" />
          <line x1="13" y1="25" x2="27" y2="25" />
          <line x1="16" y1="30" x2="24" y2="30" />
        </svg>
      );
    case 'pv_omvormer':
      return (
        <svg {...common}>
          <rect x="6" y="10" width="28" height="20" rx="2" />
          <path d="M12 24 L18 14 L22 20 L28 12" />
        </svg>
      );
    case 'thuisbatterij':
      return (
        <svg {...common}>
          <rect x="10" y="8" width="20" height="26" rx="2" />
          <rect x="16" y="4" width="8" height="4" />
          <line x1="16" y1="18" x2="24" y2="18" />
          <line x1="20" y1="14" x2="20" y2="22" />
        </svg>
      );
    case 'ev_laadpaal':
      return (
        <svg {...common}>
          <rect x="14" y="6" width="12" height="28" rx="2" />
          <circle cx="20" cy="13" r="2" />
          <path d="M16 20 L22 20 L18 28 L24 28" />
        </svg>
      );
    case 'warmtepomp':
      return (
        <svg {...common}>
          <rect x="6" y="12" width="28" height="18" rx="2" />
          <path d="M12 30 v4 M28 30 v4" />
          <path d="M12 21 h20 M20 15 v12 M15 17 l10 8 M25 17 l-10 8" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="8" y="8" width="24" height="24" rx="2" strokeDasharray="3 3" />
        </svg>
      );
  }
}
