// Recommended packages to install before running the Yahtzee frontend:
// Run this in your project root:
//
// npm install react react-dom socket.io-client classnames framer-motion

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import classNames from "classnames";
import { motion } from "framer-motion";

const socket = io("http://localhost:3001"); // Update to your backend URL if needed

export default function YahtzeeGame() {
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [players, setPlayers] = useState([]);
  const [dice, setDice] = useState([1, 1, 1, 1, 1]);
  const [rollCount, setRollCount] = useState(0);
  const [gameState, setGameState] = useState(null);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const joinRoom = () => {
    if (!username || !room) return;
    socket.emit("join_yahtzee_room", { room, username }, (res) => {
      if (res.success) setJoined(true);
    });
  };

  const rollDice = () => {
    if (rollCount >= 3) return;
    socket.emit("roll_dice", { room });
  };

  const submitScore = () => {
    socket.emit("submit_yahtzee_score", { room });
    setScoreSubmitted(true);
  };

  useEffect(() => {
    socket.on("yahtzee_state", (state) => {
      setGameState(state);
      setDice(state.dice);
      setPlayers(state.players);
      setRollCount(state.rolls);
    });

    return () => {
      socket.off("yahtzee_state");
    };
  }, []);

  if (!joined) {
    return (
      <div className="p-4 text-white bg-gray-800 min-h-screen">
        <h1 className="text-xl mb-2">Join Yahtzee Room</h1>
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="p-2 mb-2 block text-black" />
        <input placeholder="Room name" value={room} onChange={(e) => setRoom(e.target.value)} className="p-2 mb-2 block text-black" />
        <button onClick={joinRoom} className="px-4 py-2 bg-blue-600">Join</button>
      </div>
    );
  }

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl mb-4">🎲 Yahtzee - Room {room}</h1>

      <div className="mb-4">Current Turn: {gameState?.currentTurn}</div>
      <div className="flex gap-4 mb-6">
        {dice.map((val, i) => (
          <motion.div
            key={i}
            className="w-12 h-12 bg-white text-black flex items-center justify-center text-2xl rounded shadow"
            whileHover={{ scale: 1.1 }}
          >
            {val}
          </motion.div>
        ))}
      </div>

      <div className="mb-2">Rolls Used: {rollCount}/3</div>
      <button onClick={rollDice} disabled={rollCount >= 3} className="px-4 py-2 bg-green-600 mr-2">Roll Dice</button>
      <button onClick={submitScore} disabled={scoreSubmitted} className="px-4 py-2 bg-purple-600">Submit Score</button>

      <h2 className="mt-8 text-xl">Players</h2>
      <ul>
        {players.map((p) => (
          <li key={p.username} className="mt-1">
            {p.username} — Score: {p.score}
          </li>
        ))}
      </ul>
    </div>
  );
}
