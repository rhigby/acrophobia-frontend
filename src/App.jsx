// src/App.jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const socket = io("https://acrophobia-backend-2.onrender.com");
const ROOMS = Array.from({ length: 10 }, (_, i) => `room${i + 1}`);

export default function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [players, setPlayers] = useState([]);
  const [acronym, setAcronym] = useState("");
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

  useEffect(() => {
    socket.on("acronym", setAcronym);
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
      }
    });
    socket.on("entries", setEntries);
    socket.on("votes", setVotes);
    socket.on("scores", setScores);
    socket.on("round_number", setRound);
    socket.on("countdown", setCountdown);
    socket.on("players", setPlayers);
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
    socket.on("results_metadata", ({ timestamps }) => setResultsMeta(timestamps));

    return () => {
      socket.off("acronym");
      socket.off("phase");
      socket.off("entries");
      socket.off("votes");
      socket.off("scores");
      socket.off("round_number");
      socket.off("countdown");
      socket.off("players");
      socket.off("beep");
      socket.off("room_full");
      socket.off("entry_submitted");
      socket.off("vote_confirmed");
      socket.off("highlight_results");
      socket.off("results_metadata");
    };
  }, [username]);

  const joinRoom = (roomId) => {
    if (!username) return setError("Enter your name");
    socket.emit("join_room", { room: roomId, username });
    setRoom(roomId);
    setJoined(true);
    setError(null);
  };

  const submitEntry = () => {
    if (!submission) return;
    socket.emit("submit_entry", { room, username, text: submission });
    setSubmission("");
  };

  const voteEntry = (entryId) => {
    if (voteConfirmed) return;
    socket.emit("vote_entry", { room, username, entryId });
  };

  const sortedPlayers = [...players].sort((a, b) => (scores[b.username] || 0) - (scores[a.username] || 0));
  const bgColor = "bg-gradient-to-br from-black via-blue-900 to-black text-blue-200";

  if (!joined) {
    return (
      <div className="p-6 max-w-xl mx-auto min-h-screen bg-blue-950 text-white">
        <h1 className="text-3xl font-bold mb-4">🎮 Acrophobia Lobby</h1>
        <input
          className="border p-2 w-full mb-4 text-black"
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <h2 className="text-xl font-semibold mb-2">Select a Room</h2>
        <div className="grid grid-cols-2 gap-2">
          {ROOMS.map((r) => (
            <button
              key={r}
              onClick={() => joinRoom(r)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {r}
            </button>
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

      <div className="flex-1 p-6 relative">
        {countdown !== null && (
          <div className="fixed top-0 left-0 w-full h-2 bg-red-700">
            <motion.div
              key={countdown}
              className="h-full bg-red-400"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: countdown }}
            />
          </div>
        )}

        <AnimatePresence>
          {showOverlay && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white text-5xl font-bold z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Round {round}
            </motion.div>
          )}
        </AnimatePresence>

        <h2 className="text-2xl font-bold mb-2">Room: {room} — Round {round}</h2>

        <div className="flex justify-center mb-6">
          {acronym.split("").map((letter, i) => (
            <motion.div
              key={i}
              className="w-24 h-24 mx-1 bg-red-600 text-white text-5xl font-bold flex items-center justify-center rounded shadow-2xl border-2 border-blue-400"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: i * 0.2, type: "spring", stiffness: 120 }}
            >
              {letter}
            </motion.div>
          ))}
        </div>

        {/* Game UI continues... */}

      </div>
    </div>
  );
}















































