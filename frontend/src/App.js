import Startup from "./pages/Startup";
import "./index.css";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import ChooseFiles from "./pages/ChooseFiles";
import Timeline from "./pages/Room";
import { Export } from "./pages/Export";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route exact path="/export" element={<Export />} />
          <Route exact path="/choosefiles" element={<ChooseFiles />} />
          <Route exact path="/newroom" element={<Timeline />} />
          <Route exact path="/" element={<Startup />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
