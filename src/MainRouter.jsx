import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landingpage';
import App from './App';

export default function MainRouter() {
  console.log("MainRouter is rendering");
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/play" element={<App />} />
      </Routes>
    </Router>
  );
}

