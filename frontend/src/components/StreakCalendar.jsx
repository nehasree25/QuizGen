import { useEffect, useState } from "react";
import { authFetch } from "../utils/auth";
import "./StreakCalendar.css";
import Navbar from '../components/Navbar';
function StreakCalendar() {
  const [data, setData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authFetch("/streak/");
        const result = await res.json();
        setData(result.week || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  // 📅 get month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];

  // empty slots
  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }

  // actual days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

    const active = data.find((d) => d.date === dateStr)?.active;

    daysArray.push({ day: i, active });
  }

  const changeMonth = (dir) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  return (
    <>
        <Navbar/>
        <div className="calendar-container">
        <div className="calendar-header">
            <button onClick={() => changeMonth(-1)}>◀</button>
            <h2>
            {currentDate.toLocaleString("default", { month: "long" })} {year}
            </h2>
            <button onClick={() => changeMonth(1)}>▶</button>
        </div>

        <div className="calendar-grid">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="day-name">{d}</div>
            ))}

            {daysArray.map((d, i) => (
            <div key={i} className="day-cell">
                {d ? (
                <>
                    <span>{d.day}</span>
                    <div className="emoji">
                        {(() => {
                            const today = new Date();
                            const cellDate = new Date(year, month, d.day);

                            if (cellDate > today) return "";       // 🚫 future → nothing
                            if (d.active) return "🔥";             // 🔥 active
                            return "😴";                           // 😴 past inactive
                        })()}
                    </div>
                </>
                ) : ""}
            </div>
            ))}
        </div>
        </div>
    </>
    
  );
}

export default StreakCalendar;