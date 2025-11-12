import { ShieldCheck, Zap, Code } from "lucide-react";
import CountdownTimer from "./CountdownTimer";

const SkillsTab = ({ skills, onStartVerification, onStartTest }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {skills.map((s) => {
        const MAX_ATTEMPTS = 3;
        const attemptsLeft = MAX_ATTEMPTS - (s.attempt_count || 0);
        const isOnCooldown =
          s.cooldown_until && new Date(s.cooldown_until) > new Date();
        return (
          <div
            key={s.id}
            className="p-4 rounded-xl shadow-md bg-slate-50 dark:bg-slate-700/50 flex flex-col justify-between transition-shadow hover:shadow-lg"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">
                  {s.name}
                </h3>
                {s.is_verified && (
                  <div className="flex items-center text-xs bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300 px-2 py-1 rounded-full font-medium">
                    <ShieldCheck className="w-4 h-4 mr-1" /> Verified
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Category: {s.category} | Level: {s.level}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Points: {s.points || 0}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
              {!s.is_verified ? (
                isOnCooldown ? (
                  <CountdownTimer expiryTimestamp={s.cooldown_until} />
                ) : (
                  <div className="text-center">
                    <button
                      onClick={() => onStartVerification(s)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 transition-transform transform hover:scale-105"
                    >
                      <Zap className="w-4 h-4" /> Verify Skill (Quiz)
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {attemptsLeft} of {MAX_ATTEMPTS} attempts remaining
                    </p>
                  </div>
                )
              ) : (
                s.level !== "Advanced" && (
                  <button
                    onClick={() => onStartTest(s)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    <Code className="w-4 h-4" /> Start Practical Test
                  </button>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SkillsTab;