import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

const CountdownTimer = ({ expiryTimestamp }) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = +new Date(expiryTimestamp) - +new Date();
    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  }, [expiryTimestamp]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearTimeout(timer);
  }, [calculateTimeLeft, timeLeft]);

  const formatTime = (value) => String(value).padStart(2, "0");

  return (
    <div className="w-full mt-4 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold py-2 px-4 rounded-lg">
      <Clock className="w-4 h-4" />
      {Object.keys(timeLeft).length ? (
        <span>
          Next attempt in {formatTime(timeLeft.hours)}:
          {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
        </span>
      ) : (
        <span>Cooldown finished. Please refresh.</span>
      )}
    </div>
  );
};

export default CountdownTimer;