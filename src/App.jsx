// src/App.jsx
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";

const socket = io("https://acrophobia-backend-2.onrender.com");
const ROOMS = Array.from({ length: 10 }, (_, i) => `room${i + 1}`);
const bgColor = "bg-gradient-to-br from-black via-blue-900 to-black text-blue-200";

export default function App() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [room, setRoom] = useState(null);
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [acronym, setAcronym] = useState("");
  const [phase, setPhase] = useState("waiting");
  const [entries, setEntries] = useState([]);
  const [submission, setSubmission] = useState("");
  const [submittedEntry, setSubmittedEntry] = useState(null);
  const [votes, setVotes] = useState({});
  const [voteConfirmed, setVoteConfirmed] = useState(false);
  const [scores, setScores] = useState({});
  const [highlighted, setHighlighted] = useState({});
  const [resultsMeta, setResultsMeta] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showAwards, setShowAwards] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [round, setRound] = useState(0);
  const [userStats, setUserStats] = useState(null);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    socket.on("acronym", setAcronym);
    socket.on("phase", (p) => {
      setPhase(p);
      if (p === "submit") {
        setShowOverlay(true);
        setSubmission("");
        setSubmittedEntry(null);
        setVoteConfirmed(false);
        setShowResults(false);
        setShowAwards(false);
        setTimeout(() => setShowOverlay(false), 2000);
      } else if (p === "results") {
        setShowResults(true);
        setTimeout(() => setShowAwards(true), 1500);
      } else if (p === "intermission") {
        setShowResults(false);
        setShowAwards(false);
      } else if (p === "next_round_overlay") {
        setShowOverlay(true);
        setTimeout(() => setShowOverlay(false), 10000);
      }
    });
    socket.on("entries", setEntries);
    socket.on("votes", setVotes);
    socket.on("scores", setScores);
    socket.on("players", setPlayers);
    socket.on("round_number", setRound);
    socket.on("countdown", setCountdown);
    socket.on("highlight_results", setHighlighted);
    socket.on("results_metadata", ({ timestamps }) => {
      setResultsMeta(timestamps.map(t => ({ ...t, time: parseFloat(t.time).toFixed(2) })));
    });
    socket.on("entry_submitted", ({ id, text }) => {
      setSubmittedEntry(text);
      new Audio("/submit.mp3").play().catch(() => {});
    });
    socket.on("vote_confirmed", (entryId) => {
      setVotes(v => ({ ...v, [username]: entryId }));
      setVoteConfirmed(true);
      new Audio("/submit.mp3").play().catch(() => {});
    });
    socket.on("user_stats", setUserStats);
    socket.on("room_full", () => setError("Room is full"));
    socket.on("beep", () => new Audio("/beep.mp3").play().catch(() => {}));

    return () => socket.removeAllListeners();
  }, [username]);

  const register = () => {
    if (!username || !email || !password) return setError("Fill in all fields");
    socket.emit("register", { username, email, password }, (res) => {
      if (res.success) {
        setIsAuthenticated(true);
        setError(null);
      } else {
        setError(res.message);
      }
    });
  };

  const login = () => {
    if (!username || !password) return setError("Fill in username and password");
    socket.emit("login", { username, password }, (res) => {
      if (res.success) {
        setIsAuthenticated(true);
        setError(null);
      } else {
        setError(res.message);
      }
    });
  };

  const joinRoom = (roomId) => {
    socket.emit("join_room", { room: roomId, username });
    setRoom(roomId);
    setJoined(true);
  };

  const submitEntry = () => {
    if (submission && !submittedEntry) {
      socket.emit("submit_entry", { room, username, text: submission });
    }
  };

  const voteEntry = (entryId) => {
    if (!voteConfirmed) {
      socket.emit("vote_entry", { room, username, entryId });
    }
  };

  const sortedPlayers = [...players].sort((a, b) => (scores[b.username] || 0) - (scores[a.username] || 0));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-blue-950 text-white p-6 flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold mb-4">🔐 {isRegistering ? "Register" : "Login"}</h1>
        {isRegistering && (
          <input className="p-2 text-black mb-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        )}
        <input className="p-2 text-black mb-2" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="p-2 text-black mb-4" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={isRegistering ? register : login} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
          {isRegistering ? "Register" : "Login"}
        </button>
        <button className="mt-2 text-sm underline" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? "Already have an account? Login" : "New? Register here"}
        </button>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-blue-950 text-white p-6">
        <h2 className="text-2xl font-bold mb-4">🎮 Select a Room</h2>
        <div className="grid grid-cols-2 gap-2">
          {ROOMS.map((r) => (
            <button key={r} onClick={() => joinRoom(r)} className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded">
              {r}
            </button>
          ))}
        </div>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${bgColor} font-mono relative`}>
      {showOverlay && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <motion.div className="text-4xl font-bold text-white" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            Get Ready!
          </motion.div>
        </div>
      )}
      <div className="w-1/4 p-4 border-r border-blue-800">
        <h2 className="text-xl font-bold mb-2">Players</h2>
        <ul>
          {sortedPlayers.map(p => (
            <li key={p.username} className="flex justify-between">
              <span>{p.username}</span>
              <span>{scores[p.username] || 0}</span>
            </li>
          ))}
        </ul>
        {userStats && (
          <div className="mt-4 text-sm">
            <h3 className="font-bold">Your Stats</h3>
            <ul className="space-y-1">
              <li>Games Played: {userStats.games_played}</li>
              <li>Total Points: {userStats.total_points}</li>
              <li>Wins: {userStats.total_wins}</li>
              <li>Fastest Time: {userStats.fastest_submission_ms || "–"} ms</li>
              <li>Votes for Winner: {userStats.voted_for_winner_count}</li>
            </ul>
          </div>
        )}
      </div>
      <div className="flex-1 p-6">
        <h2 className="text-xl mb-4">Room: {room} — Round {round}</h2>
        {countdown !== null && <div className="fixed top-4 right-4 text-5xl font-bold text-red-500 bg-black bg-opacity-60 px-4 py-2 rounded z-50">{countdown}</div>}

        {acronym && (
          <div className="flex justify-center mb-6 gap-4">
            {acronym.split("").map((letter, i) => (
              <motion.div key={i} className="w-20 h-20 bg-red-600 text-white text-4xl font-bold flex items-center justify-center rounded-lg border-4 border-blue-400 shadow-xl"
                initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
                {letter}
              </motion.div>
            ))}
          </div>
        )}

        {phase === "submit" && (
          <div className="space-y-2">
            <input className="border border-blue-700 p-2 w-full text-xl bg-black text-blue-200" value={submission} onChange={e => setSubmission(e.target.value)} onKeyDown={e => e.key === "Enter" && submitEntry()} disabled={!!submittedEntry} placeholder="Type your answer and press Enter..." />
            <button className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={submitEntry} disabled={!!submittedEntry}>Submit</button>
            {submittedEntry && <div className="text-green-400 mt-2">Submitted: “{submittedEntry}”</div>}
          </div>
        )}

        {phase === "vote" && (
          <div className="space-y-2">
            <h4 className="font-semibold">Vote for your favorite:</h4>
            {entries.map((e) => (
              <button key={e.id} onClick={() => voteEntry(e.id)} className={`block w-full border rounded p-2 hover:bg-blue-900 text-left ${votes[username] === e.id ? "bg-blue-800 border-blue-500" : "border-blue-700"}`}>
                {e.text}
              </button>
            ))}
          </div>
        )}

        {showResults && (
          <div className="space-y-2 mt-4">
            <h4 className="font-semibold mb-2">Results:</h4>
            {entries.map((e) => {
              const timeMeta = resultsMeta.find(m => m.id === e.id);
              const seconds = timeMeta ? `${timeMeta.time}s` : "";
              return (
                <motion.div key={e.id} className={`p-2 rounded border flex flex-col mb-2 ${e.id === highlighted.winner ? "border-yellow-400 bg-yellow-900 animate-pulse" : e.id === highlighted.fastest ? "border-green-400 bg-green-900 animate-pulse" : "border-blue-700 bg-blue-950"}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{e.username}</span>
                      {e.id === highlighted.winner && <span className="text-yellow-300">🏁</span>}
                      {e.id === highlighted.fastest && <span className="text-green-300">⏱</span>}
                      {highlighted.voters?.includes(e.username) && <span className="text-blue-300">👍</span>}
                    </div>
                    <span className="text-sm text-gray-300">Votes: {votes[e.id] || 0} {seconds && `• ${seconds}`}</span>
                  </div>
                  <div className="text-lg mt-1">{e.text}</div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}























































