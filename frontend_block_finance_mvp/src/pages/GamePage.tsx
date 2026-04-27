import { useEffect, useMemo, useState } from "react";
import { DragGhost } from "../components/game/DragGhost";
import { GameBoard } from "../components/game/GameBoard";
import { GameHeader } from "../components/game/GameHeader";
import { GameOverModal } from "../components/game/GameOverModal";
import { PieceTray } from "../components/game/PieceTray";
import {
  CLEAR_ANIMATION_MS,
  useClearedCellEffects,
} from "../hooks/useClearedCellEffects";
import { useGameDrag } from "../hooks/useGameDrag";
import {
  getProfile,
  finishGameSession,
  getLeaderboard,
  startGameSession,
  useReward,
  type LeaderboardEntry,
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
import { t } from "../i18n/translations";
import { useAppStore } from "../store/appStore";

function getPreviewState(
  board: Board,
  piece: Piece | null,
  originCell: { row: number; col: number } | null
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

function formatGameDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function GamePage() {
  const {
    reward,
    addXP,
    gameSessionId,
    setGameSessionId,
    setReward,
    setUser,
    language,
  } = useAppStore();

  const [board, setBoard] = useState<Board>(() => createBoard());
  const [pieces, setPieces] = useState<Piece[]>(() => createPieceBatch());
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [movesUsed, setMovesUsed] = useState(0);
  const [extraMovesUsed, setExtraMovesUsed] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [runStartedAtMs, setRunStartedAtMs] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [statusText, setStatusText] = useState(() => t("game.pickShape", language));
  const [scorePulse, setScorePulse] = useState(false);
  const [boardFlash, setBoardFlash] = useState(false);
  const [invalidMovePulse, setInvalidMovePulse] = useState(false);

  const selectedPiece =
    pieces.find((piece) => piece.instanceId === selectedPieceId) ?? null;
  const {
    boardRef,
    dragGhostRef,
    dragState,
    dragOriginCell,
    handlePiecePointerDown,
    handlePiecePointerMove,
    handlePiecePointerUp,
    handlePiecePointerCancel,
    handlePieceClick,
    clearHoveredCell,
    resetDragState,
  } = useGameDrag({
    pieces,
    setSelectedPieceId,
    placePieceOnBoard,
  });
  const {
    clearedCellEffects,
    setClearedCellEffects,
    buildClearedCellEffects,
  } = useClearedCellEffects(board);
  const draggedPiece =
    pieces.find((piece) => piece.instanceId === dragState?.pieceId) ?? null;

  const preview = useMemo(
    () => getPreviewState(board, draggedPiece ?? selectedPiece, dragOriginCell),
    [board, draggedPiece, dragOriginCell, selectedPiece]
  );

  const rewardAvailable = reward?.type === "extra_move" && reward.value > 0;

  useEffect(() => {
    const documentElementStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const previousHtmlOverflow = documentElementStyle.overflow;
    const previousHtmlOverscrollBehavior = documentElementStyle.overscrollBehavior;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousBodyOverscrollBehavior = bodyStyle.overscrollBehavior;
    const previousBodyTouchAction = bodyStyle.touchAction;

    documentElementStyle.overflow = "hidden";
    documentElementStyle.overscrollBehavior = "none";
    bodyStyle.overflow = "hidden";
    bodyStyle.overscrollBehavior = "none";
    bodyStyle.touchAction = "none";

    return () => {
      documentElementStyle.overflow = previousHtmlOverflow;
      documentElementStyle.overscrollBehavior = previousHtmlOverscrollBehavior;
      bodyStyle.overflow = previousBodyOverflow;
      bodyStyle.overscrollBehavior = previousBodyOverscrollBehavior;
      bodyStyle.touchAction = previousBodyTouchAction;
    };
  }, []);

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
        setComboStreak(0);
        setRunStartedAtMs(Date.now());
        setElapsedSeconds(0);
        setGameOver(false);
        setError("");
        setStatusText(t("game.freshRunStarted", language));
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : t("error.failedToStartGame", language));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void beginGameSession();
    return () => {
      active = false;
    };
  }, [language, setGameSessionId, setReward, setUser]);

  useEffect(() => {
    if (!loading && !hasAnyValidMove(board, pieces)) {
      setGameOver(true);
      setStatusText(t("game.noValidPlacements", language));
    }
  }, [board, language, loading, pieces]);

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
    if (loading || gameOver) return;

    const updateElapsedSeconds = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - runStartedAtMs) / 1000)));
    };

    updateElapsedSeconds();
    const intervalId = window.setInterval(updateElapsedSeconds, 1000);

    return () => window.clearInterval(intervalId);
  }, [gameOver, loading, runStartedAtMs]);

  async function refreshLeaderboard() {
    try {
      const result = await getLeaderboard(10);
      setLeaderboard(result.leaders);
    } catch (err) {
      console.error("[Game] Failed to load leaderboard", err);
    }
  }

  useEffect(() => {
    void refreshLeaderboard();
  }, []);

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
    void refreshLeaderboard();
    return result;
  }

  async function startFreshRun() {
    const fresh = buildFreshGameState();
    try {
      const session = await startGameSession();
      setGameSessionId(session.session_id);
    } catch {
      setGameSessionId(null);
    }
    setBoard(fresh.board);
    setPieces(fresh.pieces);
    setSelectedPieceId(fresh.selectedPieceId);
    resetDragState();
    setScore(0);
    setMovesUsed(0);
    setExtraMovesUsed(0);
    setComboStreak(0);
    setRunStartedAtMs(Date.now());
    setElapsedSeconds(0);
    setGameOver(false);
    setError("");
    setStatusText(t("game.freshRunStarted", language));
  }

  async function handleRestart() {
    let bankError = "";

    try {
      setSubmitting(true);
      setError("");
      try {
        await bankCurrentRun();
      } catch (err) {
        bankError =
          err instanceof Error
            ? err.message
            : t("error.failedToSavePreviousRun", language);
      }
      await startFreshRun();
      if (bankError) {
        setError(bankError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.failedToRestartGame", language));
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
      setComboStreak(0);
      setExtraMovesUsed((current) => current + 1);
      setStatusText(t("game.extraMoveUsed", language));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.failedToUseExtraMove", language));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBankAndRestart() {
    let bankError = "";

    try {
      setSubmitting(true);
      setError("");
      try {
        await bankCurrentRun();
      } catch (err) {
        bankError = err instanceof Error ? err.message : t("error.failedToSaveRun", language);
      }
      await startFreshRun();
      if (bankError) {
        setError(bankError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.failedToStartFreshRun", language));
    } finally {
      setSubmitting(false);
    }
  }

  function placePieceOnBoard(piece: Piece | null, row: number, col: number) {
    if (!piece) {
      setError(t("game.selectPieceFirst", language));
      setInvalidMovePulse(true);
      return false;
    }

    if (!canPlaceShape(board, piece.shape, row, col)) {
      setError(t("game.pieceDoesNotFit", language));
      setInvalidMovePulse(true);
      return false;
    }

    setError("");
    const move = placeShape(board, piece.shape, row, col);
    const clearedLineCount = move.clearedRows.length + move.clearedCols.length;
    const nextComboStreak = clearedLineCount > 0 ? comboStreak + 1 : 0;
    const comboBonus =
      nextComboStreak === 3 ? 100 : nextComboStreak > 3 ? 150 : 0;
    const remainingPieces = pieces.filter(
      (currentPiece) => currentPiece.instanceId !== piece.instanceId
    );
    const nextPieces =
      remainingPieces.length === 0 ? createPieceBatch() : remainingPieces;

    setBoard(move.board);
    setScore((current) => current + move.scoreGained + comboBonus);
    setMovesUsed((current) => current + 1);
    setComboStreak(nextComboStreak);
    setPieces(nextPieces);
    setSelectedPieceId(nextPieces[0]?.instanceId ?? null);
    clearHoveredCell();
    setScorePulse(true);
    setClearedCellEffects(buildClearedCellEffects(move, piece));

    if (move.clearedRows.length > 0 || move.clearedCols.length > 0) {
      setBoardFlash(true);
      setStatusText(
        comboBonus > 0
          ? t("game.comboStatus", language, {
              combo: nextComboStreak,
              bonus: comboBonus,
              rows: move.clearedRows.length,
              cols: move.clearedCols.length,
            })
          : t("game.cleanClearStatus", language, {
              rows: move.clearedRows.length,
              cols: move.clearedCols.length,
            })
      );
    } else {
      setStatusText(
        t("game.placedShape", language, {
          shape: piece.shape.name,
          score: move.scoreGained,
        })
      );
    }

    return true;
  }

  function handleBoardClick(row: number, col: number) {
    placePieceOnBoard(selectedPiece, row, col);
  }

  const previewCellMap = new Map(
    preview.cells.map((cell) => [`${cell.row}-${cell.col}`, preview.valid])
  );
  const clearedCellMap = new Map(
    clearedCellEffects.map((cell) => [`${cell.row}-${cell.col}`, cell])
  );
  const draggedBounds = draggedPiece ? getShapeBounds(draggedPiece.shape) : null;
  const formattedElapsed = formatGameDuration(elapsedSeconds);
  const timeLabel = language === "ru" ? "Время" : "Time";

  return (
    <div className="game-screen bg-[radial-gradient(circle_at_top,_#1e3359_0%,_#0d1528_46%,_#050a14_100%)] text-white">
      <style>{`
        @keyframes line-clear-bloom {
          0% { opacity: 1; transform: scale(1); filter: saturate(1); }
          55% { opacity: 1; transform: scale(1.12); filter: saturate(1.35) brightness(1.15); }
          100% { opacity: 0; transform: scale(0.62); filter: blur(10px) brightness(1.4); }
        }

        @keyframes line-clear-sweep {
          0% { opacity: 1; transform: translateX(0) scaleX(1); }
          60% { opacity: 1; transform: translateX(4px) scaleX(1.08); }
          100% { opacity: 0; transform: translateX(16px) scaleX(0.25); filter: blur(8px); }
        }

        @keyframes line-clear-drop {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          45% { opacity: 1; transform: translateY(2px) scale(1.06); }
          100% { opacity: 0; transform: translateY(18px) scale(0.72); filter: blur(9px); }
        }

        @keyframes line-clear-shrink {
          0% { opacity: 1; transform: rotate(0deg) scale(1); }
          50% { opacity: 1; transform: rotate(6deg) scale(0.92); }
          100% { opacity: 0; transform: rotate(-10deg) scale(0.18); filter: blur(7px); }
        }

        .line-clear-0 { animation: line-clear-bloom ${CLEAR_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .line-clear-1 { animation: line-clear-sweep ${CLEAR_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards; transform-origin: left center; }
        .line-clear-2 { animation: line-clear-drop ${CLEAR_ANIMATION_MS}ms ease-in forwards; }
        .line-clear-3 { animation: line-clear-shrink ${CLEAR_ANIMATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
      <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden px-3 pb-40 pt-3">
        <GameHeader
          score={score}
          scorePulse={scorePulse}
          rewardAvailable={rewardAvailable}
          rewardValue={reward?.value}
          statusText={statusText}
          language={language}
        />

        <main className="flex flex-1 flex-col">
          <div className="mb-3 grid grid-cols-3 items-center gap-2 px-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
            <span>{t("game.movesCount", language, { value: movesUsed })}</span>
            <span className="text-center text-emerald-100/80">
              {timeLabel} {formattedElapsed}
            </span>
            <span className="text-right">
              {loading
                ? t("game.starting", language)
                : t("game.session", language, {
                    value: gameSessionId ?? t("game.offline", language),
                  })}
            </span>
          </div>

          <GameBoard
            board={board}
            boardRef={boardRef}
            boardFlash={boardFlash}
            invalidMovePulse={invalidMovePulse}
            previewCellMap={previewCellMap}
            clearedCellMap={clearedCellMap}
            language={language}
            handleBoardClick={handleBoardClick}
          />
        </main>

        {!gameOver ? (
          <PieceTray
            pieces={pieces}
            selectedPieceId={selectedPieceId}
            dragPieceId={dragState?.pieceId}
            loading={loading}
            submitting={submitting}
            gameOver={gameOver}
            language={language}
            handlePieceClick={handlePieceClick}
            handlePiecePointerDown={handlePiecePointerDown}
            handlePiecePointerMove={handlePiecePointerMove}
            handlePiecePointerUp={handlePiecePointerUp}
            handlePiecePointerCancel={handlePiecePointerCancel}
            handleRestart={() => void handleRestart()}
            handleBankAndRestart={() => void handleBankAndRestart()}
          />
        ) : null}

        {dragState && draggedPiece && draggedBounds ? (
          <DragGhost
            piece={draggedPiece}
            width={draggedBounds.width}
            height={draggedBounds.height}
            dragGhostRef={dragGhostRef}
          />
        ) : null}

        {gameOver ? (
          <GameOverModal
            score={score}
            movesUsed={movesUsed}
            extraMovesUsed={extraMovesUsed}
            elapsedSeconds={elapsedSeconds}
            rewardAvailable={rewardAvailable}
            submitting={submitting}
            language={language}
            leaderboard={leaderboard}
            onRestart={() => void handleRestart()}
            onUseExtraMove={() => void handleUseExtraMove()}
            onBankAndRestart={() => void handleBankAndRestart()}
          />
        ) : null}
      </div>
    </div>
  );
}
