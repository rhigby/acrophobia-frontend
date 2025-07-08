import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const socket = io("https://acrophobia-backend-2.onrender.com");
const predefinedRooms = Array.from({ length: 10 }, (_, i) => `room${i + 1}`);

export default function AcrophobiaLobby() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);

  const [acronym, setAcronym] = useState("");
  const [entries, setEntries] = useState([]);
  const [submission, setSubmission] = useState("");
  const [phase, setPhase] = useState("waiting");
  const [votes, setVotes] = useState({});
  const [scores, setScores] = useState({});
  const [countdown, setCountdown] = useState(null);
  const [round, setRound] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    socket.on("acronym", setAcronym);
    socket.on("phase", (newPhase) => {
      setPhase(newPhase);
      if (newPhase === "submit") {
        setShowOverlay(true);
        setTimeout(() => setShowOverlay(false), 1500);
      }
    });
    socket.on("entries", setEntries);
    socket.on("votes", setVotes);
    socket.on("scores", setScores);
    socket.on("round_number", setRound);
    socket.on("countdown", setCountdown);
    socket.on("beep", () => {
      const beep = new Audio("/beep.mp3");
      beep.play().catch((err) => console.error("Beep error:", err));
    });
    socket.on("room_full", () => setError("Room is full"));
    socket.on("invalid_room", () => setError("Invalid room"));

    return () => socket.disconnect();
  }, []);

  const joinRoom = (roomId) => {
    if (!username) {
      setError("Please enter your name");
      return;
    }
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

  if (!joined) {
    return (
      <div className="p-6 max-w-xl mx-auto bg-blue-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-4">🧠 Acrophobia Lobby</h1>
        <input
          className="border p-2 w-full mb-4"
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <h2 className="text-xl font-semibold mb-2">Join a Room</h2>
        <div className="grid grid-cols-2 gap-2">
          {predefinedRooms.map((r) => (
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
    <div className="p-6 max-w-2xl mx-auto bg-blue-50 min-h-screen relative">
      {countdown !== null && (
        <div className="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded-full text-lg shadow-lg z-50">
          ⏳ {countdown}s
        </div>
      )}

      {showOverlay && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-white text-4xl font-bold"
          >
            Round {round}
          </motion.div>
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-1">Room: {room} — Round {round}</h2>

      <div className="flex justify-center items-center gap-4 my-6">
        {acronym.split("").map((char, i) => (
          <motion.div
            key={i}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ delay: i * 0.2 }}
            className="bg-white shadow-lg border rounded-xl px-5 py-3 text-3xl font-bold text-blue-700"
          >
            {char}
          </motion.div>
        ))}
      </div>

      {phase === "submit" && (
        <div className="space-y-2">
          <textarea
            className="border p-2 w-full"
            placeholder="Your acronym meaning..."
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={submitEntry}
          >
            Submit
          </button>
        </div>
      )}

      {phase === "vote" && (
        <div className="space-y-2">
          <h4 className="font-semibold">Vote for your favorite:</h4>
          {entries.map((e, idx) => (
            <button
              key={idx}
              className="block w-full border rounded p-2 hover:bg-gray-100 flex justify-between"
              onClick={() => voteEntry(e.id)}
            >
              <span>{e.username}: {e.text}</span>
              <span className="text-sm text-gray-500">{votes[e.id] || 0} votes</span>
            </button>
          ))}
        </div>
      )}

      {phase === "results" && (
        <div>
          <h4 className="mt-4 font-bold">Scores:</h4>
          <ul>
            {Object.entries(scores).map(([player, score]) => (
              <li key={player}>{player}: {score} pts</li>
            ))}
          </ul>
        </div>
      )}

      {phase === "waiting" && <p className="text-gray-600 italic">Waiting for next round...</p>}
    </div>
  );
}





















