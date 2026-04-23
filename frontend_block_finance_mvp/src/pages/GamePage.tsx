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

type HoveredCell = { row: number; col: number } | null;

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

  const selectedPiece =
    pieces.find((piece) => piece.instanceId === selectedPieceId) ?? null;

  const preview = useMemo(
    () => getPreviewState(board, selectedPiece, hoveredCell),
    [board, hoveredCell, selectedPiece]
  );

  const rewardAvailable = reward?.type === "extra_move" && reward.value > 0;
  const boardSize = board[0]?.length ?? 8;

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

  function handleBoardClick(row: number, col: number) {
    if (!selectedPiece) {
      setError("Select a piece first");
      setInvalidMovePulse(true);
      return;
    }

    if (!canPlaceShape(board, selectedPiece.shape, row, col)) {
      setError("That piece does not fit there");
      setInvalidMovePulse(true);
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
        `Clean clear: ${move.clearedRows.length} row(s), ${move.clearedCols.length} column(s).`
      );
    } else {
      setStatusText(`Placed ${selectedPiece.shape.name} for +${move.scoreGained}.`);
    }
  }

  const previewCellMap = new Map(
    preview.cells.map((cell) => [`${cell.row}-${cell.col}`, preview.valid])
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e3359_0%,_#0d1528_46%,_#050a14_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-3 pb-40 pt-3">
        <header
          className="sticky top-0 z-20 -mx-3 mb-3 border-b border-white/10 bg-slate-950/70 px-3 pb-2 backdrop-blur"
          style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
        >
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
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const previewState = previewCellMap.get(`${rowIndex}-${colIndex}`);
                  const occupied = cell === 1;
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
                      onPointerEnter={() => handleBoardPreview(rowIndex, colIndex)}
                      onPointerMove={() => handleBoardPreview(rowIndex, colIndex)}
                      onPointerLeave={handleBoardLeave}
                      onClick={() => handleBoardClick(rowIndex, colIndex)}
                      className={[
                        "aspect-square rounded-xl border transition",
                        occupied
                          ? "border-white/10 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 shadow-[inset_0_1px_8px_rgba(255,255,255,0.65),0_4px_10px_rgba(0,0,0,0.24)]"
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
          <div
            className="pointer-events-auto w-full max-w-md"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
          >
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
                          onClick={() => setSelectedPieceId(piece.instanceId)}
                          className={[
                            "flex flex-col items-center justify-center p-2 transition",
                            selected ? "ring-2 ring-cyan-300/60 rounded-lg" : "",
                          ].join(" ")}
                        >
                          <div
                            className="grid gap-0.5"
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
                                      "aspect-square rounded-sm",
                                      active
                                        ? "bg-gradient-to-br from-cyan-200 via-cyan-300 to-blue-400 shadow-[inset_0_1px_6px_rgba(255,255,255,0.7)]"
                                        : "bg-slate-800 border border-slate-700",
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

        {gameOver ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/70 px-3 backdrop-blur-sm sm:items-center">
            <div
              className="mb-3 w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-950/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
              style={{ marginBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
            >
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
