import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  finishGameSession,
  getProfile,
  startGameSession,
  useReward,
} from "../services/api";
import { trackEvent } from "../services/analytics";
import {
  BankIcon,
  CardIcon,
  CashbackIcon,
  CoinIcon,
  DollarIcon,
  EuroIcon,
  HomeIcon,
  MtbMIcon,
  RewardIcon,
} from "../components/AppIcons";
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

type DragState = {
  pieceId: string;
  pointerId: number;
  clientX: number;
  clientY: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
};

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

function getFinanceIconComponent(
  pattern: Piece["shape"]["accentPattern"],
  accentLabel: string
) {
  if (accentLabel === "$") {
    return DollarIcon;
  }

  if (accentLabel === "€") {
    return EuroIcon;
  }

  switch (pattern) {
    case "coin":
      return CoinIcon;
    case "bill":
      return DollarIcon;
    case "vault":
      return BankIcon;
    case "card":
      return CardIcon;
    case "chart":
      return CashbackIcon;
    case "bank":
      return BankIcon;
    default:
      return DollarIcon;
  }
}

function renderFinanceCell(
  color: string,
  accentLabel: string,
  accentPattern: Piece["shape"]["accentPattern"],
  sizeClass: string
) {
  const tone = getPieceTone(color);
  const FinanceIcon = getFinanceIconComponent(accentPattern, accentLabel);

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
        <FinanceIcon className="h-full w-full" />
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
    return "Drag a piece onto the board to place it.";
  }

  if (!hasAnyValidMove(board, [piece])) {
    return `${piece.shape.name} is blocked right now. Choose another piece or save your reward for a dead end.`;
  }

  return `${piece.shape.name} selected. Drag it onto the board to preview placement.`;
}

function renderPieceMiniature(piece: Piece, keyPrefix: string) {
  const bounds = getShapeBounds(piece.shape);

  return (
    <div
      className="mt-3 inline-grid gap-1 rounded-2xl border border-white/6 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.92))] p-2"
      style={{
        gridTemplateColumns: `repeat(${bounds.width}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: bounds.height * bounds.width }).map((_, cellIndex) => {
        const cellRow = Math.floor(cellIndex / bounds.width);
        const cellCol = cellIndex % bounds.width;
        const active = piece.shape.cells.some(
          (cell) => cell.row === cellRow && cell.col === cellCol
        );

        return (
          <div
            key={`${keyPrefix}-${cellIndex}`}
            className={[
              "finance-cell relative h-7 w-7 rounded-lg border border-white/5",
              active ? "bg-slate-900/45" : "bg-slate-800/90",
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
      })}
    </div>
  );
}

export default function GamePage() {
  const { reward, addXP, gameSessionId, setGameSessionId, setReward, setUser } =
    useAppStore();
  const suppressNextBoardClickRef = useRef(false);

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
  const [touchPreviewActive, setTouchPreviewActive] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

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
        trackEvent("game_started", {
          session_id: session.session_id,
        });
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
    document.body.classList.add("game-screen");

    return () => {
      document.body.classList.remove("game-screen");
    };
  }, []);

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

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const activeDrag = dragState;

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerId !== activeDrag.pointerId) {
        return;
      }

      setDragState((current) =>
        current
          ? {
              ...current,
              clientX: event.clientX,
              clientY: event.clientY,
            }
          : current
      );
      setTouchPreviewActive(true);
      updateTouchPreview(event.clientX, event.clientY);
      event.preventDefault();
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId !== activeDrag.pointerId) {
        return;
      }

      const cell = getTouchBoardCell(event.clientX, event.clientY);
      const draggedPiece =
        pieces.find((piece) => piece.instanceId === activeDrag.pieceId) ?? null;

      setDragState(null);
      setTouchPreviewActive(false);

      if (!draggedPiece) {
        setHoveredCell(null);
        return;
      }

      setSelectedPieceId(draggedPiece.instanceId);

      if (cell && canPlaceShape(board, draggedPiece.shape, cell.row, cell.col)) {
        placeSelectedPieceAt(draggedPiece, cell.row, cell.col);
        return;
      }

      if (cell) {
        const cellKey = `${cell.row}-${cell.col}`;
        setError("That piece does not fit there");
        setInvalidMovePulse(true);
        setLastInvalidCellKey(cellKey);
      }

      setHoveredCell(null);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [board, dragState, pieces]);

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
    trackEvent("game_finished", {
      session_id: gameSessionId,
      score,
      moves_used: movesUsed,
      extra_moves_used: extraMovesUsed,
      xp_gained: result.xp_gained,
    });
    addXP(result.xp_gained);
    setGameSessionId(null);
    return result;
  }

  async function startFreshRun() {
    const session = await startGameSession();
    const fresh = buildFreshGameState();

    setGameSessionId(session.session_id);
    trackEvent("game_started", {
      session_id: session.session_id,
      restart: true,
    });
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

  function handlePieceDragStart(
    pieceId: string,
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (loading || submitting) {
      return;
    }

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    event.preventDefault();

    setSelectedPieceId(pieceId);
    setError("");
    setDragState({
      pieceId,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      width: rect.width,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
    setTouchPreviewActive(true);
    updateTouchPreview(event.clientX, event.clientY);
  }

  function getTouchBoardCell(clientX: number, clientY: number) {
    if (typeof document === "undefined") {
      return null;
    }

    const element = document.elementFromPoint(clientX, clientY);
    const cell = element?.closest<HTMLButtonElement>("[data-board-cell='true']");

    if (!cell) {
      return null;
    }

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    if (Number.isNaN(row) || Number.isNaN(col)) {
      return null;
    }

    return { row, col };
  }

  function updateTouchPreview(clientX: number, clientY: number) {
    const cell = getTouchBoardCell(clientX, clientY);
    setHoveredCell(cell);
  }

  function placeSelectedPieceAt(piece: Piece, row: number, col: number) {
    const move = placeShape(board, piece.shape, row, col);
    const remainingPieces = pieces.filter(
      (currentPiece) => currentPiece.instanceId !== piece.instanceId
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
        `Placed ${piece.shape.name} for +${move.scoreGained} points. Fresh pieces dealt.`
      );
    } else {
      const nextSelected = nextPieces[0];
      setStatusText(
        `Placed ${piece.shape.name} for +${move.scoreGained} points. ${getSelectionStatus(
          nextSelected ?? null,
          move.board
        )}`
      );
    }
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
          ? "That spot is blocked. Glowing cells are valid placements."
          : `${selectedPiece.shape.name} has no open placement on the board.`
      );
      return;
    }

    setError("");
    placeSelectedPieceAt(selectedPiece, row, col);
  }

  const previewCellMap = new Map(
    preview.cells.map((cell) => [`${cell.row}-${cell.col}`, preview.valid])
  );

  return (
    <div className="h-[100dvh] overflow-hidden text-slate-100">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-4 overflow-hidden p-3 sm:p-4 lg:flex-row lg:items-start">
        <section className="flex flex-1 flex-col items-center space-y-4">
          <div className="glass-panel animate-rise-in mtb-surface w-full max-w-3xl p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="mtb-logo-badge">
                  <MtbMIcon className="h-4 w-4 text-sky-200" />
                  MTB Moby
                </span>
                <h1 className="text-xl font-bold text-white sm:text-3xl">Block Puzzle</h1>
              </div>
              <div className="hidden items-center gap-2 lg:flex">
                <div className="brand-badge-bonus">
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

            <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
              <div className="brand-badge-finance">Score {score}</div>
              <div className="brand-badge-neutral">
                {rewardAvailable ? "Bonus ready" : "Bonus locked"}
              </div>
              <Link
                to="/dashboard"
                className="glow-button inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-100"
              >
                <HomeIcon className="h-4 w-4" />
                Dashboard
              </Link>
            </div>

            <div className="mt-3 hidden gap-3 sm:grid-cols-[1.2fr_0.8fr] lg:grid">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {statusText}
              </div>
              <div className="rounded-2xl border border-emerald-300/15 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 px-4 py-3 text-sm text-emerald-50">
                {touchPreviewActive
                  ? "Slide across the board, then release to place the selected piece."
                  : getSelectionStatus(selectedPiece, board)}
              </div>
            </div>
          </div>

          <div
            className={[
              "glass-panel bg-grid relative w-full max-w-3xl flex-1 overflow-hidden p-3 sm:p-5",
              boardFlash ? "animate-board-flash" : "",
              invalidMovePulse ? "animate-shake-soft" : "",
            ].join(" ")}
            style={{ touchAction: "none" }}
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
            <div className="absolute -left-6 top-8 h-28 w-28 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="absolute -right-8 bottom-6 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="mb-4 hidden flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:flex">
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
                  "fintech-score-card w-full rounded-2xl border border-emerald-300/20 px-4 py-3 text-left sm:w-auto sm:text-right",
                  scorePulse ? "animate-score-pop" : "",
                ].join(" ")}
              >
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">
                  Portfolio score
                </div>
                <div className="mt-1 text-3xl font-bold text-white">{score}</div>
                <div className="mt-1 text-[0.72rem] uppercase tracking-[0.18em] text-emerald-50/70">
                  Cashback momentum
                </div>
              </div>
            </div>

            <div className="mb-3 hidden flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-300 lg:flex">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
                Tap piece
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1">
                Tap or slide on board
              </span>
              <span className="rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-amber-100">
                Glowing cells are valid
              </span>
            </div>

            <div
              className="bank-grid-surface mx-auto w-full max-w-full overflow-hidden rounded-[32px] border border-emerald-300/12 p-2.5 shadow-2xl shadow-slate-950/60 sm:p-3.5"
            >
              <div className="game-board mx-auto grid w-fit rounded-[26px] border border-emerald-200/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.78),rgba(3,7,18,0.95))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_60px_rgba(2,6,23,0.55)] sm:p-3">
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const previewState = previewCellMap.get(key);
                    const occupied = cell !== null;
                    const invalidTap = lastInvalidCellKey === key;

                    const previewClass =
                      previewState === undefined
                        ? ""
                        : previewState
                          ? "ring-2 ring-emerald-100/80 ring-offset-1 ring-offset-slate-950"
                          : "bg-rose-500/80 ring-2 ring-rose-200/70";

                    const occupiedClass = occupied
                      ? "border-white/10 bg-slate-900/55 shadow-[0_0_18px_rgba(255,255,255,0.04)]"
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
                        onClick={() => {
                          if (suppressNextBoardClickRef.current) {
                            suppressNextBoardClickRef.current = false;
                            return;
                          }

                          handleBoardClick(rowIndex, colIndex);
                        }}
                        data-board-cell="true"
                        data-row={rowIndex}
                        data-col={colIndex}
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
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-2 lg:hidden">
              <div className="grid grid-cols-3 gap-2">
                {pieces.map((piece) => {
                  const selected = piece.instanceId === selectedPieceId;
                  const playable = hasAnyValidMove(board, [piece]);
                  const PieceIcon = getFinanceIconComponent(
                    piece.shape.accentPattern,
                    piece.shape.accentLabel
                  );

                  return (
                    <button
                      key={piece.instanceId}
                      type="button"
                      onClick={() => handlePieceSelect(piece.instanceId)}
                      onPointerDown={(event) =>
                        handlePieceDragStart(piece.instanceId, event)
                      }
                      className={[
                        "finance-piece-card glow-button rounded-2xl border p-2.5 transition",
                        selected
                          ? "border-emerald-200/80 bg-gradient-to-br from-emerald-400/14 via-cyan-400/10 to-white/[0.04] shadow-[0_0_30px_rgba(52,211,153,0.12)] ring-2 ring-emerald-300/30"
                          : "border-white/8 bg-white/[0.03]",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="brand-badge-neutral min-w-0 px-2 py-1 text-[0.7rem]">
                          <PieceIcon className="h-3.5 w-3.5" />
                        </span>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            playable ? "bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.7)]" : "bg-rose-300 shadow-[0_0_10px_rgba(253,164,175,0.55)]"
                          }`}
                        />
                      </div>
                      <div className="mt-2 flex justify-center">
                        {renderPieceMiniature(piece, `${piece.instanceId}-mobile-grid`)}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="reward-surface-muted px-3 py-3">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                    <BankIcon className="h-3.5 w-3.5" />
                    Moves
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">{movesUsed}</div>
                </div>
                <div className={rewardAvailable ? "reward-surface px-3 py-3 border-amber-300/20" : "reward-surface-muted px-3 py-3"}>
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                    <RewardIcon className="h-3.5 w-3.5" />
                    Bonus
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white">
                    {rewardAvailable ? `${reward?.value} ready` : "Locked"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden w-full max-w-sm space-y-4 self-stretch lg:block">
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
            <div className="reward-surface mt-3 border-amber-300/15 text-sm">
              <div className="text-amber-100/70">Cashback reserve</div>
              <div className="mt-1 font-medium text-white">
                {rewardAvailable ? `${reward?.type} x${reward?.value}` : "None"}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="bonus-chip bonus-chip-cashback inline-flex items-center gap-1.5">
                  <CashbackIcon className="h-3 w-3" />
                  Cashback
                </span>
                <span className="bonus-chip bonus-chip-reward inline-flex items-center gap-1.5">
                  <RewardIcon className="h-3 w-3" />
                  Bonus hold
                </span>
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
                const selected = piece.instanceId === selectedPieceId;
                const playable = hasAnyValidMove(board, [piece]);

                return (
                  <button
                    key={piece.instanceId}
                    type="button"
                    onClick={() => handlePieceSelect(piece.instanceId)}
                    onPointerDown={(event) =>
                      handlePieceDragStart(piece.instanceId, event)
                    }
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
                          <span className="brand-badge-finance px-2 py-1 text-[0.7rem]">
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

                    {renderPieceMiniature(piece, piece.instanceId)}
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
                "mt-4 p-4",
                rewardAvailable
                  ? "reward-surface animate-reward-pop border-amber-300/20"
                  : "reward-surface-muted",
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
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="bonus-chip bonus-chip-cashback">Reward reserve</span>
                    <span className="bonus-chip bonus-chip-reward">Card bonus</span>
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

      {error ? (
        <div className="mx-auto mt-4 w-full max-w-3xl px-4 lg:hidden">
          <div className="animate-fade-up rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        </div>
      ) : null}

      {gameOver ? (
        <div className="safe-bottom-pad fixed inset-0 z-40 flex items-end justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="glass-panel animate-rise-in w-full max-w-md border-amber-300/15 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.98))] p-5 sm:p-6">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Dead End
            </div>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              {score} points
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="bonus-chip bonus-chip-cashback">Reward checkpoint</span>
              <span className="bonus-chip bonus-chip-reward">Bank or revive</span>
            </div>
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

            <div className="mt-6 space-y-3 safe-bottom-pad">
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

      {dragState
        ? (() => {
            const draggedPiece =
              pieces.find((piece) => piece.instanceId === dragState.pieceId) ?? null;

            if (!draggedPiece) {
              return null;
            }

            return (
              <div
                className="pointer-events-none fixed left-0 top-0 z-50"
                style={{
                  transform: `translate(${dragState.clientX - dragState.offsetX}px, ${dragState.clientY - dragState.offsetY}px)`,
                  width: dragState.width,
                }}
              >
                <div className="finance-piece-card rounded-2xl border border-emerald-200/40 bg-slate-900/90 p-3 shadow-[0_18px_40px_rgba(2,6,23,0.45)] backdrop-blur-xl">
                  {renderPieceMiniature(draggedPiece, `${draggedPiece.instanceId}-drag`)}
                </div>
              </div>
            );
          })()
        : null}
    </div>
  );
}
