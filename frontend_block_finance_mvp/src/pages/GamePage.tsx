
import { useState } from "react";
import { useAppStore } from "../store/appStore";

export default function GamePage() {
  const { reward, addXP } = useAppStore();
  const [score, setScore] = useState(0);

  return (
    <div className="p-4">
      <h1>Game</h1>
      <div className="grid grid-cols-8 gap-1">
        {Array(64).fill(0).map((_,i)=>(
          <div key={i} className="w-8 h-8 bg-gray-700"/>
        ))}
      </div>

      <div className="mt-4">
        Score: {score}
      </div>

      <div className="mt-4">
        Reward: {reward ? reward.type : "None"}
      </div>

      <button
        className="mt-4 bg-red-500 px-4 py-2 rounded"
        onClick={()=>{
          addXP(score);
          alert("Game Over");
        }}
      >
        Finish
      </button>
    </div>
  );
}
