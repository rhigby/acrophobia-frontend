import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Acrophobia from "./pages/Acrophobia";
import Yahtzee from "./pages/yahtzee";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-black text-white p-6 text-center">
        <h1 className="text-4xl font-bold mb-6">🎮 Game Lobby</h1>
        <div className="space-x-4">
          <Link to="/acrophobia" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
            Play Acrophobia
          </Link>
          <Link to="/yahtzee" className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
            Play Yahtzee
          </Link>
        </div>

        <Routes>
          <Route path="/acrophobia" element={<Acrophobia />} />
          <Route path="/yahtzee" element={<Yahtzee />} />
        </Routes>
      </div>
    </Router>
  );
}



























































