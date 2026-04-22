import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  finishGameSession,
  getProfile,
  startGameSession,
  useReward,
} from "../services/api";
import {
  Board,
  Piece,
  canPlaceShape,
  createBoard,
  createPieceBatch,
  getPlacementCells,
  getShapeBounds,
  hasAnyValidMove,
  placeShape,
} from "../game/engine";
import { useAppStore } from "../store/appStore";

type HoveredCell = {
  row: number;
  col: number;
} | null;

const PIECE_TONE_BY_CLASS: Record<
  string,
  {
    fill: string;
    edge: string;
    glow: string;
    label: string;
    badge: string;
  }
> = {
  "bg-emerald-400": {
    fill: "#34d399",
    edge: "#a7f3d0",
    glow: "rgba(52, 211, 153, 0.35)",
    label: "#032b22",
    badge: "#d1fae5",
  },
  "bg-cyan-400": {
    fill: "#22d3ee",
    edge: "#a5f3fc",
    glow: "rgba(34, 211, 238, 0.35)",
    label: "#083344",
    badge: "#cffafe",
  },
  "bg-sky-400": {
    fill: "#38bdf8",
    edge: "#bae6fd",
    glow: "rgba(56, 189, 248, 0.34)",
    label: "#082f49",
    badge: "#e0f2fe",
  },
  "bg-indigo-400": {
    fill: "#818cf8",
    edge: "#c7d2fe",
    glow: "rgba(129, 140, 248, 0.34)",
    label: "#1e1b4b",
    badge: "#e0e7ff",
  },
  "bg-violet-400": {
    fill: "#a78bfa",
    edge: "#ddd6fe",
    glow: "rgba(167, 139, 250, 0.34)",
    label: "#2e1065",
    badge: "#ede9fe",
  },
  "bg-amber-400": {
    fill: "#fbbf24",
    edge: "#fde68a",
    glow: "rgba(251, 191, 36, 0.34)",
    label: "#451a03",
    badge: "#fef3c7",
  },
  "bg-orange-400": {
    fill: "#fb923c",
    edge: "#fdba74",
    glow: "rgba(251, 146, 60, 0.34)",
    label: "#431407",
    badge: "#ffedd5",
  },
  "bg-rose-400": {
    fill: "#fb7185",
    edge: "#fecdd3",
    glow: "rgba(251, 113, 133, 0.34)",
    label: "#4c0519",
    badge: "#ffe4e6",
  },
  "bg-pink-400": {
    fill: "#f472b6",
    edge: "#fbcfe8",
    glow: "rgba(244, 114, 182, 0.34)",
    label: "#500724",
    badge: "#fce7f3",
  },
  "bg-fuchsia-400": {
    fill: "#e879f9",
    edge: "#f5d0fe",
    glow: "rgba(232, 121, 249, 0.34)",
    label: "#4a044e",
    badge: "#fae8ff",
  },
  "bg-lime-400": {
    fill: "#a3e635",
    edge: "#d9f99d",
    glow: "rgba(163, 230, 53, 0.34)",
    label: "#1a2e05",
    badge: "#ecfccb",
  },
  "bg-teal-400": {
    fill: "#2dd4bf",
    edge: "#99f6e4",
    glow: "rgba(45, 212, 191, 0.34)",
    label: "#042f2e",
    badge: "#ccfbf1",
  },
};

function getPieceTone(color: string) {
  return (
    PIECE_TONE_BY_CLASS[color] ?? {
      fill: "#34d399",
      edge: "#a7f3d0",
      glow: "rgba(52, 211, 153, 0.35)",
      label: "#032b22",
      badge: "#d1fae5",
    }
  );
}

function getPatternClass(pattern: Piece["shape"]["accentPattern"]) {
  return `pattern-${pattern}`;
}

function renderFinanceCell(
  color: string,
  accentLabel: string,
  accentPattern: Piece["shape"]["accentPattern"],
  sizeClass: string
) {
  const tone = getPieceTone(color);

  return (
    <>
      <span
        className="finance-cell-core"
        style={{
          background: `linear-gradient(180deg, ${tone.edge} 0%, ${tone.fill} 32%, ${tone.fill} 72%, rgba(15, 23, 42, 0.24) 100%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -8px 14px rgba(15,23,42,0.14), 0 0 20px ${tone.glow}`,
        }}
        aria-hidden="true"
      />
      <span
        className={`finance-cell-overlay ${getPatternClass(accentPattern)}`}
        aria-hidden="true"
      />
      <span
        className={`finance-mark ${sizeClass} aspect-square w-[28%] min-w-[0.5rem]`}
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.62), ${tone.badge})`,
          borderColor: "rgba(255,255,255,0.48)",
          boxShadow: "0 6px 12px rgba(15, 23, 42, 0.12)",
        }}
        aria-hidden="true"
      />
      <span className="finance-label" style={{ color: tone.label }} aria-hidden="true">
        {accentLabel}
      </span>
    </>
  );
}

function getPreviewState(
  board: Board,
  piece: Piece | null,
  hoveredCell: HoveredCell
) {
  if (!piece || !hoveredCell) {
    return {
      cells: [] as { row: number; col: number }[],
      valid: false,
    };
  }

  return {
    cells: getPlacementCells(piece.shape, hoveredCell.row, hoveredCell.col),
    valid: canPlaceShape(board, piece.shape, hoveredCell.row, hoveredCell.col),
  };
}

function buildFreshGameState() {
  const pieces = createPieceBatch();
  return {
    board: createBoard(),
    pieces,
    selectedPieceId: pieces[0]?.instanceId ?? null,
  };
}

function getSelectionStatus(piece: Piece | null, board: Board) {
  if (!piece) {
    return "Tap a piece below, then tap a glowing board cell to place it.";
  }

  if (!hasAnyValidMove(board, [piece])) {
    return `${piece.shape.name} is blocked right now. Choose another piece or save your reward for a dead end.`;
  }

  return `${piece.shape.name} selected. Tap any glowing board cell to place it.`;
}

export default function GamePage() {
  const { reward, addXP, gameSessionId, setGameSessionId, setReward, setUser } =
    useAppStore();

  const [board, setBoard] = useState<Board>(() => createBoard());
  const [pieces, setPieces] = useState<Piece[]>(() => createPieceBatch());
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HoveredCell>(null);
  const [score, setScore] = useState(0);
  const [movesUsed, setMovesUsed] = useState(0);
  const [extraMovesUsed, setExtraMovesUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [statusText, setStatusText] = useState(
    "Place all 3 pieces, then a new batch appears."
  );
  const [scorePulse, setScorePulse] = useState(false);
  const [boardFlash, setBoardFlash] = useState(false);
  const [invalidMovePulse, setInvalidMovePulse] = useState(false);
  const [lastInvalidCellKey, setLastInvalidCellKey] = useState<string | null>(null);

  const selectedPiece =
    pieces.find((piece) => piece.instanceId === selectedPieceId) ?? null;

  const preview = useMemo(
    () => getPreviewState(board, selectedPiece, hoveredCell),
    [board, hoveredCell, selectedPiece]
  );

  const rewardAvailable = reward?.type === "extra_move" && reward.value > 0;
  const validAnchorKeys = useMemo(() => {
    const keys = new Set<string>();

    if (!selectedPiece) {
      return keys;
    }

    for (let rowIndex = 0; rowIndex < board.length; rowIndex += 1) {
      for (let colIndex = 0; colIndex < board[rowIndex].length; colIndex += 1) {
        if (canPlaceShape(board, selectedPiece.shape, rowIndex, colIndex)) {
          keys.add(`${rowIndex}-${colIndex}`);
        }
      }
    }

    return keys;
  }, [board, selectedPiece]);

  useEffect(() => {
    let active = true;

    async function beginGameSession() {
      try {
        const profile = await getProfile();
        if (!active) {
          return;
        }

        setUser(profile);
        setReward(profile.activeReward);

        const session = await startGameSession();
        if (!active) {
          return;
        }

        const fresh = buildFreshGameState();
        setGameSessionId(session.session_id);
        setBoard(fresh.board);
        setPieces(fresh.pieces);
        setSelectedPieceId(fresh.selectedPieceId);
        setScore(0);
        setMovesUsed(0);
        setExtraMovesUsed(0);
        setGameOver(false);
        setError("");
        setStatusText("Fresh run started. Pick a shape and build your board.");
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to start game");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void beginGameSession();

    return () => {
      active = false;
    };
  }, [setGameSessionId, setReward, setUser]);

  useEffect(() => {
    if (!loading && !hasAnyValidMove(board, pieces)) {
      setGameOver(true);
      setStatusText("No valid placements left. Use your reward or bank the run.");
    }
  }, [board, loading, pieces]);

  useEffect(() => {
    if (!scorePulse) {
      return;
    }

    const timeoutId = window.setTimeout(() => setScorePulse(false), 320);
    return () => window.clearTimeout(timeoutId);
  }, [scorePulse]);

  useEffect(() => {
    if (!boardFlash) {
      return;
    }

    const timeoutId = window.setTimeout(() => setBoardFlash(false), 520);
    return () => window.clearTimeout(timeoutId);
  }, [boardFlash]);

  useEffect(() => {
    if (!invalidMovePulse) {
      return;
    }

    const timeoutId = window.setTimeout(() => setInvalidMovePulse(false), 260);
    return () => window.clearTimeout(timeoutId);
  }, [invalidMovePulse]);

  useEffect(() => {
    if (!lastInvalidCellKey) {
      return;
    }

    const timeoutId = window.setTimeout(() => setLastInvalidCellKey(null), 500);
    return () => window.clearTimeout(timeoutId);
  }, [lastInvalidCellKey]);

  async function bankCurrentRun() {
    if (gameSessionId === null) {
      return;
    }

    const result = await finishGameSession(
      gameSessionId,
      score,
      movesUsed,
      extraMovesUsed
    );
    addXP(result.xp_gained);
    setGameSessionId(null);
    return result;
  }

  async function startFreshRun() {
    const session = await startGameSession();
    const fresh = buildFreshGameState();

    setGameSessionId(session.session_id);
    setBoard(fresh.board);
    setPieces(fresh.pieces);
    setSelectedPieceId(fresh.selectedPieceId);
    setHoveredCell(null);
    setScore(0);
    setMovesUsed(0);
    setExtraMovesUsed(0);
    setGameOver(false);
    setError("");
    setStatusText("Fresh run started. Pick a shape and build your board.");
  }

  async function handleRestart() {
    try {
      setSubmitting(true);
      setError("");
      await bankCurrentRun();
      await startFreshRun();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restart game");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUseExtraMove() {
    try {
      setSubmitting(true);
      setError("");
      await useReward("extra_move");
      setReward(
        reward && reward.value > 1 ? { ...reward, value: reward.value - 1 } : null
      );
      const nextPieces = createPieceBatch();
      setPieces(nextPieces);
      setSelectedPieceId(nextPieces[0]?.instanceId ?? null);
      setGameOver(false);
      setExtraMovesUsed((current) => current + 1);
      setStatusText("Extra move used. New pieces dealt, keep the run alive.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to use extra move");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBankAndRestart() {
    try {
      setSubmitting(true);
      setError("");
      await bankCurrentRun();
      await startFreshRun();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save run");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePieceSelect(pieceId: string) {
    setSelectedPieceId(pieceId);
    setError("");
    setStatusText(
      getSelectionStatus(
        pieces.find((piece) => piece.instanceId === pieceId) ?? null,
        board
      )
    );
  }

  function handleBoardClick(row: number, col: number) {
    const cellKey = `${row}-${col}`;

    if (!selectedPiece) {
      setError("Select a piece first");
      setInvalidMovePulse(true);
      setLastInvalidCellKey(cellKey);
      setStatusText("Pick a piece first, then tap a glowing board cell.");
      return;
    }

    if (!canPlaceShape(board, selectedPiece.shape, row, col)) {
      setError("That piece does not fit there");
      setInvalidMovePulse(true);
      setLastInvalidCellKey(cellKey);
      setHoveredCell({ row, col });
      setStatusText(
        validAnchorKeys.size > 0
          ? "That spot is blocked. Tap one of the glowing board cells for a valid placement."
          : `${selectedPiece.shape.name} has no open placement on the board.`
      );
      return;
    }

    setError("");

    const move = placeShape(board, selectedPiece.shape, row, col);
    const remainingPieces = pieces.filter(
      (piece) => piece.instanceId !== selectedPiece.instanceId
    );
    const nextPieces =
      remainingPieces.length === 0 ? createPieceBatch() : remainingPieces;

    setBoard(move.board);
    setScore((current) => current + move.scoreGained);
    setMovesUsed((current) => current + 1);
    setPieces(nextPieces);
    setSelectedPieceId(nextPieces[0]?.instanceId ?? null);
    setHoveredCell(null);
    setScorePulse(true);

    if (move.clearedRows.length > 0 || move.clearedCols.length > 0) {
      setBoardFlash(true);
      setStatusText(
        `Clean clear: ${move.clearedRows.length} row(s) and ${move.clearedCols.length} column(s) removed.`
      );
    } else if (remainingPieces.length === 0) {
      setStatusText(
        `Placed ${selectedPiece.shape.name} for +${move.scoreGained} points. Fresh pieces dealt.`
      );
    } else {
      const nextSelected = nextPieces[0];
      setStatusText(
        `Placed ${selectedPiece.shape.name} for +${move.scoreGained} points. ${getSelectionStatus(
          nextSelected ?? null,
          move.board
        )}`
      );
    }
  }

  const previewCellMap = new Map(
    preview.cells.map((cell) => [`${cell.row}-${cell.col}`, preview.valid])
  );

  return (
    <div className="min-h-screen overflow-x-clip text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 lg:flex-row lg:items-start">
        <section className="flex flex-1 flex-col items-center space-y-4">
          <div className="glass-panel animate-rise-in w-full max-w-3xl p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.24em] text-emerald-200">
                  Cashback puzzle run
                </div>
                <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  Block Puzzle
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Keep the board liquid, cash in clears, and spend your reward at
                  the right moment.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <div className="rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-100">
                  {rewardAvailable ? "Reward ready" : "Reward locked"}
                </div>
                <Link
                  to="/dashboard"
                  className="glow-button rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {statusText}
              </div>
              <div className="rounded-2xl border border-emerald-300/15 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 px-4 py-3 text-sm text-emerald-50">
                {getSelectionStatus(selectedPiece, board)}
              </div>
            </div>
          </div>

          <div
            className={[
              "glass-panel bg-grid relative w-full max-w-3xl overflow-hidden p-4 sm:p-6",
              boardFlash ? "animate-board-flash" : "",
              invalidMovePulse ? "animate-shake-soft" : "",
            ].join(" ")}
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
            <div className="absolute -left-6 top-8 h-28 w-28 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute -right-8 bottom-6 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Treasury grid
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  Build combos, keep room for incoming rewards
                </div>
              </div>
              <div
                className={[
                  "w-full rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3 text-left sm:w-auto sm:text-right",
                  scorePulse ? "animate-score-pop" : "",
                ].join(" ")}
              >
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">
                  Portfolio score
                </div>
                <div className="mt-1 text-3xl font-bold text-white">{score}</div>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
                Tap piece
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
                Tap glowing cell
              </span>
              <span className="rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-amber-100">
                Finance overlays stay on placed blocks
              </span>
            </div>

            <div className="mx-auto w-full max-w-full overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.98))] p-2.5 shadow-2xl shadow-slate-950/60 sm:p-3.5">
              <div className="game-board mx-auto grid w-fit rounded-[26px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(3,7,18,0.95))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_60px_rgba(2,6,23,0.55)] sm:p-3">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const previewState = previewCellMap.get(`${rowIndex}-${colIndex}`);
                  const occupied = cell !== null;
                  const validAnchor = validAnchorKeys.has(key) && !occupied;
                  const invalidTap = lastInvalidCellKey === key;

                  const previewClass =
                    previewState === undefined
                      ? ""
                      : previewState
                        ? "ring-2 ring-emerald-100/80 ring-offset-1 ring-offset-slate-950"
                        : "bg-rose-500/80 ring-2 ring-rose-200/70";

                  const occupiedClass = occupied
                    ? "border-white/10 bg-slate-900/55 shadow-[0_0_18px_rgba(255,255,255,0.04)]"
                    : validAnchor
                      ? "border-amber-200/35 bg-[linear-gradient(180deg,rgba(51,65,85,0.92),rgba(15,23,42,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_18px_rgba(251,191,36,0.08)]"
                      : "border-white/6 bg-[linear-gradient(180deg,rgba(51,65,85,0.72),rgba(15,23,42,0.94))] hover:border-slate-500/80";

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={loading || submitting}
                      onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                      onFocus={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onBlur={() => setHoveredCell(null)}
                      onClick={() => handleBoardClick(rowIndex, colIndex)}
                      className={[
                        "finance-cell relative rounded-xl border transition duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-200/70",
                        "h-[var(--board-cell-size)] w-[var(--board-cell-size)] touch-manipulation",
                        occupiedClass,
                        previewClass,
                        invalidTap ? "ring-2 ring-rose-300/80" : "",
                      ].join(" ")}
                      aria-label={
                        occupied
                          ? `Occupied cell ${rowIndex + 1}, ${colIndex + 1}`
                          : `Place at row ${rowIndex + 1}, column ${colIndex + 1}`
                      }
                    >
                      {occupied
                        ? renderFinanceCell(
                            cell.color,
                            cell.accentLabel,
                            cell.accentPattern,
                            "top-[18%]"
                          )
                        : null}
                      {!occupied && validAnchor && previewState === undefined ? (
                        <span
                          className="pointer-events-none absolute inset-0 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.85)]" />
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
            </div>
          </div>
        </section>

        <aside className="w-full max-w-sm space-y-4 self-stretch">
          <div className="glass-panel p-5">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Run stats
            </div>
            <div
              className={[
                "mt-3 text-4xl font-bold text-white",
                scorePulse ? "animate-score-pop" : "",
              ].join(" ")}
            >
              {score}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="stat-tile">
                <div className="text-slate-400">Session</div>
                <div className="mt-1 font-medium">
                  {loading ? "Starting..." : gameSessionId ?? "Offline"}
                </div>
              </div>
              <div className="stat-tile">
                <div className="text-slate-400">Moves</div>
                <div className="mt-1 font-medium">{movesUsed}</div>
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-amber-300/15 bg-[linear-gradient(180deg,rgba(251,191,36,0.16),rgba(16,185,129,0.08))] p-3 text-sm">
              <div className="text-amber-100/70">Cashback reserve</div>
              <div className="mt-1 font-medium text-white">
                {rewardAvailable ? `${reward?.type} x${reward?.value}` : "None"}
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Available pieces</h2>
                  <p className="text-sm text-slate-400">
                    Select one, then tap a glowing board cell.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm">
                {pieces.length}/3
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {pieces.map((piece) => {
                const bounds = getShapeBounds(piece.shape);
                const selected = piece.instanceId === selectedPieceId;
                const playable = hasAnyValidMove(board, [piece]);

                return (
                  <button
                    key={piece.instanceId}
                    type="button"
                    onClick={() => handlePieceSelect(piece.instanceId)}
                    className={[
                      "finance-piece-card glow-button rounded-2xl border p-4 text-left transition",
                      selected
                        ? "border-emerald-200/80 bg-gradient-to-br from-emerald-400/14 via-cyan-400/10 to-white/[0.04] shadow-[0_0_30px_rgba(52,211,153,0.12)] ring-2 ring-emerald-300/30"
                        : "border-white/8 bg-white/[0.03] hover:border-white/20",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{piece.shape.name}</span>
                        {selected ? (
                          <span className="rounded-full bg-emerald-300/20 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-emerald-100">
                            Selected
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          playable
                            ? "bg-emerald-500/20 text-emerald-100"
                            : "bg-rose-500/20 text-rose-100"
                        }`}
                      >
                        {playable ? "Fits" : "Blocked"}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 text-[0.68rem] uppercase tracking-[0.18em] text-slate-400">
                      <span>{piece.shape.accentLabel}</span>
                      <span>{piece.shape.accentPattern}</span>
                    </div>

                    <div
                      className="mt-3 inline-grid gap-1.5 rounded-2xl border border-white/6 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.92))] p-3"
                      style={{
                        gridTemplateColumns: `repeat(${bounds.width}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: bounds.height * bounds.width }).map(
                        (_, cellIndex) => {
                          const cellRow = Math.floor(cellIndex / bounds.width);
                          const cellCol = cellIndex % bounds.width;
                          const active = piece.shape.cells.some(
                            (cell) => cell.row === cellRow && cell.col === cellCol
                          );

                          return (
                            <div
                              key={`${piece.instanceId}-${cellIndex}`}
                              className={[
                                "finance-cell relative h-9 w-9 rounded-lg border border-white/5",
                                active
                                  ? "bg-slate-900/45 shadow-[0_0_18px_rgba(255,255,255,0.05)]"
                                  : "bg-slate-800/90",
                              ].join(" ")}
                            >
                              {active
                                ? renderFinanceCell(
                                    piece.shape.color,
                                    piece.shape.accentLabel,
                                    piece.shape.accentPattern,
                                    "top-[20%]"
                                  )
                                : null}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-panel p-5">
            <h2 className="text-lg font-semibold">Reward</h2>
            <p className="mt-1 text-sm text-slate-400">
              `extra_move` rerolls your 3 pieces once after you hit a dead end.
            </p>

            <div
              className={[
                "mt-4 rounded-[22px] border p-4",
                rewardAvailable
                  ? "animate-reward-pop border-amber-300/20 bg-gradient-to-br from-amber-300/20 via-amber-200/10 to-emerald-300/10"
                  : "border-white/8 bg-white/[0.03]",
              ].join(" ")}
            >
              {rewardAvailable ? (
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-amber-100/80">
                    Bonus in wallet
                  </div>
                  <div className="font-medium text-white">
                    {reward?.type} x{reward?.value}
                  </div>
                  <div className="text-sm text-slate-300">
                    Saved for this run until you use it.
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400">
                  No active reward. Visit the dashboard and pay for coffee.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleRestart()}
              disabled={loading || submitting}
              className="glow-button min-h-14 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              Restart run
            </button>
            <button
              type="button"
              onClick={() => void handleBankAndRestart()}
              disabled={loading || submitting}
              className="glow-button min-h-14 flex-1 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              Bank score
            </button>
          </div>

          {error ? (
            <div className="animate-fade-up rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </aside>
      </div>

      {gameOver ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="glass-panel animate-rise-in w-full max-w-md p-5 sm:p-6">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Dead End
            </div>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              {score} points
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              None of the current 3 pieces fit on the board. Bank the run, restart
              quickly, or spend your extra move if it is available.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                Moves used: {movesUsed}
              </div>
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                Extra moves used: {extraMovesUsed}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {rewardAvailable ? (
                <button
                  type="button"
                  onClick={() => void handleUseExtraMove()}
                  disabled={submitting}
                  className="glow-button min-h-14 w-full rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
                >
                  Use extra move reward
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => void handleRestart()}
                disabled={submitting}
                className="glow-button min-h-14 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                Quick restart
              </button>

              <button
                type="button"
                onClick={() => void handleBankAndRestart()}
                disabled={submitting}
                className="glow-button min-h-14 w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
              >
                Save score and play again
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
