interface ScissorLogoProps {
  className?: string;
}

export function ScissorLogo({ className = 'h-8 w-8' }: ScissorLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-[9px] bg-gradient-to-b from-white to-[#F2F2F5] ring-1 ring-black/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_3px_rgba(0,0,0,0.06)] shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Delicate glossy top reflection */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-white/95 to-transparent" />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="relative h-[18px] w-[18px] text-[#1D1D1F]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="6"
          cy="6"
          r="2.8"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="6"
          cy="18"
          r="2.8"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 4L8.12 15.88"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.47 14.48L20 20"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.12 8.12L12 12"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
