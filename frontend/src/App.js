import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Subscribe from "./pages/Subscribe";
import Verify from "./pages/Verify";
import Faucet from "./pages/Faucet";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Subscribe />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/faucet" element={<Faucet />} />
      </Routes>
    </Router>
  );
}

export default App;
