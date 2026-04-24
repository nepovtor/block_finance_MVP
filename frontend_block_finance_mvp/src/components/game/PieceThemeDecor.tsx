import type { ShapeDefinition } from "../../game/shapes";

type PieceThemeDecorProps = {
  pattern: ShapeDefinition["accentPattern"];
  compact?: boolean;
};

function renderIllustration(
  pattern: ShapeDefinition["accentPattern"],
  compact: boolean
) {
  const sizeClass = compact ? "finance-illustration-compact" : "";

  switch (pattern) {
    case "bank":
      return (
        <span className={["finance-illustration", sizeClass].join(" ")}>
          <span className="illustration-bank-roof" />
          <span className="illustration-bank-body" />
          <span className="illustration-bank-columns" />
          <span className="illustration-bank-base" />
        </span>
      );
    case "chip":
      return (
        <span className={["finance-illustration", sizeClass].join(" ")}>
          <span className="illustration-chip-frame" />
          <span className="illustration-chip-grid" />
          <span className="illustration-chip-traces" />
        </span>
      );
    case "card":
      return (
        <span className={["finance-illustration", sizeClass].join(" ")}>
          <span className="illustration-card-shell" />
          <span className="illustration-card-stripe" />
          <span className="illustration-card-chip" />
          <span className="illustration-card-orb" />
        </span>
      );
    case "vault":
      return (
        <span className={["finance-illustration", sizeClass].join(" ")}>
          <span className="illustration-vault-door" />
          <span className="illustration-vault-ring" />
          <span className="illustration-vault-wheel" />
          <span className="illustration-vault-bolts" />
        </span>
      );
    case "coin":
    case "token":
      return (
        <span className={["finance-illustration", sizeClass].join(" ")}>
          <span className="illustration-coin-disc" />
          <span className="illustration-coin-ring" />
          <span className="illustration-coin-center" />
          <span className="illustration-coin-glint" />
        </span>
      );
    case "terminal":
      return (
        <span className={["finance-illustration", sizeClass].join(" ")}>
          <span className="illustration-terminal-body" />
          <span className="illustration-terminal-screen" />
          <span className="illustration-terminal-keys" />
          <span className="illustration-terminal-wave" />
        </span>
      );
    case "money":
    case "dollar":
      return (
        <span className={["finance-illustration", sizeClass].join(" ")}>
          <span className="illustration-money-bill" />
          <span className="illustration-money-band" />
          <span className="illustration-money-seal" />
          <span className="illustration-money-corners" />
        </span>
      );
    case "moby":
      return (
        <span className={["finance-illustration", sizeClass].join(" ")}>
          <span className="illustration-moby-body" />
          <span className="illustration-moby-fin" />
          <span className="illustration-moby-tail" />
          <span className="illustration-moby-eye" />
        </span>
      );
    case "gateway":
      return (
        <span className={["finance-illustration", sizeClass].join(" ")}>
          <span className="illustration-gateway-track" />
          <span className="illustration-gateway-node illustration-gateway-node-a" />
          <span className="illustration-gateway-node illustration-gateway-node-b" />
          <span className="illustration-gateway-node illustration-gateway-node-c" />
        </span>
      );
    case "ledger":
      return (
        <span className={["finance-illustration", sizeClass].join(" ")}>
          <span className="illustration-ledger-sheet" />
          <span className="illustration-ledger-lines" />
          <span className="illustration-ledger-tab" />
        </span>
      );
    default:
      return null;
  }
}

export function PieceThemeDecor({
  pattern,
  compact = false,
}: PieceThemeDecorProps) {
  return (
    <>
      <span
        className={["finance-cell-core", `finance-core-${pattern}`].join(" ")}
      />
      <span
        className={["finance-cell-overlay", `pattern-${pattern}`].join(" ")}
      />
      {renderIllustration(pattern, compact)}
      <span
        className={[
          "finance-mark",
          compact ? "finance-mark-compact" : "",
          `mark-${pattern}`,
        ].join(" ")}
      />
    </>
  );
}
