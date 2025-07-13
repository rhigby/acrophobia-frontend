// src/App.jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import Cookies from "js-cookie";

function isValidSubmission(submission, acronym) {
  if (!submission || !acronym) return false;

  const words = submission.trim().split(/\s+/);
  if (words.length !== acronym.length) return false;

  const upperAcronym = acronym.toUpperCase();

  return words.every((word, idx) =>
    word[0]?.toUpperCase() === upperAcronym[idx]
  );
}

const socket = io("https://acrophobia-backend-2.onrender.com", {
   withCredentials: true,
  transports: ["websocket"]
});
const ROOMS = Array.from({ length: 10 }, (_, i) => `room${i + 1}`);
const bgColor = "bg-gradient-to-br from-black via-blue-900 to-black text-blue-200";

export default function App() {
  const [chatMessages, setChatMessages] = useState([]);
const [chatInput, setChatInput] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
   const [votedUsers, setVotedUsers] = useState([]);
   const [submittedUsers, setSubmittedUsers] = useState([]);
   const [acronymReady, setAcronymReady] = useState(false);
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
  const [entries, setEntries] = useState([]);
  const [submission, setSubmission] = useState("");
  const [phase, setPhase] = useState("waiting");
  const [votes, setVotes] = useState({});
  const [scores, setScores] = useState({});
  const [countdown, setCountdown] = useState(null);
  const [round, setRound] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [submittedEntry, setSubmittedEntry] = useState(null);
  const [highlighted, setHighlighted] = useState({});
  const [submissionWarning, setSubmissionWarning] = useState("");
  const [resultsMeta, setResultsMeta] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [voteConfirmed, setVoteConfirmed] = useState(false);
  const [showAwards, setShowAwards] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const sortedPlayers = [...players].sort((a, b) => (scores[b.username] || 0) - (scores[a.username] || 0));

  

  const submitEntry = () => {
  if (!submission) return;
  if (!isValidSubmission(submission, acronym)) {
    setSubmissionWarning("Each word must start with the matching letter in the acronym.");
    return;
  }
  setSubmissionWarning(null); // ✅ clear warning if valid
  socket.emit("submit_entry", { room, username, text: submission });
  setSubmission("");
};

const sendMessage = () => {
  if (chatInput.trim()) {
    socket.emit("chat_message", { room, username, text: chatInput });
    setChatInput("");
  }
};

  const joinRoom = (roomId) => {
  const user = username || Cookies.get("acrophobia_user");
  if (!user) return setError("Enter your name");
  setUsername(user);
  socket.emit("join_room", { room: roomId, username: user });
  setRoom(roomId);
  setJoined(true);
  setError(null);
};


  const voteEntry = (entryId) => {
    socket.emit("vote_entry", { room, username, entryId });
  };

  const sendChat = () => {
  if (chatInput.trim()) {
    socket.emit("chat_message", { room, username, text: chatInput.trim() });
    setChatInput("");
  }
};

  useEffect(() => {
  const handleChat = (msg) => {
    setChatMessages((prev) => [...prev.slice(-49), msg]); // keep last 50 messages
  };

  socket.on("chat_message", handleChat);

  return () => {
    socket.off("chat_message", handleChat);
  };
}, []);
useEffect(() => {
  const handleConnect = () => {
    socket.emit("check_session", (res) => {
      if (res.authenticated) {
        setUsername(res.username);
        setIsAuthenticated(true);
        setJoined(false);
        setAuthLoading(false); // ✅ done loading
      } else {
        const cookieUser = Cookies.get("acrophobia_user");
        if (cookieUser) {
          socket.emit("login_cookie", { username: cookieUser }, (res) => {
            if (res.success) {
              setUsername(res.username);
              setIsAuthenticated(true);
              setJoined(false);
            }
            setAuthLoading(false); // ✅ done loading
          });
        } else {
          setAuthLoading(false); // ✅ done loading
        }
      }
    });
  };

  socket.on("connect", handleConnect);
  return () => socket.off("connect", handleConnect);
}, []);






  useEffect(() => {
     socket.on("voted_users", setVotedUsers);
    socket.on("acronym", setAcronym);
    socket.on("phase", (newPhase) => {
  setPhase(newPhase);
  if (newPhase === "submit") {
     setSubmittedUsers([]);
     setAcronymReady(false);
    setOverlayText("Get Ready!");
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 2000);
    setSubmission("");
    setSubmittedEntry(null);
    setVoteConfirmed(false);
    setShowResults(false);
    setShowAwards(false);
  } else if (newPhase === "next_round_overlay") {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 10000);
  } else if (newPhase === "results") {
    setShowResults(true); // ✅ THIS IS THE FIX
  }
});
     socket.on("submitted_users", (userList) => {
        setSubmittedUsers(userList);
   });

  socket.on("entry_submitted", ({ id, text }) => {
     setSubmittedEntry({ id, text });
     setSubmittedUsers((prev) => [...new Set([...prev, username])]); // ✅ add self
   });


   socket.on("acronym_ready", () => {
     setAcronymReady(true);
   });
    socket.on("entries", setEntries);
    socket.on("votes", setVotes);
    socket.on("scores", setScores);
    socket.on("round_number", (roundNum) => {
      setRound(roundNum);
      if (phase === "next_round_overlay") {
        setOverlayText(`Round ${roundNum} starting soon...`);
      }
    });
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
  const fixedTimestamps = timestamps.map((entry) => ({
    ...entry,
    time: parseFloat(entry.time).toFixed(2), // optional formatting
  }));
  setResultsMeta(fixedTimestamps);
});

    return () => {
       socket.off("voted_users");
      socket.off("acronym");
      socket.off("phase");
      socket.off("entries");
      socket.off("votes");
      socket.off("scores");
      socket.off("round_number");
      socket.off("countdown");
      socket.off("players");
      socket.off("user_stats");
      socket.off("beep");
      socket.off("room_full");
      socket.off("entry_submitted");
      socket.off("vote_confirmed");
      socket.off("highlight_results");
      socket.off("results_metadata");
       socket.off("submitted_users");
    };
  }, [username]);

  const login = () => {
    if (!username || !password) return setError("Enter username and password");
    socket.emit("login", { username, password }, (res) => {
      if (res.success) {
        setIsAuthenticated(true);
         Cookies.set("acrophobia_user", username, { expires: 7 });
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
        Cookies.set("acrophobia_user", username, { expires: 7 });
        setError(null);
      } else {
        setError(res.message || "Registration failed");
      }
    });
  };

  if (authLoading) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-black via-blue-900 to-black text-white">
      <motion.h1
        className="text-7xl font-extrabold text-red-600 tracking-widest mb-4"
        style={{
          fontFamily: "Impact, sans-serif",
          textShadow: "0 0 4px orange, 0 0 8px red"
        }}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      >
        BRB
      </motion.h1>

      <motion.div
        className="text-lg text-blue-200"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        Checking session...
      </motion.div>
    </div>
  );
}



  
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
    <>
      {showOverlay && (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div className="text-5xl font-extrabold text-red-500 drop-shadow-[0_0_10px_orange]">
      {overlayText}
    </div>
  </div>
)}
    <div className={`flex min-h-screen ${bgColor} font-mono`}>
      <div className="w-1/4 p-4 border-r border-blue-800">
        <h2 className="text-xl font-bold mb-2">Players</h2>
        <ul>
  {sortedPlayers.map((p) => {
    const hasSubmitted = submittedUsers.includes(p.username);
    const hasVoted = Object.keys(votes).includes(p.username);

    return (
      <li
        key={p.username}
        className={`mb-1 flex justify-between items-center px-2 py-1 rounded ${
          hasSubmitted ? "bg-green-700 text-white font-bold" : "bg-gray-800 text-gray-300"
        }`}
      >
        <span className="flex items-center gap-2">
          {p.username}
          {hasSubmitted && (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-green-300"
              title="Answered"
            >
              ✍️
            </motion.span>
          )}
          {hasVoted && (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-blue-300"
              title="Voted"
            >
              🗳️
            </motion.span>
          )}
        </span>
        <span className="font-semibold">{scores[p.username] || 0}</span>
      </li>
    );
  })}
</ul>


<div className="text-xs mt-3 text-gray-400">
  <div className="flex items-center gap-1"><span className="text-green-300">✍️</span> Answered</div>
  <div className="flex items-center gap-1"><span className="text-blue-300">🗳️</span> Voted</div>
</div>


        {userStats && (
          <div className="mt-6 bg-blue-800 p-4 rounded text-sm text-white">
            <h3 className="font-bold mb-2">Your Stats</h3>
            <ul className="space-y-1">
              <li>Games Played: {userStats.games_played}</li>
              <li>Total Points: {userStats.total_points}</li>
              <li>Wins: {userStats.total_wins}</li>
              <li>Fastest Time: {userStats.fastest_submission_ms || "–"} ms</li>
              <li>Votes for Winners: {userStats.voted_for_winner_count}</li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex-1 p-6">
        <h2 className="text-xl mb-4">Room: {room} — Round {round}</h2>
        {countdown !== null && (
          <div className="fixed top-4 right-4 text-5xl font-bold text-red-500 bg-black bg-opacity-60 px-4 py-2 rounded shadow-lg z-50">{countdown}</div>
        )}

       {acronym && (
  <div className="flex justify-center mb-6">
    <motion.h1
      className="text-8xl font-extrabold text-red-600 tracking-widest"
      style={{
        fontFamily: "Impact, sans-serif",
        textShadow: "0 0 4px orange, 0 0 6px orange"
      }}
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {acronym}
    </motion.h1>
  </div>
)}


        {phase === "submit" && (
          <div className="space-y-2">
            <input
                 className="border border-blue-700 p-2 w-full text-xl bg-black text-blue-200"
                 placeholder="Type your answer and press Enter..."
                 value={submission}
                 disabled={!acronymReady || !!submittedEntry} // ✅ only active when ready
                 onChange={(e) => setSubmission(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && submitEntry()}
               />
               
      
             {submissionWarning && (
               <div className="text-red-400 mt-2">{submissionWarning}</div>
             )}

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
      className={`p-2 rounded border flex flex-col mb-2 ${
        e.id === highlighted.winner
          ? "border-yellow-400 bg-yellow-900 animate-pulse"
          : e.id === highlighted.fastest
          ? "border-green-400 bg-green-900 animate-pulse"
          : "border-blue-700 bg-blue-950"
      }`}
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
        {/* Chat Box */}
<div className="mt-6 border-t border-blue-800 pt-4">
  <div className="h-40 overflow-y-auto bg-blue-950 border border-blue-800 rounded p-2 text-sm mb-2">
    {chatMessages.map((msg, i) => (
      <div key={i} className="text-blue-200">
        <span className="font-bold text-blue-400">{msg.username}:</span> {msg.text}
      </div>
    ))}
  </div>
  <div className="flex gap-2">
    <input
      type="text"
      className="flex-1 p-2 bg-black text-white border border-blue-700 rounded"
      placeholder="Type a message..."
      value={chatInput}
      onChange={(e) => setChatInput(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && sendChat()}
    />
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      onClick={sendChat}
    >
      Send
    </button>
  </div>
</div>
      </div>
      


    </div>
    </>
  );
}

























































