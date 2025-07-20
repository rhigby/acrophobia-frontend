// This file will be created to relocate the Message Board component
// from the Landing Page to the Game Play interface

import { useState, useEffect, useRef } from "react";

export default function MessageBoard({ user, socket }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ title: "", content: "", replyTo: null });
  const [editingId, setEditingId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch("https://acrophobia-backend-2.onrender.com/api/messages", {
      credentials: "include"
    })
      .then((res) => res.json())
      .then(setMessages)
      .catch(console.error);
  }, []);

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
    socket?.on("new_message", handleNewMessage);
    return () => socket?.off("new_message", handleNewMessage);
  }, [socket]);

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

  const renderReplies = (msg) => {
    if (!msg.replies || !msg.replies.length) return null;
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
    <section className="py-6 px-4 max-w-4xl mx-auto bg-blue-950 rounded-lg border border-blue-700 mt-5" ref={inputRef}>
      <h2 className="text-xl text-orange-300 mb-4 text-center">📬 Message Board</h2>
      {user?.username ? (
        <div className="mb-4">
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
        {messages.map((msg, i) => (
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
    </section>
  );
}
