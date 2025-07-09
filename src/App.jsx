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
    socket.on("results_metadata", ({ timestamps }) => {
      const fixedTimestamps = timestamps.map((entry) => ({
        ...entry,
        time: ((entry.time || 0) / 1000).toFixed(2),
      }));
      setResultsMeta(fixedTimestamps);
    });

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

  return (
    <div className={`flex min-h-screen ${bgColor} font-mono`}>
      {!joined ? (
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
      ) : (
        <div className="flex-1 p-6 relative">
          {countdown !== null && (
            <div className="fixed top-0 left-0 right-0 h-16 bg-red-800 text-white flex items-center justify-center text-5xl font-bold z-50 animate-pulse">
              ⏱ {countdown}s
            </div>
          )}

          <h2 className="text-2xl font-bold mb-4">Room: {room} — Round {round}</h2>

          {/* Game UI components go here */}
          {/* Submit, vote, results, intermission, game over, etc. */}
          {/* Animate award icons after results are shown */}

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
              {submittedEntry && <div className="text-green-400 mt-2">Submitted: “{submittedEntry}”</div>}
            </div>
          )}

          {phase === "vote" && (
            <div className="space-y-2">
              <h4 className="font-semibold">Vote for your favorite:</h4>
              {entries.map((e) => (
                <button
                  key={e.id}
                  onClick={() => voteEntry(e.id)}
                  className={`block w-full border rounded p-2 hover:bg-blue-900 text-left ${votes[username] === e.id ? "bg-blue-800 border-blue-500" : "border-blue-700"}`}
                >
                  {e.text}
                </button>
              ))}
            </div>
          )}

          {showResults && (
            <div className="space-y-2 mt-4">
              <h4 className="font-semibold mb-2">Results:</h4>
              {entries.map((e) => {
                const timeMeta = resultsMeta.find((m) => m.id === e.id);
                const seconds = timeMeta ? `${timeMeta.time}s` : "";
                return (
                  <motion.div
                    key={e.id}
                    className={`p-2 rounded border flex flex-col mb-2 ${e.id === highlighted.winner ? "border-yellow-400 bg-yellow-900 animate-pulse" : e.id === highlighted.fastest ? "border-green-400 bg-green-900 animate-pulse" : "border-blue-700 bg-blue-950"}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{e.username}</span>
                        {e.id === highlighted.winner && <span className="text-yellow-300">🏁</span>}
                        {e.id === highlighted.fastest && <span className="text-green-300">⏱</span>}
                        {highlighted.voters?.includes(e.username) && <span className="text-blue-300">👍</span>}
                      </div>
                      <span className="text-sm text-gray-300">
                        Votes: {votes[e.id] || 0} {seconds ? `• ${seconds}` : ""}
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

          {showAwards && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center space-x-6 text-4xl">
              {highlighted.winner && (
                <motion.span
                  className="inline-block animate-bounce"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  🏁
                </motion.span>
              )}
              {highlighted.fastest && (
                <motion.span
                  className="inline-block animate-pulse"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  ⏱
                </motion.span>
              )}
              {highlighted.voters?.includes(username) && (
                <motion.span
                  className="inline-block animate-wiggle"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  👍
                </motion.span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

















































