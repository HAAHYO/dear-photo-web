type PostmarkStampProps = {
  className?: string;
};

// 우체국 소인(postmark) 스탬프: 가운데 편지봉투+하트 아이콘, 위/아래로 도는 곡선 텍스트
export function PostmarkStamp({ className = "" }: PostmarkStampProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        {/* 위쪽 절반: 왼→오 (정방향으로 읽힘) */}
        <path id="postmark-top" d="M 14 50 A 36 36 0 0 1 86 50" fill="none" />
        {/* 아래쪽 절반: 오→왼으로 그려야 뒤집히지 않고 읽힘 */}
        <path id="postmark-bottom" d="M 86 50 A 36 36 0 0 1 14 50" fill="none" />
      </defs>

      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-coral-dark)" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-coral-dark)" strokeWidth="1.4" />

      <text fontSize="9" fontWeight="800" fill="var(--color-coral-dark)" letterSpacing="2.5">
        <textPath href="#postmark-top" startOffset="50%" textAnchor="middle">
          DEAR,
        </textPath>
      </text>
      <text fontSize="9" fontWeight="800" fill="var(--color-coral-dark)" letterSpacing="2.5">
        <textPath href="#postmark-bottom" startOffset="50%" textAnchor="middle">
          PHOTO
        </textPath>
      </text>

      {/* 가운데: 편지봉투 + 하트 아이콘 */}
      <g stroke="var(--color-coral-dark)" strokeWidth="2" strokeLinejoin="round" fill="none">
        <rect x="32" y="52" width="36" height="24" rx="1.5" />
        <path d="M32 53 L50 66 L68 53" strokeLinecap="round" />
        <path
          d="M50 48 c-3.6 -5.4 -12 -3.4 -12 3.2 c0 5.6 7.2 9.6 12 13.8 c4.8 -4.2 12 -8.2 12 -13.8 c0 -6.6 -8.4 -8.6 -12 -3.2 z"
          fill="var(--color-coral-dark)"
          stroke="none"
        />
      </g>

      <line x1="21" y1="36" x2="79" y2="36" stroke="var(--color-coral-dark)" strokeWidth="1.2" />
      <line x1="21" y1="64" x2="79" y2="64" stroke="var(--color-coral-dark)" strokeWidth="1.2" />
    </svg>
  );
}
