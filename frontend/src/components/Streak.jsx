import { useEffect, useState } from "react";
import { authFetch } from "../utils/auth";

function Streak() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      const res = await authFetch("/streak/");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching streak:", err);
    }
  };

  if (!data) return null;

  return (
    <div className="streak-card">
      <h3>🔥 Current Streak: {data.streak} days</h3>

      <div className="streak-days">
        {data.week.map((day, index) => (
          <div key={index} className="streak-day">
            <div className="emoji">
              {day.active ? "🔥" : "😴"}
            </div>
            <small>{day.date.slice(5)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Streak;