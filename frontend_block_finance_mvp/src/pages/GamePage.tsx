import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import {
  finishGameSession,
  getProfile,
  startGameSession,
  useReward,
} from "../services/api";
import {
  BOARD_SIZE,
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

type HoveredCell = { row: number; col: number } | null;
type DragState = {
  pieceId: string;
  clientX: number;
  clientY: number;
  anchorRow: number;
  anchorCol: number;
  moved: boolean;
};

function getDragOrigin(
  hoveredCell: HoveredCell,
  dragState: DragState | null
): HoveredCell {
  if (!hoveredCell || !dragState) {
    return hoveredCell;
  }

  return {
    row: hoveredCell.row - dragState.anchorRow,
    col: hoveredCell.col - dragState.anchorCol,
  };
}

function getPreviewState(
  board: Board,
  piece: Piece | null,
  originCell: HoveredCell
) {
  if (!piece || !originCell) {
    return {
      cells: [] as { row: number; col: number }[],
      valid: false,
    };
  }

  return {
    cells: getPlacementCells(piece.shape, originCell.row, originCell.col),
    valid: canPlaceShape(board, piece.shape, originCell.row, originCell.col),
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

function getBoardCellFromPoint(clientX: number, clientY: number): HoveredCell {
  const element = document
    .elementFromPoint(clientX, clientY)
    ?.closest<HTMLElement>("[data-board-cell]");

  if (!element) {
    return null;
  }

  const row = Number(element.dataset.row);
  const col = Number(element.dataset.col);

  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return null;
  }

  return { row, col };
}

function getDragAnchor(
  event: PointerEvent<HTMLButtonElement>,
  piece: Piece
): { anchorRow: number; anchorCol: number } {
  const activeCells = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>("[data-piece-cell]")
  );

  const closestCell = activeCells.reduce<HTMLElement | null>((closest, cell) => {
    if (!closest) return cell;

    const cellRect = cell.getBoundingClientRect();
    const closestRect = closest.getBoundingClientRect();
    const cellDistance =
      Math.abs(event.clientX - (cellRect.left + cellRect.width / 2)) +
      Math.abs(event.clientY - (cellRect.top + cellRect.height / 2));
    const closestDistance =
      Math.abs(event.clientX - (closestRect.left + closestRect.width / 2)) +
      Math.abs(event.clientY - (closestRect.top + closestRect.height / 2));

    return cellDistance < closestDistance ? cell : closest;
  }, null);

  const fallbackCell = piece.shape.cells[0] ?? { row: 0, col: 0 };

  return {
    anchorRow: Number(closestCell?.dataset.pieceRow ?? fallbackCell.row),
    anchorCol: Number(closestCell?.dataset.pieceCol ?? fallbackCell.col),
  };
}

function getShapeGridClass(width: number) {
  switch (width) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-2";
    case 3:
      return "grid-cols-3";
    case 4:
      return "grid-cols-4";
    default:
      return "grid-cols-5";
  }
}

const DRAG_GHOST_CELL_SIZE = 28;
const DRAG_GHOST_GAP = 4;

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
    "Pick a shape and tap the board."
  );
  const [scorePulse, setScorePulse] = useState(false);
  const [boardFlash, setBoardFlash] = useState(false);
  const [invalidMovePulse, setInvalidMovePulse] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const suppressNextPieceClick = useRef(false);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  const selectedPiece =
    pieces.find((piece) => piece.instanceId === selectedPieceId) ?? null;
  const draggedPiece =
    pieces.find((piece) => piece.instanceId === dragState?.pieceId) ?? null;

  const dragOriginCell = getDragOrigin(hoveredCell, dragState);
  const preview = useMemo(
    () => getPreviewState(board, draggedPiece ?? selectedPiece, dragOriginCell),
    [board, draggedPiece, dragOriginCell, selectedPiece]
  );

  const rewardAvailable = reward?.type === "extra_move" && reward.value > 0;

  useEffect(() => {
    let active = true;

    async function beginGameSession() {
      try {
        const profile = await getProfile();
        if (!active) return;
        setUser(profile);
        setReward(profile.activeReward);

        const session = await startGameSession();
        if (!active) return;

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
        setStatusText("Fresh run started. Pick a shape and tap the board.");
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to start game");
        }
      } finally {
        if (active) setLoading(false);
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
      setStatusText("No valid placements left. Use reward or bank the run.");
    }
  }, [board, loading, pieces]);

  useEffect(() => {
    if (!scorePulse) return;
    const timeoutId = window.setTimeout(() => setScorePulse(false), 280);
    return () => window.clearTimeout(timeoutId);
  }, [scorePulse]);

  useEffect(() => {
    if (!boardFlash) return;
    const timeoutId = window.setTimeout(() => setBoardFlash(false), 440);
    return () => window.clearTimeout(timeoutId);
  }, [boardFlash]);

  useEffect(() => {
    if (!invalidMovePulse) return;
    const timeoutId = window.setTimeout(() => setInvalidMovePulse(false), 220);
    return () => window.clearTimeout(timeoutId);
  }, [invalidMovePulse]);

  useEffect(() => {
    if (!dragState || !dragGhostRef.current) return;

    dragGhostRef.current.style.left = `${
      dragState.clientX -
      (dragState.anchorCol * (DRAG_GHOST_CELL_SIZE + DRAG_GHOST_GAP) +
        DRAG_GHOST_CELL_SIZE / 2)
    }px`;
    dragGhostRef.current.style.top = `${
      dragState.clientY -
      (dragState.anchorRow * (DRAG_GHOST_CELL_SIZE + DRAG_GHOST_GAP) +
        DRAG_GHOST_CELL_SIZE / 2)
    }px`;
  }, [dragState]);

  async function bankCurrentRun() {
    if (gameSessionId === null) return;
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
    setStatusText("Fresh run started. Pick a shape and tap the board.");
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
      setStatusText("Extra move used. New pieces dealt.");
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

  function handleBoardPreview(row: number, col: number) {
    if (!selectedPiece) return;
    setHoveredCell({ row, col });
  }

  function handleBoardLeave() {
    setHoveredCell(null);
  }

  function placePieceOnBoard(piece: Piece | null, row: number, col: number) {
    if (!piece) {
      setError("Select a piece first");
      setInvalidMovePulse(true);
      return false;
    }

    if (!canPlaceShape(board, piece.shape, row, col)) {
      setError("That piece does not fit there");
      setInvalidMovePulse(true);
      return false;
    }

    setError("");
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
        `Clean clear: ${move.clearedRows.length} row(s), ${move.clearedCols.length} column(s).`
      );
    } else {
      setStatusText(`Placed ${piece.shape.name} for +${move.scoreGained}.`);
    }

    return true;
  }

  function handleBoardClick(row: number, col: number) {
    placePieceOnBoard(selectedPiece, row, col);
  }

  function handlePiecePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    piece: Piece
  ) {
    const dragAnchor = getDragAnchor(event, piece);

    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedPieceId(piece.instanceId);
    setDragState({
      pieceId: piece.instanceId,
      clientX: event.clientX,
      clientY: event.clientY,
      anchorRow: dragAnchor.anchorRow,
      anchorCol: dragAnchor.anchorCol,
      moved: false,
    });
    setHoveredCell(getBoardCellFromPoint(event.clientX, event.clientY));
  }

  function handlePiecePointerMove(event: PointerEvent<HTMLButtonElement>) {
    setDragState((current) => {
      if (!current) {
        return current;
      }

      const moved =
        current.moved ||
        Math.abs(event.clientX - current.clientX) > 3 ||
        Math.abs(event.clientY - current.clientY) > 3;

      return {
        ...current,
        clientX: event.clientX,
        clientY: event.clientY,
        moved,
      };
    });

    setHoveredCell(getBoardCellFromPoint(event.clientX, event.clientY));
  }

  function handlePiecePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const cell = getBoardCellFromPoint(event.clientX, event.clientY);

    if (dragState?.moved) {
      suppressNextPieceClick.current = true;
    }

    const originCell = getDragOrigin(cell, dragState);

    if (originCell) {
      const placed = placePieceOnBoard(
        draggedPiece,
        originCell.row,
        originCell.col
      );
      suppressNextPieceClick.current = suppressNextPieceClick.current || placed;
    }

    setDragState(null);
    setHoveredCell(null);
  }

  function handlePieceClick(piece: Piece) {
    if (suppressNextPieceClick.current) {
      suppressNextPieceClick.current = false;
      return;
    }

    setSelectedPieceId(piece.instanceId);
  }

  const previewCellMap = new Map(
    preview.cells.map((cell) => [`${cell.row}-${cell.col}`, preview.valid])
  );
  const draggedBounds = draggedPiece ? getShapeBounds(draggedPiece.shape) : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e3359_0%,_#0d1528_46%,_#050a14_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-3 pb-40 pt-3">
        <header className="safe-top-header sticky top-0 z-20 -mx-3 mb-3 border-b border-white/10 bg-slate-950/70 px-3 pb-2 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/dashboard"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85"
            >
              ← Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <div
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  scorePulse
                    ? "bg-cyan-300 text-slate-950"
                    : "bg-white/10 text-white/90",
                ].join(" ")}
              >
                Score {score}
              </div>
              <div
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  rewardAvailable
                    ? "bg-amber-300 text-slate-950"
                    : "bg-white/10 text-white/60",
                ].join(" ")}
              >
                {rewardAvailable ? `Reward ×${reward?.value}` : "No reward"}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-cyan-200/70">
                Block Finance
              </p>
              <h1 className="text-lg font-bold leading-none">Game</h1>
            </div>
            <p className="max-w-[11rem] text-right text-[11px] leading-4 text-white/60">
              {statusText.replace(/\n/g, " ")}
            </p>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <div className="mb-3 flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.22em] text-white/45">
            <span>Moves {movesUsed}</span>
            <span>{loading ? "Starting" : `Session ${gameSessionId ?? "offline"}`}</span>
          </div>

          <section
            className={[
              "relative mx-auto w-full max-w-[22rem] rounded-[2rem] border border-white/10 bg-slate-950/55 p-3 shadow-[0_22px_80px_rgba(0,0,0,0.48)] transition",
              boardFlash ? "ring-4 ring-emerald-300/20" : "",
              invalidMovePulse ? "animate-pulse" : "",
            ].join(" ")}
          >
            <div className="game-board">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const previewState = previewCellMap.get(`${rowIndex}-${colIndex}`);
                  const occupied = cell !== null;
                  const previewClass =
                    previewState === undefined
                      ? ""
                      : previewState
                      ? "bg-emerald-400/70 ring-2 ring-emerald-200/80"
                      : "bg-rose-500/70 ring-2 ring-rose-200/70";

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      type="button"
                      aria-label={`Place selected shape at row ${
                        rowIndex + 1
                      }, column ${colIndex + 1}`}
                      data-board-cell
                      data-row={rowIndex}
                      data-col={colIndex}
                      onPointerEnter={() => handleBoardPreview(rowIndex, colIndex)}
                      onPointerMove={() => handleBoardPreview(rowIndex, colIndex)}
                      onPointerLeave={handleBoardLeave}
                      onClick={() => handleBoardClick(rowIndex, colIndex)}
                      className={[
                        "aspect-square rounded-xl border transition",
                        occupied
                          ? `${cell.color} border-white/10 shadow-[inset_0_1px_8px_rgba(255,255,255,0.35),0_4px_10px_rgba(0,0,0,0.24)]`
                          : "border-white/5 bg-[#14203b] hover:bg-[#1a2948]",
                        previewClass,
                      ].join(" ")}
                    />
                  );
                })
              )}
            </div>
          </section>
        </main>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center">
          <div className="safe-bottom-tray pointer-events-auto w-full max-w-md">
            <div className="border-t border-white/10 bg-slate-950/92 shadow-[0_-18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="flex justify-center px-3 py-4">
                <div className="grid grid-cols-3 gap-3">
                    {pieces.map((piece) => {
                      const bounds = getShapeBounds(piece.shape);
                      const selected = piece.instanceId === selectedPieceId;

                      return (
                        <button
                          key={piece.instanceId}
                          type="button"
                          aria-label={`Select and drag ${piece.shape.name} shape`}
                          onClick={() => handlePieceClick(piece)}
                          onPointerDown={(event) =>
                            handlePiecePointerDown(event, piece)
                          }
                          onPointerMove={handlePiecePointerMove}
                          onPointerUp={handlePiecePointerUp}
                          onPointerCancel={() => {
                            setDragState(null);
                            setHoveredCell(null);
                          }}
                          className={[
                            "touch-none select-none rounded-xl p-1.5 transition active:scale-95",
                            selected ? "scale-105" : "",
                            dragState?.pieceId === piece.instanceId
                              ? "opacity-35"
                              : "",
                          ].join(" ")}
                        >
                          <div
                            className={["grid gap-1", getShapeGridClass(bounds.width)].join(
                              " "
                            )}
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
                                    data-piece-cell={active ? true : undefined}
                                    data-piece-row={active ? cellRow : undefined}
                                    data-piece-col={active ? cellCol : undefined}
                                    className={[
                                      "h-5 w-5 rounded-md sm:h-6 sm:w-6",
                                      active
                                        ? `${piece.shape.color} ${
                                            selected ? "brightness-110" : ""
                                          } shadow-[inset_0_1px_5px_rgba(255,255,255,0.45),0_3px_8px_rgba(0,0,0,0.28)]`
                                        : "opacity-0",
                                    ].join(" ")}
                                  />
                                );
                              }
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="border-t border-white/10 px-3 py-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRestart()}
                    disabled={loading || submitting}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Restart
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBankAndRestart()}
                    disabled={loading || submitting}
                    className="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                  >
                    {gameOver ? "Save + play again" : "Bank score"}
                  </button>
                </div>

                {error ? (
                  <p className="mt-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {dragState && draggedPiece && draggedBounds ? (
          <div
            ref={dragGhostRef}
            className="pointer-events-none fixed z-50 opacity-85"
          >
            <div
              className={[
                "grid gap-1",
                getShapeGridClass(draggedBounds.width),
              ].join(" ")}
            >
              {Array.from({
                length: draggedBounds.height * draggedBounds.width,
              }).map((_, cellIndex) => {
                const cellRow = Math.floor(cellIndex / draggedBounds.width);
                const cellCol = cellIndex % draggedBounds.width;
                const active = draggedPiece.shape.cells.some(
                  (cell) => cell.row === cellRow && cell.col === cellCol
                );

                return (
                  <div
                    key={`${draggedPiece.instanceId}-drag-${cellIndex}`}
                    className={[
                      "h-7 w-7 rounded-lg",
                      active
                        ? `${draggedPiece.shape.color} shadow-[inset_0_1px_5px_rgba(255,255,255,0.45),0_4px_10px_rgba(0,0,0,0.28)]`
                        : "opacity-0",
                    ].join(" ")}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {gameOver ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/70 px-3 backdrop-blur-sm sm:items-center">
            <div className="safe-bottom-modal mb-3 w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-950/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
              <p className="text-[10px] uppercase tracking-[0.24em] text-amber-200/70">
                Run finished
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Game Over</h2>
              <p className="mt-2 text-sm text-white/65">
                None of the current 3 pieces can be placed on the board.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/[0.05] p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                    Score
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">{score}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.05] p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                    Moves
                  </p>
                  <p className="mt-1 text-xl font-bold text-white">{movesUsed}</p>
                </div>
              </div>

              <p className="mt-3 text-xs text-white/50">
                Extra moves used: {extraMovesUsed}
              </p>

              <div className="mt-5 space-y-2">
                {rewardAvailable ? (
                  <button
                    type="button"
                    onClick={() => void handleUseExtraMove()}
                    disabled={submitting}
                    className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                  >
                    Use extra move reward
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleBankAndRestart()}
                  disabled={submitting}
                  className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                >
                  Save score and play again
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
