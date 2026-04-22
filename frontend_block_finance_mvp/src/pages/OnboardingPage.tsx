
import { useNavigate } from "react-router-dom";

export default function OnboardingPage() {
  const nav = useNavigate();
  return (
    <div className="h-screen flex items-center justify-center">
      <button onClick={()=>nav("/dashboard")} className="bg-blue-500 px-6 py-3 rounded-xl">
        Start
      </button>
    </div>
  );
}
