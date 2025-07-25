// src/App.jsx
import { useEffect, useState, useRef  } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import StickyHeader from "./StickyHeader";

function isValidSubmission(submission, acronym) {
    if (!submission || !acronym) return false;

    const words = submission.trim().split(/\s+/);
    if (words.length !== acronym.length) return false;

    const upperAcronym = acronym.toUpperCase();

    return words.every((word, idx) =>
        word[0]?.toUpperCase() === upperAcronym[idx]
    );
}

export const socket = io("https://acrophobia-backend-2.onrender.com", {
  autoConnect: false, // important
  withCredentials: true,
  transports: ["websocket", "polling"]
});

const ROOMS = Array.from({ length: 10 }, (_, i) => `room${i + 1}`);
const bgColor = "bg-gradient-to-br from-black via-blue-900 to-black text-blue-200";


function flattenMessages(threaded) {
  const result = [];
  const walk = (msgs) => {
    msgs.forEach((m) => {
      const { replies, ...rest } = m;
      result.push(rest);
      if (Array.isArray(replies)) walk(replies);
    });
  };
  walk(threaded);
  return result;
}

function buildThreadedMessages(flatMessages) {
  const messageMap = {};
  const roots = [];

  flatMessages.forEach((msg) => {
    messageMap[msg.id] = { ...msg, replies: [] };
  });

  flatMessages.forEach((msg) => {
    const parentId = msg.reply_to || msg.replyTo;
    if (parentId && messageMap[parentId]) {
      messageMap[parentId].replies.push(messageMap[msg.id]);
    } else {
      roots.push(messageMap[msg.id]);
    }
  });

  return roots;
}

const MessageCard = ({ message, depth = 0 }) => {
  return (
    <div
      className="p-3 rounded border border-gray-700 mt-2"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${0.6 + depth * 0.05})`,
        marginLeft: depth * 16
      }}
    >
      <h3 className="font-bold text-blue-300">{message.title}</h3>
      <p className="text-white">{message.content}</p>
      <p className="text-xs text-gray-400 mt-1">
        — {message.username} • {new Date(message.timestamp).toLocaleString()}
      </p>
      <button
        className="text-xs text-blue-400 hover:underline mt-1"
        onClick={() => setReplyToId(message.id)}
      >
        Reply
      </button>

      {Array.isArray(message.replies) && message.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {message.replies.map((child) => (
            <MessageCard key={child.id} message={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};


export default function App() {
    const [replyToId, setReplyToId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [roomStats, setRoomStats] = useState({});
    const [chatMessages, setChatMessages] = useState([]);
    const chatEndRef = useRef(null);
    const [chatInput, setChatInput] = useState("");
    const [authLoading, setAuthLoading] = useState(true);
    const [votedUsers, setVotedUsers] = useState([]);
    const [submittedUsers, setSubmittedUsers] = useState([]);
    const [acronymReady, setAcronymReady] = useState(false);
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
    const [authChecked, setAuthChecked] = useState(false);
    const [username, setUsername] = useState(null);
    const [profileView, setProfileView] = useState("lobby"); 

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
    const beginSound = useRef(null);
    const joinRoom = (roomId) => {
        const user = username || Cookies.get("acrophobia_user");
        if (!user) return setError("Enter your name");
        // ✅ Only initialize audio AFTER user has interacted (e.g., clicked "Join Room")
          if (!beginSound.current) {
            beginSound.current = new Audio("/begin.mp3");
          }
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
  if (!chatInput.trim()) return;

  if (chatInput.startsWith("/")) {
    const [rawUser, ...messageParts] = chatInput.slice(1).split(" ");
    const to = rawUser.trim();
    const message = messageParts.join(" ").trim();

    if (to && message) {
      socket.emit("private_message", {
        from: username,     // ✅ required by your backend
        to,
        message,            // ✅ must be `message` not `text`
      });
    }
  } else {
    socket.emit("chat_message", { room, username, text: chatInput });
  }

  setChatInput("");
};



useEffect(() => {
  const autofilledEmail = document.querySelector("input[type='email']")?.value;
  if (autofilledEmail) {
    setEmail(autofilledEmail);
  }
}, []);
    
useEffect(() => {
  const token = localStorage.getItem("acrophobia_token");

  const restoreSession = async () => {
    try {
      const res = await fetch("https://acrophobia-backend-2.onrender.com/api/me", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error("Not logged in");
      const data = await res.json();

      setUsername(data.username);
      setIsAuthenticated(true);

      // ✅ Set token and connect
      socket.auth = { token };
      if (!socket.connected) socket.connect();

      // ✅ Wait for connection, then emit
      socket.once("connect", () => {
        console.log("🔌 Socket connected, requesting stats");
        socket.emit("request_user_stats");
      });

      // Optional: check whoami again
      socket.emit("whoami", (res) => {
        if (res.username) {
          console.log("Session restored as:", res.username);
        }
      });
    } catch (err) {
      localStorage.removeItem("acrophobia_token");
      Cookies.remove("acrophobia_user");
      setIsAuthenticated(false);
    } finally {
      setAuthChecked(true);
    }
  };

  restoreSession();
}, []);

useEffect(() => {
  socket.on("user_stats", (stats) => {
    console.log("📊 Received user stats:", stats);
    setUserStats(stats);
  });

  return () => {
    socket.off("user_stats");
  };
}, []);


       useEffect(() => {
  const handlePrivateMessage = ({ from, to, text }) => {
    console.log("📥 Got private message:", { from, to, text });

    const isSender = from === username;
    const displayName = isSender ? `to ${to}` : `from ${from}`;

    setChatMessages((prev) => [
      ...prev,
      {
        username: displayName,
        text,
        private: true,
      },
    ]);
  };

  socket.on("private_message", handlePrivateMessage);
  socket.on("private_message_ack", handlePrivateMessage);

  return () => {
    socket.off("private_message", handlePrivateMessage);
    socket.off("private_message_ack", handlePrivateMessage);
  };
}, [username]);
    
useEffect(() => {
    const BASE_API = "https://acrophobia-backend-2.onrender.com";
  const fetchMessages = async () => {
    const res = await fetch(`${BASE_API}/api/messages`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  fetchMessages();

  socket.on("new_message", (msg) => {
    setMessages((prev) => [msg, ...prev]);
  });

  return () => socket.off("new_message");
}, []);

        useEffect(() => {
          socket.on("room_list", (data) => {
            // Expecting: { room1: { players: 3, round: 1 }, ... }
            setRoomStats(data);
          });
        
          return () => {
            socket.off("room_list");
          };
        }, []);
    
    const backgroundMusic = useRef(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    useEffect(() => {
        backgroundMusic.current = new Audio("/background.mp3");
        backgroundMusic.current.loop = true; // 🔁 Keep it looping
        backgroundMusic.current.volume = 0.1; // 🎚 Optional: Lower the volume
        const handleChat = (msg) => {
            setChatMessages((prev) => [...prev.slice(-49), msg]); // keep last 50 messages
        };

        socket.on("chat_message", handleChat);

        return () => {
            socket.off("chat_message", handleChat);
        };
    }, []);
    useEffect(() => {
      socket.on("active_users", (users) => {
         setAllUsers(users);
      });
    
      return () => socket.off("active_users");
    }, []);

const fanfareSound = useRef(null);
useEffect(() => {
  fanfareSound.current = new Audio("/fanfare.mp3"); // or your converted file name
    fanfareSound.current.volume = 0.5;
}, []);

const voteSound = useRef(null);
useEffect(() => {
  voteSound.current = new Audio("/votinground.mp3"); // or your converted file name
    fanfareSound.current.volume = 0.5;
}, []);
        useEffect(() => {
  beginSound.current = new Audio("/begin.mp3");

  const handleAcronymReady = () => {
    setAcronymReady(true);

    // ⏱️ Delay playback by 500ms
    setTimeout(() => {
      if (beginSound.current) {
        beginSound.current.currentTime = 0;
        beginSound.current.play().catch((e) => {
          console.warn("Autoplay failed:", e);
        });
      }
    }, 500);
  };

  socket.on("acronym_ready", handleAcronymReady);

  return () => {
    socket.off("acronym_ready", handleAcronymReady);
  };
}, []);

const resetGameState = () => {
  setAcronym("");
  setPhase("waiting");
  setEntries([]);
  setVotes({});
  setSubmittedUsers([]);
  setSubmittedEntry(null);
  setVoteConfirmed(false);
  setShowResults(false);
  setShowAwards(false);
  setResultsMeta([]);
  setCountdown(null);
  setRound(0);
  setHighlighted({});
};

    
const nextRoundSound = useRef(null);
    useEffect(() => {
  nextRoundSound.current = new Audio("/nextround.mp3");
}, []);


const submitSound = useRef(null);

useEffect(() => {
  submitSound.current = new Audio("/submit.mp3");
  socket.on("entry_submitted", ({ id, text }) => {
    setSubmittedEntry({ id, text });
    setSubmittedUsers((prev) => [...new Set([...prev, username])]);

    // ✅ Play the sound
    if (submitSound.current) {
      submitSound.current.currentTime = 0;
      submitSound.current.play().catch((e) => {
        console.warn("Submit sound failed:", e);
      });
    }
  });

  return () => {
    socket.off("entry_submitted");
  };
}, []);



    useEffect(() => {
  const letterSound = new Audio("/letters.wav");

  const playLetterBeep = () => {
    letterSound.currentTime = 0;
    letterSound.play().catch(() => {});
  };

  socket.on("letter_beep", playLetterBeep);
  socket.on("voted_users", setVotedUsers);
  socket.on("acronym", setAcronym);
  socket.on("phase", (newPhase) => {
    setPhase(newPhase);
    if (newPhase === "submit") {
      setSubmittedUsers([]);
      setAcronymReady(false);
      setOverlayText("Get Ready!");
      setShowOverlay(true);
        if (nextRoundSound.current) {
        nextRoundSound.current.currentTime = 0;
        nextRoundSound.current.play().catch((e) => {
          console.warn("Next round sound failed:", e);
        });
      }
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
      if (fanfareSound.current) {
        fanfareSound.current.currentTime = 0;
        fanfareSound.current.play().catch(() => {});
      }
      setShowResults(true);
    } else if (newPhase === "vote") {
     if (voteSound.current) {
        voteSound.current.currentTime = 0;
        voteSound.current.play().catch((e) => {
          console.warn("Vote sound failed:", e);
        });
      }
    }
      if (backgroundMusic.current) {
        backgroundMusic.current.currentTime = 0;
        backgroundMusic.current.play().catch((e) =>
          console.warn("Background music failed to play:", e)
        );
      }
      if (newPhase === "vote" || newPhase === "results") {
          if (backgroundMusic.current) {
            backgroundMusic.current.pause();
          }
        }
  });
  socket.on("submitted_users", (userList) => {
    setSubmittedUsers(userList);
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
  socket.on("beep", () => new Audio("/tick.mp3").play().catch(() => {}));
  socket.on("room_full", () => setError("Room is full"));
  socket.on("vote_confirmed", (entryId) => {
    setVotes((v) => ({ ...v, [username]: entryId }));
    setVoteConfirmed(true);
    new Audio("/submit.mp3").play().catch(() => {});
  });
  socket.on("highlight_results", setHighlighted);
  socket.on("results_metadata", ({ timestamps }) => {
    const fixedTimestamps = timestamps.map((entry) => ({
      ...entry,
      time: parseFloat(entry.time).toFixed(2),
    }));
    setResultsMeta(fixedTimestamps);
  });

  // ✅ Correct location for the cleanup block
  return () => {
    socket.off("letter_beep", playLetterBeep);
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
    socket.off("vote_confirmed");
    socket.off("highlight_results");
    socket.off("results_metadata");
    socket.off("submitted_users");
  };
}, [username]);


   const login = async () => {
  if (!username || !password) {
    setError("All fields required");
    return;
  }

  try {
    const res = await fetch("https://acrophobia-backend-2.onrender.com/api/login-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success && data.token) {
      localStorage.setItem("acrophobia_token", data.token); // 🔐 Save token for reuse
      setIsAuthenticated(true);
      setError(null);

      // Connect socket with token-based auth
      socket.auth = { token: data.token };
      socket.connect();
    } else {
      setError(data.error || "Login failed");
    }
  } catch (err) {
    setError("Network error during login");
    console.error(err);
  }
};





    const register = () => {
  if (!username || !email || !password) {
    setError("All fields required");
    return;
  }

  // ✅ Ensure the socket is connected before emitting
  if (!socket.connected) {
    socket.connect();
  }

  const register = () => {
  if (!username || !email || !password) {
    setError("All fields required");
    return;
  }
socket.emit("request_user_stats");

  socket.emit("register", { username, email, password }, async (res) => {
    if (res.success) {
      try {
        // 🔐 Get login token via REST
        const tokenRes = await fetch("https://acrophobia-backend-2.onrender.com/api/login-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        const tokenData = await tokenRes.json();

        if (tokenData.success && tokenData.token) {
          localStorage.setItem("acrophobia_token", tokenData.token);
          socket.auth = { token: tokenData.token };
          socket.connect();

          setIsAuthenticated(true);
          setError(null);
        } else {
          setError(tokenData.error || "Token retrieval failed");
        }
      } catch (err) {
        console.error("Token fetch failed", err);
        setError("Server error after registration");
      }
    } else {
      setError(res.message || "Registration failed");
    }
  });
};
    };


const MessageCard = ({ message, depth = 0 }) => {
  return (
    <div
      className="p-3 rounded border border-gray-700 mt-2"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${0.6 + depth * 0.05})`,
        marginLeft: depth * 16
      }}
    >
      <h3 className="font-bold text-blue-300">{message.title}</h3>
      <p className="text-white">{message.content}</p>
      <p className="text-xs text-gray-400 mt-1">
        — {message.username} • {new Date(message.timestamp).toLocaleString()}
      </p>
      <button
        className="text-xs text-blue-400 hover:underline mt-1"
        onClick={() => setReplyToId(message.id)}
      >
        Reply
      </button>

      {Array.isArray(message.replies) && message.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {message.replies.map((child) => (
            <MessageCard key={child.id} message={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

useEffect(() => {
  const loadMessages = async () => {
    try {
      const res = await fetch("https://acrophobia-backend-2.onrender.com/api/messages", {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(buildThreadedMessages(data));
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  loadMessages();
}, []);

useEffect(() => {
  const handleNewMessage = (msg) => {
    setMessages((prev) => {
      const existingIds = new Set(flattenMessages(prev).map((m) => m.id));
      const updated = existingIds.has(msg.id) ? flattenMessages(prev) : [...flattenMessages(prev), msg];
      return buildThreadedMessages(updated);
    });
  };

  socket.on("new_message", handleNewMessage);
  return () => socket.off("new_message", handleNewMessage);
}, []);

const sendBoardMessage = async () => {
  const BASE_API = "https://acrophobia-backend-2.onrender.com";
  const token = localStorage.getItem("acrophobia_token");

  const payload = {
    title: newTitle,
    content: newContent,
    replyTo: replyToId
  };

  try {
    const res = await fetch(`${BASE_API}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined
      },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setNewTitle("");
      setNewContent("");
      setReplyToId(null);
    } else {
      const errText = await res.text();
      console.error("❌ Error submitting message:", errText);
    }
  } catch (err) {
    console.error("❌ Network error:", err);
  }
};


    
   if (!authChecked) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-black via-blue-900 to-black text-white">
        <motion.h1
          className="text-7xl font-bold text-red-600 tracking-widest mb-4"
          style={{
            fontFamily: "Impact, sans-serif",
            textShadow: "0 0 4px orange, 0 0 4px red"
          }}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          ACRO
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
  <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-black flex items-center justify-center text-white px-4">
    <motion.div
      className="w-full max-w-md bg-blue-950/80 backdrop-blur-md p-8 rounded-xl shadow-lg border border-blue-800"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-center tracking-wide">
        {mode === "login" ? "🔐 Login to Acrophobia" : "📝 Register New Player"}
      </h1>

      {mode === "register" && (
        <input
          className="border border-blue-700 p-3 mb-4 w-full rounded bg-gray-900 text-white placeholder:text-gray-400"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      )}
      <input
        className="border border-blue-700 p-3 mb-4 w-full rounded bg-gray-900 text-white placeholder:text-gray-400"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="border border-blue-700 p-3 mb-4 w-full rounded bg-gray-900 text-white placeholder:text-gray-400"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={mode === "login" ? login : register}
        className="w-full bg-green-600 hover:bg-green-700 p-3 rounded text-white font-semibold tracking-wide"
      >
        {mode === "login" ? "Login" : "Register"}
      </button>

      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-4 text-sm text-blue-300 underline block w-full text-center"
      >
        {mode === "login"
          ? "Don't have an account? Register"
          : "Already have an account? Login"}
      </button>

      {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
    </motion.div>
  </div>
);


  }


if (profileView === "profile") {
  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-gray-900 text-white rounded-xl shadow-lg border border-blue-800">
  <h2 className="text-3xl font-bold text-center mb-6">👤 My Profile</h2>
      
      <div className="mb-4">
        <label className="block text-sm mb-1">Username:</label>
        <div className="bg-gray-800 p-2 rounded">{username}</div>
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">Email:</label>
        <input
          type="email"
          className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
          value={email}
        autoComplete="new_email"
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">New Password:</label>
        <input
          type="password"
          className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
          placeholder=""
          value={password}
        autoComplete="new_password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
        <div className="grid grid-cols-2 gap-4 text-center text-blue-200">
  <div>
    <div className="text-2xl font-bold">{userStats.total_points}</div>
    <div className="text-sm">Total Points</div>
  </div>
  <div>
    <div className="text-2xl font-bold">{userStats.total_wins}</div>
    <div className="text-sm">Wins</div>
  </div>
  <div>
    <div className="text-2xl font-bold">{userStats.games_played}s</div>
    <div className="text-sm">Games Played</div>
  </div>
<div>
    <div className="text-2xl font-bold">{userStats.voted_for_winner_count}s</div>
    <div className="text-sm">Voted for Winner</div>
  </div>
  <div>
    <div className="text-2xl font-bold">{userStats.fastest_submission_ms}s</div>
    <div className="text-sm">Fastest Submission</div>
  </div>
</div>
      <button
  onClick={async () => {
    const token = localStorage.getItem("acrophobia_token");

    if (!token) {
      alert("You must be logged in to update your profile.");
      return;
    }

    try {
      const res = await fetch("https://acrophobia-backend-2.onrender.com/api/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`  // 🔐 pass token here
        },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        alert("Profile updated!");
      } else {
        const errText = await res.text();
        alert("Error updating profile: " + errText);
      }
    } catch (err) {
      console.error("Network error:", err);
    }
  }}
  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
>
  Save Changes
</button>


      <button
        onClick={() => setProfileView("lobby")}
        className="mt-4 block text-sm text-blue-400 underline"
      >
        ← Back to Lobby
      </button>
    </div>
  );
}

    if (!joined) {
  return (
      <>
      <StickyHeader
      username={username}
      setProfileView={setProfileView}
      logout={() => {
        localStorage.removeItem("acrophobia_token");
        setIsAuthenticated(false);
        setRoom(null);
        setJoined(false);
        socket.disconnect();
      }}
    />
  <div className="p-6 w-full min-h-screen bg-repeat bg-left-top text-white" style={{ backgroundImage: `url("/bground.gif")` }}>
    

    <h1 className="text-3xl font-bold mb-6">Lobby</h1>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LEFT SIDE */}
      <div>
        {/* Room Selector */}
        <div className="mb-6 p-4 rounded border border-blue-800 bg-blue-900/50 shadow-inner">
          <h2 className="text-xl font-semibold mb-4">Select a Room</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ROOMS.map((r) => {
              const stats = roomStats[r];
              const playerCount = stats?.players || 0;
              const roundNum = stats?.round ?? "-";
              const isFull = playerCount >= 10;

              return (
                <div
                  key={r}
                  className={`rounded p-3 border transition duration-200 ${
                    isFull
                      ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-blue-800 border-blue-700 cursor-pointer"
                  }`}
                  onClick={() => !isFull && joinRoom(r)}
                >
                  <div className="font-bold text-lg">{r}</div>
                  <div className="text-sm">
                    Players: {playerCount}<br />
                    Round: {roundNum}
                  </div>
                  {isFull && (
                    <div className="text-xs text-red-400 mt-1">Room Full</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* User List */}
        <div className="p-4 rounded border border-blue-800 bg-gray-900/50 shadow-inner">
          <h2 className="text-xl font-semibold mb-3">🧑‍💻 Online Users</h2>
          <input
            type="text"
            placeholder="Search for users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 mb-3 rounded bg-gray-800 text-white border border-gray-700 placeholder:text-gray-400"
          />
          <ul className="max-h-64 overflow-y-auto space-y-1">
            {allUsers
              .filter((u) =>
                u?.username?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((u) => (
                <li key={u.username} className="text-sm text-blue-100">
                  {u.username}{" "}
                  <span className="text-gray-400">({u.room || "lobby"})</span>
                </li>
              ))}
          </ul>
        </div>

        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>

      {/* RIGHT SIDE: Message Board */}
<div className="bg-gray-900/50 p-4 rounded border border-blue-800 shadow-inner flex flex-col h-full">
  <h2 className="text-xl font-bold mb-4 text-white">📬 Message Board</h2>

  <form
    onSubmit={async (e) => {
      e.preventDefault();
      sendBoardMessage();
    }}
  >
    {replyToId && (
      <div className="mb-2 p-2 rounded bg-blue-900 text-blue-100 border border-blue-700 text-sm">
        Replying to message ID: <strong>{replyToId}</strong>
        <button
          className="ml-2 text-red-400 text-xs underline"
          onClick={() => setReplyToId(null)}
          type="button"
        >
          Cancel
        </button>
      </div>
    )}

    <input
      className="w-full p-2 mb-2 rounded bg-gray-800 text-white border border-gray-600 placeholder:text-gray-400"
      placeholder="Title"
      value={newTitle}
      onChange={(e) => setNewTitle(e.target.value)}
    />
    <textarea
      className="w-full p-2 mb-2 rounded bg-gray-800 text-white border border-gray-600 placeholder:text-gray-400"
      placeholder="Write your message..."
      value={newContent}
      onChange={(e) => setNewContent(e.target.value)}
    />
    <button
      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white w-full"
      type="submit"
    >
      Post Message
    </button>
  </form>

  <div className="mt-4 overflow-y-auto flex-1 max-h-[32rem]">
    {messages.map((m) => (
      <MessageCard key={m.id} message={m} />
    ))}
  </div>
</div>

    </div>
  </div>
        </>
);

}


    return (
  <>

    {showOverlay && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-4xl md:text-5xl font-extrabold text-red-500 drop-shadow-[0_0_5px_orange]">
          {overlayText}
        </div>
      </div>
    )}

    <div className={`flex flex-col min-h-screen ${bgColor} font-mono`}>

      <div className="flex flex-1 w-full max-w-screen-xl mx-auto flex-col md:flex-row overflow-hidden">

        <div className="w-full md:w-1/4 border-b md:border-b-0 md:border-r border-blue-800 bg-blue-950 p-4 md:h-auto md:min-h-screen">
            <div className="flex justify-between items-center mb-2">
                <div className="flex justify-end mb-4">
                  <button
                   onClick={() => {
                      socket.emit("leave_room");
                      resetGameState(); // ⬅️ Important
                      setJoined(false);
                      setRoom(null);
                    }}
                    className="text-xs text-blue-300 underline"
                  >
                    ← Back to Lobby
                  </button>
                </div>

                <h2 className="text-lg md:text-xl font-bold">Players</h2>
              </div>

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
                      <span
                          onClick={() => setChatInput(`/${p.username} `)}
                          className="cursor-pointer hover:underline"
                          title="Send private message"
                        >
                    {p.username}
                      </span>
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
            <div className="flex items-center gap-1">
              <span className="text-green-300">✍️</span> Answered
            </div>
            <div className="flex items-center gap-1">
              <span className="text-blue-300">🗳️</span> Voted
            </div>
          </div>
        </div>

        {/* Main Gameplay Section */}
        <div className="flex flex-col flex-1 relative overflow-y-auto">
          <div className="flex-1 p-4 md:p-6 pb-72 md:pb-48">
            <h2 className="text-lg md:text-xl mb-4">
              Room: {room} — Round {round}
            </h2>

            {countdown !== null && (
              <div className="fixed top-4 right-4 text-3xl md:text-5xl font-bold text-red-500 bg-black bg-opacity-60 px-4 py-2 rounded shadow-lg z-50">
                {countdown}
              </div>
            )}

            {acronym && (
              <div className="flex justify-center mb-6">
                <motion.h1
                  className="text-5xl md:text-8xl font-bold text-red-600 tracking-widest"
                  style={{
                    fontFamily: "Arial, san-serif",
                    textShadow: "0 0 4px orange, 0 0 4px orange"
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
                  className="border border-blue-700 p-2 w-full text-lg md:text-xl bg-black text-blue-200"
                  placeholder="Type your answer and press Enter..."
                  value={submission}
                  disabled={!acronymReady || !!submittedEntry}
                  onChange={(e) => setSubmission(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitEntry()}
                />
                {submissionWarning && <div className="text-red-400 mt-2">{submissionWarning}</div>}
                {submittedEntry && (
                  <div className="text-green-400 mt-2">
                    Submitted: “{submittedEntry.text}”
                  </div>
                )}
              </div>
            )}

            {phase === "vote" && (
              <div className="space-y-2">
                <h4 className="font-semibold">Vote for your favorite:</h4>
                {entries.map((e) => {
                  const isOwnEntry = e.username === username;
                  return (
                    <button
                      key={e.id}
                      onClick={() => voteEntry(e.id)}
                      disabled={isOwnEntry}
                      className={`block w-full border rounded p-2 text-left ${
                        isOwnEntry
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-blue-900"
                      } ${
                        votes[username] === e.id
                          ? "bg-blue-800 border-blue-500"
                          : "border-blue-700"
                      }`}
                    >
                      {e.text}
                    </button>
                  );
                })}
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
          </div>

          {/* Chat Box */}
          <div className="border-t border-blue-800 p-4 bg-blue-950 w-full z-10">
            <div className="h-40 overflow-y-auto bg-black border border-blue-700 rounded p-2 text-sm mb-2">
              {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-wrap items-start break-words ${
                      msg.private ? "text-pink-300" : "text-blue-200"
                    }`}
                  >
                    <span className="font-bold mr-1">
                      {msg.private ? (
                        <span className="italic">
                          (Private) {msg.username}:
                        </span>
                      ) : (
                        <span className="text-blue-400">{msg.username}:</span>
                      )}
                    </span>
                    <span>{msg.text}</span>
                  </div>
                ))}

              <div ref={chatEndRef}></div>
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
    </div>
  </>
);
}

























































































































