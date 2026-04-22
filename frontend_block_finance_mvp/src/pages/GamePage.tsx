import { useEffect, useMemo, useState } from "react";
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
    }
  }, [board, loading, pieces]);

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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to use extra move"
      );
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

  function handleBoardClick(row: number, col: number) {
    if (!selectedPiece) {
      setError("Select a piece first");
      return;
    }

    if (!canPlaceShape(board, selectedPiece.shape, row, col)) {
      setError("That piece does not fit there");
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
  }

  const previewCellMap = new Map(
    preview.cells.map((cell) => [`${cell.row}-${cell.col}`, preview.valid])
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 lg:flex-row">
        <section className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Block Puzzle</h1>
              <p className="text-sm text-slate-400">
                Place all 3 pieces, clear rows and columns, and survive as long
                as possible.
              </p>
            </div>
            <Link to="/dashboard" className="text-sm text-slate-300 underline">
              Back to dashboard
            </Link>
          </div>

          <div className="grid w-fit grid-cols-8 gap-1 rounded-3xl bg-slate-900 p-3 shadow-2xl shadow-slate-950/50">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const previewState = previewCellMap.get(
                  `${rowIndex}-${colIndex}`
                );
                const occupied = cell === 1;
                const previewClass =
                  previewState === undefined
                    ? ""
                    : previewState
                      ? "bg-emerald-500/70 ring-1 ring-emerald-200"
                      : "bg-rose-500/70 ring-1 ring-rose-200";

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    disabled={loading || submitting}
                    onMouseEnter={() =>
                      setHoveredCell({ row: rowIndex, col: colIndex })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => handleBoardClick(rowIndex, colIndex)}
                    className={[
                      "h-10 w-10 rounded-lg transition",
                      occupied ? "bg-slate-200" : "bg-slate-700 hover:bg-slate-600",
                      previewClass,
                    ].join(" ")}
                  />
                );
              })
            )}
          </div>
        </section>

        <aside className="w-full max-w-sm space-y-4">
          <div className="rounded-3xl bg-slate-900 p-5 shadow-xl shadow-slate-950/40">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Run stats
            </div>
            <div className="mt-3 text-4xl font-semibold">{score}</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-800 p-3">
                <div className="text-slate-400">Session</div>
                <div className="mt-1 font-medium">
                  {loading ? "Starting..." : gameSessionId ?? "Offline"}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-800 p-3">
                <div className="text-slate-400">Moves</div>
                <div className="mt-1 font-medium">{movesUsed}</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 p-5 shadow-xl shadow-slate-950/40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Available pieces</h2>
                <p className="text-sm text-slate-400">
                  Select one, then place it on the board.
                </p>
              </div>
              <div className="rounded-full bg-slate-800 px-3 py-1 text-sm">
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
                    onClick={() => setSelectedPieceId(piece.instanceId)}
                    className={[
                      "rounded-2xl border p-4 text-left transition",
                      selected
                        ? "border-emerald-400 bg-slate-800 ring-2 ring-emerald-400/40"
                        : "border-slate-700 bg-slate-800/80 hover:border-slate-500",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{piece.shape.name}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          playable
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-rose-500/20 text-rose-200"
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
                            (cell) =>
                              cell.row === cellRow && cell.col === cellCol
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

          <div className="rounded-3xl bg-slate-900 p-5 shadow-xl shadow-slate-950/40">
            <h2 className="text-lg font-semibold">Reward</h2>
            <p className="mt-1 text-sm text-slate-400">
              `extra_move` can reroll your 3 pieces once after game over.
            </p>

            <div className="mt-4 rounded-2xl bg-slate-800 p-4">
              {rewardAvailable ? (
                <div className="space-y-2">
                  <div className="font-medium">
                    {reward?.type} x{reward?.value}
                  </div>
                  <div className="text-sm text-slate-400">
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
              className="flex-1 rounded-2xl bg-slate-200 px-4 py-3 font-medium text-slate-950 disabled:opacity-50"
            >
              Restart run
            </button>
            <button
              type="button"
              onClick={() => void handleBankAndRestart()}
              disabled={loading || submitting}
              className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 font-medium text-slate-950 disabled:opacity-50"
            >
              Bank score
            </button>
          </div>

          {error ? <div className="text-sm text-rose-300">{error}</div> : null}
        </aside>
      </div>

      {gameOver ? (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 p-6 shadow-2xl">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Game Over
            </div>
            <h2 className="mt-2 text-3xl font-semibold">{score} points</h2>
            <p className="mt-3 text-sm text-slate-300">
              None of the current 3 pieces can be placed on the board.
            </p>

            <div className="mt-6 space-y-3">
              {rewardAvailable ? (
                <button
                  type="button"
                  onClick={() => void handleUseExtraMove()}
                  disabled={submitting}
                  className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-medium text-slate-950 disabled:opacity-50"
                >
                  Use extra move reward
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => void handleBankAndRestart()}
                disabled={submitting}
                className="w-full rounded-2xl bg-emerald-500 px-4 py-3 font-medium text-slate-950 disabled:opacity-50"
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
