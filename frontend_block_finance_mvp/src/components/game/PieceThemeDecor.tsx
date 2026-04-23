import type { ShapeDefinition } from "../../game/shapes";

type PieceThemeDecorProps = {
  pattern: ShapeDefinition["accentPattern"];
  compact?: boolean;
};

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
