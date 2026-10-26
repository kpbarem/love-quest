import { Routes, Route } from "react-router-dom";
import LoveQuestRetroGame from "./components/LoveQuestRetroGame";
import DigitalScrapbook from "./components/DigitalScrapbook";
import OrderAKev from "./components/OrderAKev";
import CutieCaptcha from "./components/CutieCaptcha";
import WouldYouRather from "./components/WouldYouRather";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LoveQuestRetroGame />} />
            <Route path="/scrapbook" element={<DigitalScrapbook />} />
            <Route path="/scrapbook/:bookId/view" element={<DigitalScrapbook />} />
            <Route path="/order-a-kev" element={<OrderAKev />} />
            <Route path="/security-check" element={<CutieCaptcha />} />
            <Route path="/would-you-rather" element={<WouldYouRather />} />
        </Routes>
    );
}