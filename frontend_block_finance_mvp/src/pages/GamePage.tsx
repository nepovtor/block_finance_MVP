import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { finishGameSession, startGameSession } from "../services/api";
import { useAppStore } from "../store/appStore";

export default function GamePage() {
  const { reward, addXP, gameSessionId, setGameSessionId, setReward } = useAppStore();
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function beginGame() {
      try {
        if (gameSessionId !== null) {
          return;
        }

        const session = await startGameSession();
        if (active) {
          setGameSessionId(session.session_id);
        }
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

    void beginGame();

    return () => {
      active = false;
    };
  }, [gameSessionId, setGameSessionId]);

  async function handleFinishGame() {
    if (gameSessionId === null) {
      setError("Game session is not ready yet");
      return;
    }

    try {
      setFinishing(true);
      setError("");
      const result = await finishGameSession(gameSessionId, score);
      addXP(result.xp_gained);
      setReward(null);
      setGameSessionId(null);
      window.alert(`Game finished. XP gained: ${result.xp_gained}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish game");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Block Puzzle</h1>
        <Link to="/dashboard" className="text-sm text-slate-300 underline">
          Back to dashboard
        </Link>
      </div>

      <div className="grid grid-cols-8 gap-1">
        {Array(64).fill(0).map((_, i) => (
          <button
            key={i}
            type="button"
            className="h-8 w-8 rounded bg-gray-700 transition hover:bg-emerald-500"
            onClick={() => setScore((current) => current + 1)}
          />
        ))}
      </div>

      <div>Session: {loading ? "Starting..." : gameSessionId ?? "Unavailable"}</div>

      <div>Score: {score}</div>

      <div>Reward ready: {reward ? reward.type : "None"}</div>

      <button
        className="rounded bg-red-500 px-4 py-2 disabled:opacity-50"
        disabled={loading || finishing}
        onClick={() => void handleFinishGame()}
      >
        {finishing ? "Finishing..." : "Finish"}
      </button>

      {error ? <div className="text-red-400">{error}</div> : null}
    </div>
  );
}
