// src/App.jsx

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://acrophobia-backend-2.onrender.com");

const ROOMS = Array.from({ length: 10 }, (_, i) => `room${i + 1}`);

export default function App() {
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

  useEffect(() => {
    socket.on("acronym", setAcronym);
    socket.on("phase", setPhase);
    socket.on("entries", setEntries);
    socket.on("votes", setVotes);
    socket.on("scores", setScores);
    socket.on("round_number", setRound);
    socket.on("countdown", setCountdown);
    socket.on("beep", () => {
      const beep = new Audio("/beep.mp3");
      beep.play().catch(() => {});
    });
    socket.on("room_full", () => setError("Room is full"));

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
    socket.emit("submit_entry", { room, username, text: submission });
    setSubmission("");
  };

  const voteEntry = (entryId) => {
    socket.emit("vote_entry", { room, username, entryId });
  };

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
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-blue-50">
      {countdown !== null && (
        <div className="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded-full text-lg z-50">
          ⏳ {countdown}s
        </div>
      )}

      <h2 className="text-2xl font-bold mb-2">Room: {room} — Round {round}</h2>
      <h3 className="text-xl mb-4">
        Acronym: <span className="font-mono text-blue-800 text-2xl">{acronym}</span>
      </h3>

      {phase === "submit" && (
        <div className="space-y-2">
          <textarea
            className="border p-2 w-full"
            placeholder="Enter your acronym meaning..."
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
          />
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={submitEntry}>
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
              className="block w-full border rounded p-2 hover:bg-gray-100"
              onClick={() => voteEntry(e.id)}
            >
              <div className="flex justify-between">
                <span className="font-bold">{e.username}</span>
                <span>{e.text}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {phase === "results" && (
        <div>
          <h4 className="font-semibold mb-2">Results:</h4>
          <ul className="space-y-1">
            {entries.map((e, idx) => (
              <li key={idx} className="border rounded p-2 flex justify-between">
                <span>{e.username}</span>
                <span>{e.text}</span>
                <span className="text-sm text-gray-600">Votes: {votes[e.id] || 0}</span>
              </li>
            ))}
          </ul>
          <h4 className="mt-4 font-bold">Scores:</h4>
          <ul>
            {Object.entries(scores).map(([player, score]) => (
              <li key={player}>{player}: {score} pts</li>
            ))}
          </ul>
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
  );
}
























