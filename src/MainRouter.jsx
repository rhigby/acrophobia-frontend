import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';

export default function MainRouter() {
  console.log("MainRouter is rendering");
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
      </Routes>
    </Router>
  );
}

