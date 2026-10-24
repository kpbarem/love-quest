import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./CutieCaptcha.css";

type Tile = {
  id: number;
  image: string;
  alt: string;
};

const kevImages: Tile[] = [
  { id: 1, image: "/kev-captcha/kev-1.jpg", alt: "Kev photo 1" },
  { id: 2, image: "/kev-captcha/kev-2.jpg", alt: "Kev photo 2" },
  { id: 3, image: "/kev-captcha/kev-3.jpg", alt: "Kev photo 3" },
  { id: 4, image: "/kev-captcha/kev-4.jpg", alt: "Kev photo 4" },
  { id: 5, image: "/kev-captcha/kev-5.jpg", alt: "Kev photo 5" },
  { id: 6, image: "/kev-captcha/kev-6.jpg", alt: "Kev photo 6" },
  { id: 7, image: "/kev-captcha/kev-7.jpg", alt: "Kev photo 7" },
  { id: 8, image: "/kev-captcha/kev-8.jpg", alt: "Kev photo 8" },
  { id: 9, image: "/kev-captcha/kev-9.jpg", alt: "Kev photo 9" },
];

export default function CutieCaptcha() {
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const allSelected = useMemo(
    () => selected.length === kevImages.length,
    [selected.length]
  );

  const toggleTile = (id: number) => {
    if (submitted) return;

    setSelected((current) =>
      current.includes(id)
        ? current.filter((tileId) => tileId !== id)
        : [...current, id]
    );
  };

  const handleVerify = () => {
    setSubmitted(true);
  };

  const reset = () => {
    setSelected([]);
    setSubmitted(false);
  };

  return (
    <div className="captcha-page">
      <div className="captcha-shell">
        <header className="captcha-header">
          <div>
            <div className="captcha-eyebrow">LOVE QUEST SECURITY SYSTEM</div>
            <h1>SECURITY CHECK</h1>
          </div>

          <Link to="/" className="captcha-home-link">
            ← LOVE QUEST
          </Link>
        </header>

        <div className="captcha-card">
          {!submitted ? (
            <>
              <div className="captcha-title-row">
                <div>
                  <h2>Select all images containing cuties who deserves a kiss</h2>
                  <p>
                    If there are none, that would be surprising and honestly
                    upsetting.
                  </p>
                </div>

                <div className="captcha-badge">CAPTCHA</div>
              </div>

              <div className="captcha-grid">
                {kevImages.map((tile) => {
                  const isSelected = selected.includes(tile.id);

                  return (
                    <button
                      key={tile.id}
                      type="button"
                      className={`captcha-tile ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleTile(tile.id)}
                    >
                      <img src={tile.image} alt={tile.alt} />
                      <span className="captcha-check">
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="captcha-footer">
                <div className="captcha-status">
                  Selected: {selected.length} / {kevImages.length}
                </div>

                <button
                  type="button"
                  className="captcha-verify-button"
                  onClick={handleVerify}
                >
                  VERIFY
                </button>
              </div>
            </>
          ) : (
            <div className="captcha-result">
              {allSelected ? (
                <>
                  <div className="captcha-result-label success">
                    VERIFICATION SUCCESSFUL
                  </div>
                  <h2>Excellent work.</h2>
                  <p>
                    You correctly identified every known cutie in the
                    security grid.
                  </p>
                  <p className="captcha-love-note">
                    Access granted to the most beautiful girl in the world. ❤️
                  </p>
                </>
              ) : (
                <>
                  <div className="captcha-result-label error">
                    VERIFICATION INCOMPLETE
                  </div>
                  <h2>Hmm. Interesting.</h2>
                  <p>
                    Our system believes you may have missed one or more cuties
                  </p>
                  <p className="captcha-love-note">
                    Please try again  
                  </p>
                </>
              )}

              <div className="captcha-result-actions">
                {!allSelected && (
                  <button
                    type="button"
                    className="captcha-secondary-button"
                    onClick={reset}
                  >
                    TRY AGAIN
                  </button>
                )}

                <button
                  type="button"
                  className="captcha-primary-button"
                  onClick={() => {
                    window.location.href = "/order-a-kev";
                  }}
                >
                  CONTINUE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}