import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import landingpage from './pages/landingpage';
import App from './App';
//import Login from './pages/Login';

export default function MainRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<landingpage />} />
        <Route path="/play/*" element={<App />} />
        
      </Routes>
    </Router>
  );
}
