import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://acrophobia-backend-2.onrender.com", {
  withCredentials: true,
  transports: ["websocket"]
});

export default function LandingPage() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    gamesToday: 0,
    roomsLive: 0,
    top10Daily: [],
    top10Weekly: [],
  });

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ title: "", content: "", replyTo: null });
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 5;
  const inputRef = useRef(null);

  // Fetch stats
  useEffect(() => {
    const fetchStats = () => {
      fetch("https://acrophobia-backend-2.onrender.com/api/stats")
        .then((res) => res.json())
        .then((data) => {
          setStats({
            totalPlayers: data.totalPlayers || 0,
            gamesToday: data.gamesToday || 0,
            roomsLive: data.roomsLive || 0,
            top10Daily: Array.isArray(data.top10Daily) ? data.top10Daily : [],
            top10Weekly: Array.isArray(data.top10Weekly) ? data.top10Weekly : [],
          });
        })
        .catch(console.error);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages
  useEffect(() => {
    fetch("https://acrophobia-backend-2.onrender.com/api/messages", {
      credentials: "include"
    })
      .then((res) => res.json())
      .then(setMessages)
      .catch(console.error);
  }, []);

  // Session check
 useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No token found in localStorage");
      setAuthChecked(true);
      return;
    }

    fetch("https://acrophobia-backend-2.onrender.com/api/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log("/api/me status:", res.status);
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        console.log("/api/me response:", data);
        setUser(data);
        setAuthChecked(true);
      })
      .catch((err) => {
        console.warn("Auth check failed:", err);
        setUser(null);
        setAuthChecked(true);
      });
  }, []);

  // Socket handler
  useEffect(() => {
    const handleNewMessage = (msg) => {
      setMessages((prev) => {
        const updated = [msg, ...prev];
        const topLevel = updated.filter(m => !m.reply_to);
        const repliesMap = {};
        for (const m of updated) {
          if (m.reply_to) {
            if (!repliesMap[m.reply_to]) repliesMap[m.reply_to] = [];
            repliesMap[m.reply_to].push(m);
          }
        }
        return topLevel.map(msg => ({ ...msg, replies: repliesMap[msg.id] || [] }));
      });
    };

    socket.on("new_message", handleNewMessage);
    return () => socket.off("new_message", handleNewMessage);
  }, []);

  // Message interaction methods (post, edit, like, delete)
  const handlePostMessage = () => {
    if (!user) return alert("Login required to post.");
    if (!newMessage.title || !newMessage.content) return;

    const endpoint = editingId ? `/api/messages/${editingId}` : "/api/messages";
    const method = editingId ? "PUT" : "POST";

    fetch(`https://acrophobia-backend-2.onrender.com${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: newMessage.title,
        content: newMessage.content,
        replyTo: newMessage.replyTo
      })
    })
      .then((res) => res.json())
      .then(() => {
        setNewMessage({ title: "", content: "", replyTo: null });
        setEditingId(null);
      })
      .catch(console.error);
  };

  const handleDelete = (id) => {
    fetch(`https://acrophobia-backend-2.onrender.com/api/messages/${id}`, {
      method: "DELETE",
      credentials: "include"
    }).then((res) => res.json()).catch(console.error);
  };

  const handleLike = (id) => {
    fetch(`https://acrophobia-backend-2.onrender.com/api/messages/${id}/like`, {
      method: "POST",
      credentials: "include"
    }).catch(console.error);
  };

  const handleReply = (msg) => {
    setNewMessage({ title: `Re: ${msg.title}`, content: `@${msg.username} `, replyTo: msg.id });
    inputRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEdit = (msg) => {
    setNewMessage({ title: msg.title, content: msg.content, replyTo: msg.reply_to });
    setEditingId(msg.id);
    inputRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startIdx = (currentPage - 1) * messagesPerPage;
  const currentMessages = messages.slice(startIdx, startIdx + messagesPerPage);
  const totalPages = Math.ceil(messages.length / messagesPerPage);

  const renderReplies = (msg) => {
    if (!msg.replies?.length) return null;
    return (
      <div className="mt-2 space-y-2 ml-4">
        {msg.replies.map((reply, i) => (
          <div key={i} className="bg-blue-800 text-sm text-white rounded p-3 border-l-4 border-blue-500">
            <p className="text-blue-100">{reply.content}</p>
            <p className="text-blue-300 text-xs mt-1">↳ by {reply.username || "Guest"} · {new Date(reply.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {!authChecked ? (
        <div className="text-white text-center py-12 text-xl">Checking session...</div>
      ) : (
        <div>
             <header className="sticky top-0 z-50 bg-black border-b border-blue-800 shadow-md py-4 px-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-red-600 drop-shadow-[0_0_6px_orange]">Acrophobia</h1>
          {user && typeof user === "object" && user.username ? (
            <span className="text-blue-300 text-sm">Logged in as {user.username}</span>
          ) : (
            <span className="text-red-400 text-sm">Not logged in</span>
          )}
        </header>

        <section className="text-center py-6 px-5">
        <h1 className="text-4xl font-bold text-red-600 drop-shadow-[0_0_3px_orange] mb-2">The Fear Of Acronyms</h1>
        <p className="text-lg text-blue-100 max-w-xl mx-auto">
          The acronym battle game where wit wins. Submit hilarious expansions, vote for the best, and climb the leaderboard!
        </p>
        <div className="mt-8 flex justify-center gap-4 text-3xl">
          <a
            href="https://acrophobia-play.onrender.com"
            className="bg-red-600 text-white font-semibold px-8 py-4 rounded-md shadow hover:bg-red-500 transition"
          >
            Play Now
          </a>
        </div>
      </section>
<section className="py-2 px-5 text-center">
        <h2 className="text-2xl font-semibold mb-6 text-orange-300">How It Works</h2>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          {["Get an Acronym", "➜", "Write Something Clever", "➜", "Vote for the Funniest", "➜", "Climb the Leaderboard"].map((text, i) => (
            <div key={i} className="text-white font-medium text-center">
              <span className={text === "➜" ? "text-6xl text-orange-400 leading-tight" : "text-lg"}>{text}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-blue-950 py-12 px-4 border-y border-blue-800" style={{ backgroundImage: "url('/acrophobia-2_background.gif')", backgroundRepeat: "repeat" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
            <h2 className="text-3xl font-bold text-orange-400 drop-shadow">{stats.totalPlayers}</h2>
            <p className="text-sm text-blue-200">Players Joined</p>
          </div>
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
            <h2 className="text-3xl font-bold text-orange-400 drop-shadow">{stats.gamesToday}</h2>
            <p className="text-sm text-blue-200">Games Today</p>
          </div>
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
            <h2 className="text-3xl font-bold text-orange-400 drop-shadow">{stats.roomsLive}</h2>
            <p className="text-sm text-blue-200">Active Rooms</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-center text-orange-300 mb-10">Leaderboard</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
            <h3 className="text-xl text-yellow-300 mb-4">🔥 Top 10 Today</h3>
            <ul className="space-y-2">
              {stats.top10Daily.map((p, i) => (
                <li key={i} className="bg-blue-800 px-4 py-2 rounded text-white flex justify-between">
                  <span>{i + 1}. {p.username}</span>
                  <span>{p.total_points} pts</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
            <h3 className="text-xl text-yellow-300 mb-4">🏆 Top 10 This Week</h3>
            <ul className="space-y-2">
              {stats.top10Weekly.map((p, i) => (
                <li key={i} className="bg-blue-800 px-4 py-2 rounded text-white flex justify-between">
                  <span>{i + 1}. {p.username}</span>
                  <span>{p.total_points} pts</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      

      <section className="py-16 px-6 max-w-4xl mx-auto bg-blue-950 rounded-lg border border-blue-700 mb-5" ref={inputRef}>
        <h2 className="text-xl text-orange-300 mb-6 text-center">📬 Message Board</h2>
        {user?.username ? (
          <div className="mb-6">
            <input
              type="text"
              className="w-full mb-2 p-2 rounded text-black"
              placeholder="Title"
              value={newMessage.title}
              onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
            />
            <textarea
              className="w-full mb-2 p-2 rounded text-black"
              placeholder="Your message..."
              value={newMessage.content}
              onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
            ></textarea>
            <button onClick={handlePostMessage} className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded">
              {editingId ? "Update" : "Post"}
            </button>
          </div>
        ) : (
          <p className="text-blue-300 text-center">
            Please <a href="/login" className="underline text-orange-300">log in</a> to post.
          </p>
        )}

        <div className="space-y-4">
          {currentMessages.map((msg, i) => (
            <div key={i} className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-300">{msg.title}</h3>
              <p className="text-blue-100">{msg.content}</p>
              <p className="text-blue-300 text-sm mt-1">by {msg.username || "Guest"} · {new Date(msg.timestamp).toLocaleString()}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => handleReply(msg)} className="text-sm text-orange-300 hover:underline">Reply</button>
                <button onClick={() => handleEdit(msg)} className="text-sm text-green-300 hover:underline">Edit</button>
                <button onClick={() => handleDelete(msg.id)} className="text-sm text-red-400 hover:underline">Delete</button>
                <button onClick={() => handleLike(msg.id)} className="text-sm text-yellow-300 hover:underline">👍 {msg.likes || 0}</button>
              </div>
              {renderReplies(msg)}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-orange-400 text-black" : "bg-blue-800 text-white"}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </section> 
        </div>
      )}
    </div>
  );
}
