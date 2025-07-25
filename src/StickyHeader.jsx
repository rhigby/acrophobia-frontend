import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react"; // Or use plain icons

export default function StickyHeader({ username, setProfileView, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      className="sticky top-0 z-50 w-full bg-blue-950 border-b border-blue-800 shadow-md"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between text-white">

        {/* LEFT: Glowing Logo */}
        <div
          className="text-3xl font-extrabold tracking-wide text-red-600"
          style={{
            textShadow: "0 0 8px orange, 0 0 12px orange",
            fontFamily: "Impact, sans-serif",
          }}
        >
          ACROPHOBIA
        </div>

        {/* RIGHT: Desktop menu */}
        <div className="hidden sm:flex items-center gap-4 text-sm text-blue-200">
          <span>👤 {username}</span>
          <button onClick={() => setProfileView("profile")} className="hover:underline text-blue-400">My Profile</button>
          <button onClick={() => setProfileView("stats")} className="hover:underline text-blue-400">Game Stats</button>
          <button onClick={logout} className="hover:underline text-red-400">Logout</button>
        </div>

        {/* RIGHT: Mobile hamburger */}
        <button
          className="sm:hidden text-blue-200"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="sm:hidden px-4 pb-3 text-sm text-blue-200 bg-blue-950 border-t border-blue-800"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="py-2 border-b border-blue-800">👤 {username}</div>
            <button
              onClick={() => { setProfileView("profile"); setMenuOpen(false); }}
              className="block py-2 w-full text-left hover:underline text-blue-400"
            >
              My Profile
            </button>
            <button
              onClick={() => { setProfileView("stats"); setMenuOpen(false); }}
              className="block py-2 w-full text-left hover:underline text-blue-400"
            >
              Game Stats
            </button>
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="block py-2 w-full text-left hover:underline text-red-400"
            >
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}



