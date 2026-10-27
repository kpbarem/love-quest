import { Link } from "react-router-dom";
import "./KevandraArcade.css";

export default function KevandraArcade() {
    return (
        <main className="arcade-page">
            <div className="arcade-shell">
                <header className="arcade-header">
                    <Link to="/" className="arcade-back">
                        ← LOVE QUEST
                    </Link>
                </header>

                <section className="arcade-intro">
                    <h1>KEVANDRA ARCADE</h1>
                </section>

                <section className="arcade-games">
                    <Link to="/would-you-rather" className="arcade-game">
                        <div className="arcade-game-art arcade-game-wyr">
                            <span className="arcade-choice-a">A</span>
                            <span className="arcade-or">OR</span>
                            <span className="arcade-choice-b">B</span>
                        </div>

                        <div className="arcade-game-details">
                            <span className="arcade-game-label">THE CLASSIC</span>
                            <h2>Would You Rather?</h2>
                            <span className="arcade-play">PLAY →</span>
                        </div>
                    </Link>

                    <Link to="/wavelength" className="arcade-game">
                        <div className="arcade-game-art arcade-game-wave">
                            <div className="arcade-spectrum">
                                <span className="arcade-spectrum-marker" />
                            </div>
                            <span className="arcade-wave-caption">
                                HOW CLOSE CAN YOU GET?
                            </span>
                        </div>

                        <div className="arcade-game-details">
                            <span className="arcade-game-label">THE MIND READER</span>
                            <h2>Wavelength</h2>
                            <span className="arcade-play">PLAY →</span>
                        </div>
                    </Link>
                </section>

                <footer className="arcade-footer">
                    🎵Let's play a love game. Play a love game🎵
                </footer>
            </div>
        </main>
    );
}