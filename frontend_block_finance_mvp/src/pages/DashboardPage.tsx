import { useState } from "react";
import { makeDemoPayment } from "../services/api";
import { useAppStore } from "../store/appStore";

export default function DashboardPage() {
  const { user, reward, setReward } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCoffeePayment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await makeDemoPayment();

      if (response.reward_granted && response.reward) {
        setReward(response.reward);
      } else {
        setReward(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Hi, {user.name}</h1>

      <div className="rounded-2xl bg-slate-800 p-4">
        <div>Level: {user.level}</div>
        <div>XP: {user.xp}/{user.xpToNext}</div>
        <div>Streak: {user.streak} days</div>
      </div>

      <div className="rounded-2xl bg-slate-800 p-4">
        Reward: {reward ? `${reward.type} x${reward.value}` : "None"}
      </div>

      <button
        onClick={handleCoffeePayment}
        disabled={loading}
        className="rounded-2xl bg-emerald-500 px-4 py-3 font-medium text-black disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay for coffee"}
      </button>

      {error ? <div className="text-red-400">{error}</div> : null}
    </div>
  );
}