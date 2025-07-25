import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <-- This is essential
import MainRouter from './MainRouter';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MainRouter />
  </React.StrictMode>
);



