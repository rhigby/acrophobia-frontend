// src/components/StickyHeader.jsx
import { motion } from "framer-motion";

export default function StickyHeader({ username, setProfileView, logout }) {
  return (
    <motion.header
      className="sticky top-0 z-50 w-full bg-blue-950 border-b border-blue-800 shadow-md"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-white">
        
        {/* Game Title */}
        <div className="text-3xl font-extrabold tracking-wide text-red-600"
          style={{
            textShadow: "0 0 8px orange, 0 0 12px orange",
            fontFamily: "Impact, sans-serif",
          }}
        >
          ACROPHOBIA
        </div>

        {/* User + Links */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-blue-200">
          <span>👤 {username}</span>

          <button
            onClick={() => setProfileView("profile")}
            className="hover:underline text-blue-400"
          >
            My Profile
          </button>

          <button
            onClick={() => setProfileView("stats")}
            className="hover:underline text-blue-400"
          >
            Game Stats
          </button>

          <button
            onClick={logout}
            className="hover:underline text-red-400"
          >
            Logout
          </button>
        </div>
      </div>
    </motion.header>
  );
}

