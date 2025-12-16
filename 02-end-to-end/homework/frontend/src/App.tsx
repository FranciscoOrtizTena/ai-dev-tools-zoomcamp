import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Room from "./pages/Room";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/r/:roomId" element={<Room />} />
    </Routes>
  );
}

export default App;
