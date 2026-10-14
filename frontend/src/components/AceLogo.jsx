import './AceLogo.css';

/* The ACE mark: a tilted ace-of-spades card. */
export function AceMark({ size = 44, className = '' }) {
  return (
    <svg
      className={`ace-mark ${className}`}
      width={size}
      height={size * 1.25}
      viewBox="0 0 68 85"
      role="img"
      aria-label="ACE Institute logo"
    >
      <g transform="rotate(-8 34 42)">
        {/* hard shadow */}
        <rect x="9" y="7" width="50" height="70" rx="9" fill="#1c1433" />
        {/* card */}
        <rect x="5" y="3" width="50" height="70" rx="9" fill="#ffd60a" stroke="#1c1433" strokeWidth="3.5" />
        {/* corner indices */}
        <text x="11" y="20" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="14" fill="#1c1433">A</text>
        <text x="49" y="56" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="14" fill="#1c1433" transform="rotate(180 49 61)">A</text>
        {/* spade */}
        <path
          d="M30 20c-8 10-15 14-15 21 0 5 4 8.5 8.5 8.5 2.6 0 4.6-1.2 5.8-3-.4 4-1.8 6.8-4.3 9.5h10c-2.5-2.7-3.9-5.5-4.3-9.5 1.2 1.8 3.2 3 5.8 3 4.5 0 8.5-3.5 8.5-8.5 0-7-7-11-15-21z"
          fill="#ff2e4c"
          stroke="#1c1433"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/* Mark + wordmark */
export default function AceLogo({ size = 40, tone = 'ink', showSub = true, className = '' }) {
  return (
    <span className={`ace-logo tone-${tone} ${className}`}>
      <AceMark size={size} />
      <span className="ace-logo-words">
        <span className="ace-logo-main">
          <b>ACE</b> INSTITUTE
        </span>
        {showSub && <span className="ace-logo-sub">Achievers' Centre of Education</span>}
      </span>
    </span>
  );
}
