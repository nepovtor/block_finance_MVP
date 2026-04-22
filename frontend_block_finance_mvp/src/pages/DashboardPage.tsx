import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile, makeDemoPayment } from "../services/api";
import { useAppStore } from "../store/appStore";

export default function DashboardPage() {
  const { user, reward, setReward, setUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await getProfile();
        if (active) {
          setUser(profile);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load profile");
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [setUser]);

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
        <div>Status: {profileLoading ? "Syncing profile..." : "Connected"}</div>
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

      <Link
        to="/game"
        className="block rounded-2xl border border-slate-600 px-4 py-3 text-center font-medium"
      >
        Go to game
      </Link>

      {error ? <div className="text-red-400">{error}</div> : null}
    </div>
  );
}
