import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

function BaseIcon({
  children,
  title,
  viewBox = "0 0 24 24",
  className,
  ...props
}: IconProps) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : "presentation"}
      className={className}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function DollarIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v18" />
      <path d="M15.8 7.2c-.8-1-2.1-1.6-3.8-1.6-2.5 0-4.1 1.2-4.1 3 0 4.6 8.2 1.7 8.2 6 0 1.8-1.8 3.1-4.3 3.1-1.9 0-3.5-.6-4.6-1.8" />
    </BaseIcon>
  );
}

export function EuroIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M16.5 6.5A6.2 6.2 0 0 0 7.7 9.5" />
      <path d="M6 10.2h8.3" />
      <path d="M6 13.8h8.3" />
      <path d="M16.5 17.5a6.2 6.2 0 0 1-8.8-3" />
    </BaseIcon>
  );
}

export function CoinIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3.2" />
    </BaseIcon>
  );
}

export function BankIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 9.2 12 5l8 4.2" />
      <path d="M5.5 9.5h13" />
      <path d="M7.5 10.5v6.5" />
      <path d="M12 10.5v6.5" />
      <path d="M16.5 10.5v6.5" />
      <path d="M4.8 18h14.4" />
    </BaseIcon>
  );
}

export function CardIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="6.5" width="16" height="11" rx="2.6" />
      <path d="M4.8 10h14.4" />
      <path d="M8 14.2h3.5" />
    </BaseIcon>
  );
}

export function CashbackIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8.2 8.2A5.8 5.8 0 1 1 6.5 12" />
      <path d="M5 8.5h3.8v3.8" />
      <path d="M12 8.6v6.8" />
      <path d="M14.6 10.3c-.5-.7-1.4-1.1-2.6-1.1-1.7 0-2.8.8-2.8 2 0 3 5.6 1.2 5.6 4 0 1.2-1.2 2.1-3 2.1-1.3 0-2.4-.4-3.1-1.2" />
    </BaseIcon>
  );
}

export function RewardIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4.8 13.9 8l3.6.5-2.4 2.4.6 3.5-3.7-1.6-3.7 1.6.6-3.5L6.5 8.5 10.1 8 12 4.8Z" />
      <path d="M9.4 15.6V19h5.2v-3.4" />
    </BaseIcon>
  );
}

export function SavingsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6.2 10.2c0-3 2.5-5.2 5.8-5.2 3.1 0 5.8 2 5.8 5.6 0 4.3-3.2 6-3.2 6H9.7s-3.5-2.1-3.5-6.4Z" />
      <path d="M10.2 9.8h3.6" />
      <path d="M12 8v3.6" />
      <path d="M9.4 18.4h5.2" />
    </BaseIcon>
  );
}

export function ChallengeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 6.2h8" />
      <path d="M9 4.8v2.4" />
      <path d="M15 4.8v2.4" />
      <rect x="6.2" y="6.8" width="11.6" height="11" rx="2.2" />
      <path d="m9.2 13 1.8 1.8 3.8-4.1" />
    </BaseIcon>
  );
}

export function ReferralIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="8" cy="9" r="2.2" />
      <circle cx="16" cy="8" r="2.2" />
      <path d="M5.5 17.5c.5-2.1 2.1-3.4 4.4-3.4 1.2 0 2.2.3 3 .8" />
      <path d="M13.8 12.2h4.2v4.2" />
      <path d="M12.8 16.2 18 11" />
    </BaseIcon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.8 10.4 12 5l7.2 5.4" />
      <path d="M6.2 9.8V19h11.6V9.8" />
      <path d="M10 19v-5.1h4V19" />
    </BaseIcon>
  );
}

export function MtbMIcon(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 24 24" {...props}>
      <path d="M4.5 18V6h2.8l4.7 6.1L16.7 6h2.8v12" />
      <path d="M4.5 18h3.2V11.4" />
      <path d="M19.5 18h-3.2v-6.6" />
      <path d="M10 18v-4.1l2-2.6 2 2.6V18" />
    </BaseIcon>
  );
}

export const financeIcons = {
  dollar: DollarIcon,
  euro: EuroIcon,
  coin: CoinIcon,
  bank: BankIcon,
  card: CardIcon,
  cashback: CashbackIcon,
  reward: RewardIcon,
  savings: SavingsIcon,
  challenge: ChallengeIcon,
  referral: ReferralIcon,
  home: HomeIcon,
  mtbM: MtbMIcon,
} as const;
