import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import "../App.css";

function Home() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    incomplete: 0,
    scores: [],
    maxScore: 0,
    minScore: 0,
    averageScore: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { authFetch } = await import("../utils/auth");
        const resp = await authFetch("/quiz-history/");
        if (!resp.ok) {
          console.error("Failed to fetch quiz history for stats", resp.status);
          return;
        }

        const data = await resp.json();
        const quizzes = Array.isArray(data) ? data : data.results || [];

        const total = quizzes.length;
        const completed = quizzes.filter(
          (q) =>
            q.completed || (q.status && q.status.toLowerCase() === "completed")
        ).length;
        const incomplete = total - completed;

        const scoresList = quizzes
          .filter((q) => q.score !== null && q.score !== undefined)
          .map((q, index) => ({
            quiz: `Quiz ${index + 1}`,
            score: q.score,
          }));

        const maxScore = scoresList.length
          ? Math.max(...scoresList.map((s) => s.score))
          : 0;
        const minScore = scoresList.length
          ? Math.min(...scoresList.map((s) => s.score))
          : 0;
        const averageScore = scoresList.length
          ? parseFloat(
              (
                scoresList.reduce((sum, s) => sum + s.score, 0) /
                scoresList.length
              ).toFixed(1)
            )
          : 0;

        setStats({
          total,
          completed,
          incomplete,
          scores: scoresList,
          maxScore,
          minScore,
          averageScore,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const pieData = [
    { name: "Completed", value: stats.completed },
    { name: "Incomplete", value: stats.incomplete },
  ];

  const COLORS = ["#00C49F", "#8884d8"];

  return (
    <div className="home">
      <Navbar />
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard</h1>

        {loading ? (
          <p>Loading statistics...</p>
        ) : (
          <>
            {/* ===== Summary Stats Section ===== */}
            <div className="stats-container">
              <div className="stat-card">
                <p>Total Quizzes</p>
                <h2>{stats.total}</h2>
              </div>
              <div className="stat-card">
                <p>Completed</p>
                <h2>{stats.completed}</h2>
              </div>
              <div className="stat-card">
                <p>Incomplete</p>
                <h2>{stats.incomplete}</h2>
              </div>
              <div className="stat-card">
                <p>Highest Score</p>
                <h2>{stats.maxScore}%</h2>
              </div>
              <div className="stat-card">
                <p>Lowest Score</p>
                <h2>{stats.minScore}%</h2>
              </div>
              <div className="stat-card">
                <p>Average Score</p>
                <h2>{stats.averageScore}%</h2>
              </div>
            </div>

            {/* ===== Charts Section ===== */}
            <div className="charts-container">
              {/* ===== Line Chart (Performance Overview) ===== */}
              <div className="chart-box">
                <h3>Performance Overview</h3>
                {stats.scores && stats.scores.length ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart
                      data={stats.scores}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      {/* Hidden X-axis (no names shown) */}
                      <XAxis dataKey="quiz" tick={false} axisLine={false} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#8884d8"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    className="performance-stats"
                    style={{
                      padding: "2rem",
                      textAlign: "left",
                      color: "#666",
                    }}
                  >
                    <h4>Quiz Performance Statistics</h4>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      <li>Highest Score - {stats.maxScore}%</li>
                      <li>Lowest Score - {stats.minScore}%</li>
                      <li>Average Score - {stats.averageScore}%</li>
                      <li>Quizzes Completed - {stats.completed}</li>
                    </ul>
                    <p style={{ marginTop: "1rem", fontStyle: "italic" }}>
                      {stats.completed === 0
                        ? "Complete your first quiz to see your performance!"
                        : "Keep up the good work on your quiz journey!"}
                    </p>
                  </div>
                )}
              </div>

              {/* ===== Pie Chart (Completion) ===== */}
              <div className="chart-box">
                <h3>Quiz Completion</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
