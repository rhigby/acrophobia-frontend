import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landingpage';
import GameApp from './App';
//import Login from './pages/Login';

export default function MainRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/play/*" element={<GameApp />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}
