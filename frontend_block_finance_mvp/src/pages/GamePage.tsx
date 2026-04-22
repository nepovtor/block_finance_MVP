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
    "Place all 3 pieces, then a new batch appears."
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
        `Clean clear: ${move.clearedRows.length} row(s) and ${move.clearedCols.length} column(s) removed.`
      );
    } else {
      setStatusText(`Placed ${selectedPiece.shape.name} for +${move.scoreGained} points.`);
    }
  }

  const previewCellMap = new Map(
    preview.cells.map((cell) => [`${cell.row}-${cell.col}`, preview.valid])
  );

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 lg:flex-row lg:items-start">
        <section className="flex flex-1 flex-col items-center space-y-4">
          <div className="glass-panel animate-rise-in w-full max-w-3xl p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.24em] text-emerald-200">
                  Game screen
                </div>
                <h1 className="mt-2 text-3xl font-bold text-white">Block Puzzle</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Place all 3 pieces, clear rows and columns, and survive as long
                  as possible.
                </p>
              </div>
              <Link
                to="/dashboard"
                className="glow-button rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100"
              >
                Back to dashboard
              </Link>
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              {statusText}
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
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Board
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  Build combos, keep space open
                </div>
              </div>
              <div
                className={[
                  "rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3 text-right",
                  scorePulse ? "animate-score-pop" : "",
                ].join(" ")}
              >
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">
                  Score
                </div>
                <div className="mt-1 text-3xl font-bold text-white">{score}</div>
              </div>
            </div>

            <div className="mx-auto grid w-fit grid-cols-8 gap-1 rounded-[28px] border border-white/8 bg-slate-950/70 p-3 shadow-2xl shadow-slate-950/50">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const previewState = previewCellMap.get(`${rowIndex}-${colIndex}`);
                  const occupied = cell !== null;

                  const previewClass =
                    previewState === undefined
                      ? ""
                      : previewState
                        ? `${selectedPiece?.shape.color ?? "bg-emerald-400"} ring-2 ring-emerald-100/70 opacity-80`
                        : "bg-rose-500/80 ring-2 ring-rose-200/60";

                  const occupiedClass = occupied
                    ? `${cell.color} shadow-inner shadow-white/20`
                    : "bg-slate-800/90 hover:bg-slate-700";

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      type="button"
                      disabled={loading || submitting}
                      onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => handleBoardClick(rowIndex, colIndex)}
                      className={[
                        "h-10 w-10 rounded-xl border border-white/5 transition duration-150 sm:h-11 sm:w-11",
                        occupiedClass,
                        previewClass,
                      ].join(" ")}
                    />
                  );
                })
              )}
            </div>
          </div>
        </section>

        <aside className="w-full max-w-sm space-y-4">
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
            <div className="mt-3 rounded-2xl border border-amber-300/15 bg-amber-300/10 p-3 text-sm">
              <div className="text-amber-100/70">Active reward</div>
              <div className="mt-1 font-medium text-white">
                {rewardAvailable ? `${reward?.type} x${reward?.value}` : "None"}
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Available pieces</h2>
                <p className="text-sm text-slate-400">
                  Select one, then place it on the board.
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
                      "glow-button rounded-2xl border p-4 text-left transition",
                      selected
                        ? "border-emerald-300/70 bg-emerald-400/10 ring-2 ring-emerald-300/25"
                        : "border-white/8 bg-white/[0.03] hover:border-white/20",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{piece.shape.name}</span>
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

                    <div
                      className="mt-3 grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${bounds.width}, minmax(0, 1fr))`,
                        width: `${bounds.width * 20}px`,
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
                              className={`h-4 w-4 rounded-sm ${
                                active ? piece.shape.color : "bg-slate-700"
                              }`}
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

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void handleRestart()}
              disabled={loading || submitting}
              className="glow-button flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              Restart run
            </button>
            <button
              type="button"
              onClick={() => void handleBankAndRestart()}
              disabled={loading || submitting}
              className="glow-button flex-1 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
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
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="glass-panel animate-rise-in w-full max-w-md p-6">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Game Over
            </div>
            <h2 className="mt-2 text-4xl font-bold text-white">{score} points</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              None of the current 3 pieces can be placed on the board.
            </p>

            <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              Moves used: {movesUsed}. Extra moves used: {extraMovesUsed}.
            </div>

            <div className="mt-6 space-y-3">
              {rewardAvailable ? (
                <button
                  type="button"
                  onClick={() => void handleUseExtraMove()}
                  disabled={submitting}
                  className="glow-button w-full rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
                >
                  Use extra move reward
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => void handleBankAndRestart()}
                disabled={submitting}
                className="glow-button w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
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