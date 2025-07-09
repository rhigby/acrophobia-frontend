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

  useEffect(() => {
    socket.on("acronym", setAcronym);
    socket.on("phase", (newPhase) => {
      setPhase(newPhase);
      if (newPhase === "submit") {
        setShowOverlay(true);
        setSubmission("");
        setSubmittedEntry(null);
        setShowResults(false);
        setTimeout(() => setShowOverlay(false), 2000);
      } else if (newPhase === "results") {
        setShowResults(true);
      } else if (newPhase === "intermission") {
        setShowResults(false);
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
      new Audio("/vote.mp3").play().catch(() => {});
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
          <div className="fixed top-4 right-4 bg-blue-900 text-white px-4 py-2 rounded-full text-lg shadow-lg z-50">
            ⏳ {countdown}s
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

        {phase === "submit" && (
          <div className="space-y-2">
            <input
              className="border border-blue-700 p-2 w-full text-xl bg-black text-blue-200"
              placeholder="Type your answer and press Enter..."
              value={submission}
              disabled={!!submittedEntry}
              onChange={(e) => setSubmission(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitEntry()}
            />
            <button
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              onClick={submitEntry}
              disabled={!!submittedEntry}
            >
              Submit
            </button>
            {submittedEntry && (
              <div className="text-green-400 mt-2">Submitted: “{submittedEntry}”</div>
            )}
          </div>
        )}

        {phase === "vote" && (
          <div className="space-y-2">
            <h4 className="font-semibold">Vote for your favorite:</h4>
            {entries.map((e) => (
              <button
                key={e.id}
                onClick={() => voteEntry(e.id)}
                className={`block w-full border rounded p-2 hover:bg-blue-900 text-left ${
                  votes[username] === e.id ? "bg-blue-800 border-blue-500" : "border-blue-700"
                }`}
              >
                {e.text}
              </button>
            ))}
          </div>
        )}

        {showResults && (
          <div className="space-y-2">
            <h4 className="font-semibold mb-2">Results:</h4>
            {entries.map((e) => {
              const timeStr = resultsMeta.find((m) => m.id === e.id)?.time;
              return (
                <motion.div
                  key={e.id}
                  className={`p-2 rounded border flex flex-col mb-2 ${
                    e.id === highlighted.winner
                      ? "border-yellow-400 bg-yellow-900"
                      : e.id === highlighted.fastest
                      ? "border-green-400 bg-green-900"
                      : "border-blue-700 bg-blue-950"
                  }`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="flex justify-between">
                    <span className="font-bold">{e.username}</span>
                    <span className="text-sm text-gray-300">
                      Votes: {votes[e.id] || 0} {timeStr ? `• ⏱ ${new Date(timeStr).toLocaleTimeString()}` : ""}
                    </span>
                  </div>
                  <div className="text-lg mt-1">{e.text}</div>
                </motion.div>
              );
            })}
          </div>
        )}

        {phase === "game_over" && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-green-300 mb-2">🏆 Game Over</h2>
            <h4 className="font-bold">Final Scores:</h4>
            <ul>
              {Object.entries(scores)
                .sort((a, b) => b[1] - a[1])
                .map(([player, score]) => (
                  <li key={player}>{player}: {score} pts</li>
                ))}
            </ul>
          </div>
        )}

        {phase === "waiting" && <p className="text-gray-400 italic">Waiting for next round...</p>}
        {phase === "intermission" && (
          <div className="text-center text-xl text-blue-400 mt-8">
            ⏳ Intermission... Next round begins in {countdown}s
          </div>
        )}
      </div>
    </div>
  );
}










































