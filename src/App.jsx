// src/App.jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";

const socket = io("https://acrophobia-backend-2.onrender.com");
const ROOMS = Array.from({ length: 10 }, (_, i) => `room${i + 1}`);
const bgColor = "bg-gradient-to-br from-black via-blue-900 to-black text-blue-200";

export default function App() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [room, setRoom] = useState(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [players, setPlayers] = useState([]);
  const [acronym, setAcronym] = useState("");
  const [revealedLetters, setRevealedLetters] = useState([]);
  const [entries, setEntries] = useState([]);
  const [submission, setSubmission] = useState("");
  const [phase, setPhase] = useState("waiting");
  const [votes, setVotes] = useState({});
  const [scores, setScores] = useState({});
  const [countdown, setCountdown] = useState(null);
  const [round, setRound] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [submittedEntry, setSubmittedEntry] = useState(null);
  const [highlighted, setHighlighted] = useState({});
  const [resultsMeta, setResultsMeta] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [voteConfirmed, setVoteConfirmed] = useState(false);
  const [showAwards, setShowAwards] = useState(false);
  const [userStats, setUserStats] = useState(null);

  const sortedPlayers = [...players].sort((a, b) => (scores[b.username] || 0) - (scores[a.username] || 0));

  const submitEntry = () => {
    if (!submission) return;
    socket.emit("submit_entry", { room, username, text: submission });
    setSubmission("");
  };

  const voteEntry = (entryId) => {
    socket.emit("vote_entry", { room, username, entryId });
  };

  const joinRoom = (roomId) => {
    if (!username) return setError("Enter your name");
    socket.emit("join_room", { room: roomId, username });
    setRoom(roomId);
    setJoined(true);
    setError(null);
  };

  useEffect(() => {
    socket.on("acronym", (partial) => {
      setAcronym(partial);
      setRevealedLetters(partial.split(""));
      new Audio("/beep.mp3").play().catch(() => {});
    });

    socket.on("phase", (newPhase) => {
      setPhase(newPhase);
      if (newPhase === "submit") {
        setShowOverlay(true);
        setSubmission("");
        setSubmittedEntry(null);
        setVoteConfirmed(false);
        setShowResults(false);
        setShowAwards(false);
        setTimeout(() => setShowOverlay(false), 2000);
      } else if (newPhase === "results") {
        setShowResults(true);
        setTimeout(() => setShowAwards(true), 1500);
      } else if (newPhase === "intermission") {
        setShowResults(false);
        setShowAwards(false);
      } else if (newPhase === "next_round_overlay") {
        setShowOverlay(true);
        setTimeout(() => setShowOverlay(false), 10000);
      }
    });

    socket.on("entries", setEntries);
    socket.on("votes", setVotes);
    socket.on("scores", setScores);
    socket.on("round_number", setRound);
    socket.on("countdown", setCountdown);
    socket.on("players", setPlayers);
    socket.on("user_stats", setUserStats);
    socket.on("beep", () => new Audio("/beep.mp3").play().catch(() => {}));
    socket.on("room_full", () => setError("Room is full"));
    socket.on("entry_submitted", ({ id, text }) => {
      setSubmittedEntry(text);
      new Audio("/submit.mp3").play().catch(() => {});
    });
    socket.on("vote_confirmed", (entryId) => {
      setVotes((v) => ({ ...v, [username]: entryId }));
      setVoteConfirmed(true);
      new Audio("/submit.mp3").play().catch(() => {});
    });
    socket.on("highlight_results", setHighlighted);
    socket.on("results_metadata", ({ timestamps }) => {
      const fixed = timestamps.map((entry) => ({
        ...entry,
        time: ((entry.time || 0) / 1000).toFixed(2),
      }));
      setResultsMeta(fixed);
    });

    return () => socket.removeAllListeners();
  }, [username]);

  const login = () => {
    if (!username || !password) return setError("Enter username and password");
    socket.emit("login", { username, password }, (res) => {
      if (res.success) {
        setIsAuthenticated(true);
        setError(null);
      } else {
        setError(res.message || "Login failed");
      }
    });
  };

  const register = () => {
    if (!username || !email || !password) return setError("All fields required");
    socket.emit("register", { username, email, password }, (res) => {
      if (res.success) {
        setIsAuthenticated(true);
        setError(null);
      } else {
        setError(res.message || "Registration failed");
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-sm mx-auto min-h-screen flex flex-col justify-center bg-blue-950 text-white">
        <h1 className="text-3xl font-bold mb-6 text-center">🔐 {mode === "login" ? "Login" : "Register"}</h1>
        {mode === "register" && (
          <input className="border p-2 w-full mb-4 text-black" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
        <input className="border p-2 w-full mb-4 text-black" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="border p-2 w-full mb-4 text-black" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={mode === "login" ? login : register} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          {mode === "login" ? "Login" : "Register"}
        </button>
        <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="mt-2 underline text-sm text-blue-300">
          {mode === "login" ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="p-6 max-w-xl mx-auto min-h-screen bg-blue-950 text-white">
        <h1 className="text-3xl font-bold mb-4">🎮 Acrophobia Lobby</h1>
        <h2 className="text-xl font-semibold mb-2">Select a Room</h2>
        <div className="grid grid-cols-2 gap-2">
          {ROOMS.map((r) => (
            <button key={r} onClick={() => joinRoom(r)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">{r}</button>
          ))}
        </div>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${bgColor} font-mono`}>
      <div className="w-1/4 p-4 border-r border-blue-800">
        <h2 className="text-xl font-bold mb-2">Players</h2>
        <ul>
          {sortedPlayers.map((p) => (
            <li key={p.username} className="mb-1 flex justify-between">
              <span>{p.username}</span>
              <span className="font-semibold">{scores[p.username] || 0}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 p-6">
        <h2 className="text-xl mb-4">Room: {room} — Round {round}</h2>
        {countdown !== null && (
          <div className="fixed top-4 right-4 text-5xl font-bold text-red-500 bg-black bg-opacity-60 px-4 py-2 rounded shadow-lg z-50">{countdown}</div>
        )}

        {revealedLetters.length > 0 && (
          <div className="flex justify-center mb-6 gap-4">
            {revealedLetters.map((letter, i) => (
              <motion.div
                key={i}
                className="w-20 h-20 bg-red-600 text-white text-4xl font-bold flex items-center justify-center rounded-lg border-4 border-blue-400 shadow-xl"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ delay: 0.2 * i, type: "spring", stiffness: 200 }}
              >
                {letter}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
























































