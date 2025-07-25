import { motion } from "framer-motion";

export default function StickyHeader({ username, setProfileView, logout }) {
  return (
    <motion.div
      className="sticky top-0 w-full z-50 bg-blue-950 border-b border-blue-800 shadow-md text-white"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="font-bold text-xl text-blue-300 tracking-wide">
          🎮 Acrophobia
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-blue-200">👤 {username}</span>
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
    </motion.div>
  );
}
