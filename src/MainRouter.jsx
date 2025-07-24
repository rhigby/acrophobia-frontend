import { HashRouter as Router } from 'react-router-dom';
import LandingPage from './pages/landingpage';
import App from './App';
// import Login from './pages/Login';

export default function MainRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/play" element={<App />} />
        {/* <Route path="/login" element={<Login />} /> */}
      </Routes>
    </Router>
  );
}

