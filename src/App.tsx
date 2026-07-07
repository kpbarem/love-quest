import { Routes, Route } from "react-router-dom";
import LoveQuestRetroGame from "./components/LoveQuestRetroGame";
import DigitalScrapbook from "./components/DigitalScrapbook";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LoveQuestRetroGame />} />
            <Route path="/scrapbook" element={<DigitalScrapbook />} />
        </Routes>
    );
}