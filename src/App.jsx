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
  const [submittedText, setSubmittedText] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [phase, setPhase] = useState("waiting");
  const [votes, setVotes] = useState({});
  const [scores, setScores] = useState({});
  const [countdown, setCountdown] = useState(null);
  const [round, setRound] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [voteConfirmed, setVoteConfirmed] = useState(false);
  const [votedEntryId, setVotedEntryId] = useState(null);
  const [highlightInfo, setHighlightInfo] = useState({});

  useEffect(() => {
    socket.on("acronym", setAcronym);
    socket.on("phase", (newPhase) => {
      setPhase(newPhase);
      if (newPhase === "submit") {
        setHasSubmitted(false);
        setSubmittedText("");
        setVoteConfirmed(false);
        setVotedEntryId(null);
        setShowOverlay(true);
        setHighlightInfo({});
        setTimeout(() => setShowOverlay(false), 2000);
      }
    });
    socket.on("entries", setEntries);
    socket.on("votes", setVotes);
    socket.on("scores", setScores);
    socket.on("round_number", setRound);
    socket.on("countdown", setCountdown);
    socket.on("players", setPlayers);
    socket.on("beep", () => {
      const beep = new Audio("/beep.mp3");
      beep.play().catch(() => {});
    });
    socket.on("room_full", () => setError("Room is full"));
    socket.on("entry_submitted", () => setHasSubmitted(true));
    socket.on("vote_confirmed", () => setVoteConfirmed(true));
    socket.on("highlight_results", setHighlightInfo);

    return () => socket.disconnect();
  }, []);

  const joinRoom = (roomId) => {
    if (!username) return setError("Enter your name");
    socket.emit("join_room", { room: roomId, username });
    setRoom(roomId);
    setJoined(true);
    setError(null);
  };

  const submitEntry = () => {
    if (!submission) return;
    const submitSound = new Audio("/submit.mp3");
    submitSound.play().catch(() => {});
    socket.emit("submit_entry", { room, username, text: submission });
    setSubmittedText(submission);
    setSubmission("");
  };

  const voteEntry = (entryId) => {
    const voteSound = new Audio("/vote.mp3");
    voteSound.play().catch(() => {});
    socket.emit("vote_entry", { room, username, entryId });
    setVotedEntryId(entryId);
  };

  const sortedPlayers = [...players].sort((a, b) => (scores[b.username] || 0) - (scores[a.username] || 0));

  if (!joined) {
    return (
      <div className="p-6 max-w-xl mx-auto min-h-screen bg-blue-50">
        <h1 className="text-3xl font-bold mb-4">🎮 Acrophobia Lobby</h1>
        <input
          className="border p-2 w-full mb-4"
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
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              {r}
            </button>
          ))}
        </div>
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-blue-50">
      <div className="w-1/4 bg-white border-r p-4">
        <h2 className="text-xl font-bold mb-2">Players</h2>
        <ul>
          {sortedPlayers.map((p) => (
            <motion.li
              key={p.username}
              layout
              className="mb-1 flex justify-between"
            >
              <span>{p.username}</span>
              <span className="font-semibold">{scores[p.username] || 0}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="flex-1 p-6 relative">
        {countdown !== null && (
          <div className="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded-full text-lg shadow-lg z-50">
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
              className="w-24 h-24 mx-1 bg-blue-600 text-white text-5xl font-bold flex items-center justify-center rounded shadow-lg"
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
              className="border p-2 w-full text-xl"
              placeholder="Enter your acronym meaning..."
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitEntry()}
              disabled={hasSubmitted}
            />
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={submitEntry}
              disabled={hasSubmitted}
            >
              Submit
            </button>
            {hasSubmitted && submittedText && (
              <motion.p
                className="text-green-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Submitted: {submittedText}
              </motion.p>
            )}
          </div>
        )}

        {phase === "vote" && (
          <div className="space-y-2">
            <h4 className="font-semibold">Vote for your favorite:</h4>
            {entries.map((e, idx) => (
              <motion.button
                key={idx}
                className={`block w-full border rounded p-2 hover:bg-gray-100 ${votedEntryId === e.id ? "bg-blue-100 border-blue-500" : ""}`}
                onClick={() => voteEntry(e.id)}
                disabled={voteConfirmed}
                whileTap={{ scale: 0.97 }}
              >
                <span>{e.text}</span>
              </motion.button>
            ))}
            {voteConfirmed && <p className="text-blue-600">✅ Vote submitted!</p>}
          </div>
        )}

        {phase === "results" && (
          <div className="space-y-2">
            <h4 className="font-semibold">Results:</h4>
            {entries.map((e, idx) => {
              const classes = ["border", "rounded", "p-2", "flex", "justify-between"];
              if (highlightInfo.fastest === e.id) classes.push("bg-yellow-100");
              if (highlightInfo.winner === e.id) classes.push("bg-green-100");
              if (highlightInfo.voters?.includes(username) && highlightInfo.winner === e.id) classes.push("border-blue-500");
              return (
                <motion.div
                  key={idx}
                  className={classes.join(" ")}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="font-bold">{e.username}</span>
                  <span>{e.text}</span>
                  <span className="text-sm text-gray-600">Votes: {votes[e.id] || 0}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {phase === "game_over" && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-green-700 mb-2">🏆 Game Over</h2>
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

        {phase === "waiting" && <p className="text-gray-600 italic">Waiting for next round...</p>}
      </div>
    </div>
  );
}



































