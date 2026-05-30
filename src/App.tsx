import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Trophy, MapPin, RotateCcw } from "lucide-react";

type Destination = {
  name: string;
  subtitle: string;
  emoji: string;
  sky: string;
  scene: "moscow" | "batumi" | "goldenGate" | "moon";
};

type PlayerKey = "kevin" | "alexandra";

const players: Record<PlayerKey, { name: string; avatar: string; partner: string; partnerAvatar: string; special: string }> = {
  kevin: {
    name: "Kevin",
    avatar: "😎",
    partner: "Alexandra",
    partnerAvatar: "🧜‍♀️",
    special: "Cool Kev vibes",
  },
  alexandra: {
    name: "Alexandra",
    avatar: "🧜‍♀️",
    partner: "Kevin",
    partnerAvatar: "😎",
    special: "Butterfly Magic",
  },
};

type GamePhase = "level" | "boss" | "ending";

const destinations: Destination[] = [
  {
    name: "Moscow Library Dinner Date",
    subtitle: "Where our story first became magical.",
    emoji: "📚",
    sky: "from-orange-900 via-purple-900 to-slate-950",
    scene: "moscow",
  },
  {
    name: "Batumi Romantic Beach Walk",
    subtitle: "A seaside chapter with hearts unlocked.",
    emoji: "🌊",
    sky: "from-slate-950 via-blue-950 to-indigo-950",
    scene: "batumi",
  },
  {
    name: "Golden Gate Bridge",
    subtitle: "Future quest: two players, one bridge.",
    emoji: "🌉",
    sky: "from-sky-400 via-yellow-300 to-orange-400",
    scene: "goldenGate",
  },
  {
    name: "Moon Picnic",
    subtitle: "Just us under the stars.",
    emoji: "🌙",
    sky: "from-slate-950 via-indigo-950 to-black",
    scene: "moon",
  },

];

const levelLength = 17;

function makeLevel(destinationIndex: number) {
  const destination = destinations[destinationIndex];

  return Array.from({ length: levelLength }, (_, i) => {
    if (i === levelLength - 1) return "finish";
    if (i === 0) return "start";

    if (destination.scene === "moon") {
      if ([3, 6, 10, 14].includes(i)) return "butterfly";
      return "empty";
    }

    if ([4, 9, 13].includes(i)) return "уёбок";
    if ((i + destinationIndex) % 2 === 0) return "butterfly";
    return "empty";
  });
}


function LevelScenery({ scene }: { scene: Destination["scene"] }) {
  if (scene === "moscow") {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/30 via-purple-900/40 to-slate-950" />
        <div className="absolute top-10 left-8 right-8 h-32 grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-t-2xl border-4 border-amber-900 bg-slate-950/70 overflow-hidden">
              <div className="h-full bg-gradient-to-b from-orange-300/60 to-blue-950/80" />
              <div className="relative -top-20 text-3xl tracking-widest opacity-80">✨ ✨ ✨</div>
            </div>
          ))}
        </div>
        <div className="absolute left-0 bottom-32 w-20 h-40 bg-amber-950 border-r-4 border-amber-800" />
        <div className="absolute right-0 bottom-32 w-20 h-40 bg-amber-950 border-l-4 border-amber-800" />
        <div className="absolute left-2 bottom-40 text-3xl leading-tight">📕<br />📘<br />📗</div>
        <div className="absolute right-2 bottom-40 text-3xl leading-tight">📙<br />📚<br />📖</div>
        <div className="absolute left-0 right-0 bottom-0 h-32 bg-amber-950 border-t-4 border-amber-700" />
        <div className="absolute left-0 right-0 bottom-24 h-16 bg-amber-800/90 border-y-4 border-yellow-600" />
      </>
    );
  }

  if (scene === "batumi") {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950 to-cyan-950" />
        <div className="absolute top-8 right-12 text-7xl drop-shadow-lg">🌕</div>

        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,white,transparent_1.5%),radial-gradient(circle_at_50%_10%,white,transparent_1.5%),radial-gradient(circle_at_75%_25%,white,transparent_1.5%)]" />

        <div className="absolute left-0 right-0 bottom-24 h-40 bg-blue-900/80 border-t-4 border-cyan-700" />
        <div className="absolute left-0 right-0 bottom-32 h-8 bg-cyan-200/20" />

        <div className="absolute left-0 right-0 bottom-0 h-32 bg-stone-800 border-t-4 border-stone-500" />
        <div className="absolute left-0 right-0 bottom-24 h-16 bg-stone-600/95 border-y-4 border-stone-400" />

        <div className="absolute bottom-24 left-6 text-6xl">🪨</div>
        <div className="absolute bottom-28 right-14 text-6xl">🪨</div>
        <div className="absolute bottom-32 left-1/2 text-4xl">🪨</div>
      </>
    );
  }
  if (scene === "moon") {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950 to-slate-950" />

        <div className="absolute top-8 left-10 text-7xl opacity-90">🌎</div>
        <div className="absolute top-10 right-12 text-5xl">☄️</div>

        <motion.div
          animate={{ x: [-80, 900], y: [0, 120], opacity: [0, 1, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2 }}
          className="absolute top-10 left-0 text-4xl"
        >
          ✨
        </motion.div>

        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_20%,white,transparent_1.5%),radial-gradient(circle_at_50%_10%,white,transparent_1.5%),radial-gradient(circle_at_75%_25%,white,transparent_1.5%),radial-gradient(circle_at_85%_40%,white,transparent_1.5%)]" />

        <div
          className="absolute left-0 right-0 bottom-0 h-44 bg-slate-400"
          style={{
            clipPath:
              "polygon(0% 35%, 12% 28%, 25% 38%, 40% 22%, 55% 35%, 70% 25%, 88% 38%, 100% 28%, 100% 100%, 0% 100%)",
          }}
        />

        <div className="absolute left-0 right-0 bottom-24 h-16 bg-slate-300/90 border-y-4 border-slate-100" />

        <div className="absolute bottom-28 left-10 text-4xl">🪨</div>
        <div className="absolute bottom-32 right-16 text-4xl">💎</div>
        <div className="absolute bottom-28 left-1/2 text-4xl">🧺</div>
      </>
    );
  }

  return (

    <>
      {/* sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-yellow-100 to-orange-200" />

      {/* sun */}
      <div className="absolute top-8 right-12 text-7xl">☀️</div>

      {/* distant SF skyline */}
      <div className="absolute left-0 right-0 bottom-44 flex items-end gap-2 px-6 opacity-70">
        <div className="w-10 h-24 bg-slate-700 rounded-t-lg" />
        <div className="w-14 h-32 bg-slate-800 rounded-t-lg" />
        <div className="w-8 h-20 bg-slate-700 rounded-t-lg" />
        <div className="w-16 h-40 bg-slate-900 rounded-t-lg" />
        <div className="w-10 h-28 bg-slate-700 rounded-t-lg" />
        <div className="w-20 h-36 bg-slate-800 rounded-t-lg" />
        <div className="w-8 h-18 bg-slate-700 rounded-t-lg" />
      </div>

      {/* distant Golden Gate bridge */}
      <svg
        className="absolute left-[48%] -translate-x-1/2 bottom-40 w-[42rem] max-w-[70%] h-44 opacity-85"
        viewBox="0 0 700 220"
        preserveAspectRatio="none"
      >
        {/* deck */}
        <rect x="35" y="150" width="630" height="12" fill="#991b1b" />
        <rect x="35" y="162" width="630" height="8" fill="#7f1d1d" />

        {/* towers */}
        <rect x="165" y="55" width="28" height="120" fill="#b91c1c" />
        <rect x="507" y="55" width="28" height="120" fill="#b91c1c" />

        {/* tower tops */}
        <rect x="158" y="48" width="42" height="10" fill="#991b1b" />
        <rect x="500" y="48" width="42" height="10" fill="#991b1b" />

        {/* main connected suspension cables */}
        <path
          d="M35 150 L179 55 Q350 0 521 55 L665 150"
          fill="none"
          stroke="#dc2626"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* second cable for depth */}
        <path
          d="M35 160 L179 75 Q350 25 521 75 L665 160"
          fill="none"
          stroke="#991b1b"
          strokeWidth="3"
          strokeLinecap="round"
        />

        vertical suspenders
        {Array.from({ length: 15 }).map((_, i) => {
          const x = 70 + i * 40;
          const yTop =
            x < 179
              ? 150 - ((x - 35) / (179 - 35)) * 95
              : x > 521
                ? 55 + ((x - 521) / (665 - 521)) * 95
                : 55 - Math.sin(((x - 179) / (521 - 179)) * Math.PI) * 31;

          return (
            <line
              key={i}
              x1={x}
              y1={yTop}
              x2={x}
              y2="150"
              stroke="#7f1d1d"
              strokeWidth="2"
              opacity="0.8"
            />
          );
        })}

        {/* tower cutouts */}
        <rect x="172" y="78" width="14" height="22" fill="#fef3c7" opacity="0.55" />
        <rect x="172" y="118" width="14" height="22" fill="#fef3c7" opacity="0.45" />
        <rect x="514" y="78" width="14" height="22" fill="#fef3c7" opacity="0.55" />
        <rect x="514" y="118" width="14" height="22" fill="#fef3c7" opacity="0.45" />
      </svg>

      {/* bridge cables */}
      {/* <div className="absolute left-[38%] right-[38%] bottom-64 h-20 border-t-4 border-red-700 rounded-[50%]" /> */}

      {/* distant rolling hills */}
      <div
        className="absolute left-0 right-0 bottom-28 h-44 bg-green-800/80"
        style={{
          clipPath:
            "polygon(0% 70%, 15% 35%, 32% 60%, 48% 25%, 62% 55%, 78% 30%, 100% 60%, 100% 100%, 0% 100%)",
        }}
      />

      {/* foreground rolling hills */}
      <div
        className="absolute left-0 right-0 bottom-0 h-48 bg-green-700"
        style={{
          clipPath:
            "polygon(0% 40%, 12% 25%, 28% 38%, 45% 18%, 58% 34%, 72% 20%, 86% 32%, 100% 18%, 100% 100%, 0% 100%)",
        }}
      />

      {/* painted houses */}
      {/* <div className="absolute left-12 bottom-32 flex gap-2">
        <div className="w-10 h-12 bg-pink-200 border-2 border-pink-400 rounded-t-lg" />
        <div className="w-10 h-14 bg-yellow-200 border-2 border-yellow-400 rounded-t-lg" />
        <div className="w-10 h-11 bg-blue-200 border-2 border-blue-400 rounded-t-lg" />
      </div>

      <div className="absolute right-16 bottom-36 flex gap-2">
        <div className="w-9 h-10 bg-purple-200 border-2 border-purple-400 rounded-t-lg" />
        <div className="w-11 h-15 bg-orange-200 border-2 border-orange-400 rounded-t-lg" />
      </div> */}

      {/* playable path */}
      <div className="absolute left-0 right-0 bottom-24 h-16 bg-yellow-800/95 border-y-4 border-yellow-600" />

      {/* grassy foreground */}
      <div className="absolute left-0 right-0 bottom-0 h-24 bg-green-700 border-t-4 border-green-500" />

      {/* flowers */}
      <div className="absolute left-10 bottom-24 text-3xl">🌼</div>
      <div className="absolute right-16 bottom-28 text-3xl">🌸</div>
    </>
  );
}
export default function LoveQuestRetroGame() {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerKey>("kevin");
  const [destinationIndex, setDestinationIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const [butterflies, setButterflies] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [message, setMessage] = useState("Choose your player. Collect butterflies. Jump over ugly уёбки. Reach the date destination!");
  const [collected, setCollected] = useState<Record<string, boolean>>({});
  const [gameOver, setGameOver] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpStart, setJumpStart] = useState<number | null>(null);
  const [jumpEnd, setJumpEnd] = useState<number | null>(null);
  const [specialUsed, setSpecialUsed] = useState(false);
  const [specialActive, setSpecialActive] = useState(false);
  const [destroyedEnemies, setDestroyedEnemies] = useState<Record<string, boolean>>({});

  const destination = destinations[destinationIndex];
  const player = players[selectedPlayer];
  const displayAvatar = destination.scene === "moon" ? "😎❤️🧜‍♀️" : player.avatar;
  const level = useMemo(() => makeLevel(destinationIndex), [destinationIndex]);

  const keyForTile = (index: number) => `${destinationIndex}-${index}`;
  const [gamePhase, setGamePhase] = useState<GamePhase>("level");
  const [bossHealth, setBossHealth] = useState(2);
  const [bossDefeated, setBossDefeated] = useState(false);
  const [lastJumpTime, setLastJumpTime] = useState(0);
  const [moonUnlocked, setMoonUnlocked] = useState(false);
  const moonAudioRef = useRef<HTMLAudioElement | null>(null);

  function reset(destIndex = destinationIndex, playerKey = selectedPlayer) {
    const nextDestination = destinations[destIndex];

    setSelectedPlayer(playerKey);
    setDestinationIndex(destIndex);
    setPosition(0);
    setButterflies(0);
    setHearts(5);

    if (nextDestination.scene === "moon") {
      setMessage("LUNAR COMMAND ALERT: KEVANDRA HAS BREACHED LUNAR SURFACE. PICNIC IMMINENT🌙🧺❤️");
    } else {
      setMessage(`${players[playerKey].name}'s quest started. ${players[playerKey].partner} is waiting at the destination.`);
    }

    setCollected({});
    setGameOver(false);
    setArrived(false);
    setIsJumping(false);
    setJumpStart(null);
    setJumpEnd(null);
    setSpecialUsed(false);
    setSpecialActive(false);
    setDestroyedEnemies({});
    setGamePhase("level");
    setBossHealth(2);
    setBossDefeated(false);
    setLastJumpTime(0);
  }

  function resolveTile(index: number, jumped = false) {
    const tile = level[index];
    const key = keyForTile(index);

    if (tile === "butterfly" && !collected[key]) {
      setButterflies((b) => b + 1);
      setCollected((prev) => ({ ...prev, [key]: true }));
      setMessage("You collected a butterfly. +1 tiny emotional support creature. 🦋");
      return;
    }

    if (tile === "уёбок") {
      if (jumped) {
        setMessage("Clean jump. Уёбок avoided. Absolutely no bad vibes today.");
        return;
      }

      setHearts((h) => {
        const nextHearts = h - 1;
        if (nextHearts <= 0) {
          setGameOver(true);
          setMessage("The уёбок energy was too strong. Restart and protect yourself");
        } else {
          setMessage("An уёбок appeared. -1 heart. Ну и мудак!");
        }
        return Math.max(0, nextHearts);
      });
      return;
    }

    if (tile === "finish") {
      setArrived(true);

      if (destination.scene === "goldenGate") {
        setGamePhase("boss");
        setMessage("TAKE HEED! Boss уёбок descends from thunderous clouds. Double jump or use your special!");
      } else if (destination.scene === "moon") {
        setMessage("Moon Picnic complete. Love you to the moon and back. 🌙❤️");
      } else {
        setMessage(`Destination reached: ${destination.name}. Date quest complete. ❤️ Press X to use ${player.special}.`);
      }

      return;
    }

    setMessage("The path seems peaceful but take heed!");
  }

  function move(direction: 1 | -1) {
    if (gameOver || arrived || isJumping) return;
    const next = Math.max(0, Math.min(levelLength - 1, position + direction));
    setPosition(next);
    resolveTile(next, false);
  }

  function jump() {
    if (gamePhase === "boss") {
      const now = Date.now();

      if (now - lastJumpTime < 450) {
        setLastJumpTime(0);
        hitBoss("doubleJump");
      } else {
        setLastJumpTime(now);
        setMessage("Jump once more quickly to strike the boss уёбок!");
      }

      return;
    }
    if (gameOver || arrived || isJumping) return;

    const next = Math.min(levelLength - 1, position + 2);
    const skipped = position + 1;
    const skippedTile = level[skipped];

    setIsJumping(true);
    setJumpStart(position);
    setJumpEnd(next);
    setMessage(skippedTile === "уёбок" ? "Jump! You sailed over the уёбок like a love ninja." : "Jump! Stylish, possibly unnecessary, still cool.");

    setTimeout(() => {
      setPosition(next);
      resolveTile(next, true);
      setIsJumping(false);
      setJumpStart(null);
      setJumpEnd(null);
    }, 520);
  }

  function useSpecial() {
    if (gamePhase === "boss") {
      hitBoss("special");
      return;
    }
    if (!arrived || specialUsed || specialActive) return;

    setSpecialActive(true);
    setSpecialUsed(true);
    setMessage(`${player.name} used ${player.special}! Fatality. Уёбки destroyed. 💥`);

    setTimeout(() => {
      const enemiesToDestroy: Record<string, boolean> = {};

      level.forEach((tile, i) => {
        if (tile === "уёбок") {
          enemiesToDestroy[keyForTile(i)] = true;
        }
      });

      setDestroyedEnemies(enemiesToDestroy);
    }, 450);

    setTimeout(() => {
      setSpecialActive(false);
    }, 900);
  }

  function hitBoss(method: "doubleJump" | "special") {
    if (gamePhase !== "boss" || bossDefeated) return;

    if (method === "special") {
      setBossHealth(0);
      setBossDefeated(true);
      setSpecialActive(true);
      setSpecialUsed(true);
      setMessage(`${player.name} used ${player.special}! Boss уёбок annihilated. Fatality. 💥`);

      setTimeout(() => {
        setSpecialActive(false);
        setMoonUnlocked(true);
        setGamePhase("ending");
        setMessage("The final уёбок has fallen. Secret destination unlocked: Moon Picnic 🌙");
      }, 1000);

      return;
    }

    setBossHealth((h) => {
      const next = h - 1;

      if (next <= 0) {
        setBossDefeated(true);
        setMessage("DOUBLE JUMP FINISHER! Boss уёбок defeated. Love wins. ❤️");

        setTimeout(() => {
          setMoonUnlocked(true);
          setGamePhase("ending");
          setMessage("The final уёбок has fallen. Secret destination unlocked: Moon Picnic 🌙");
        }, 900);
      } else {
        setMessage("Double jump hit! Boss уёбок is weakened. One more!");
      }

      return Math.max(0, next);
    });
  }

  function nextDestination() {
    const next = (destinationIndex + 1) % destinations.length;
    reset(next);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") move(1);
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") move(-1);
      if (e.key === " " || e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        e.preventDefault();
        jump();
      }
      if (e.key.toLowerCase() === "r") reset();
      if (e.key.toLowerCase() === "x") useSpecial();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (!moonAudioRef.current) return;

    if (destination.scene === "moon") {
      moonAudioRef.current.volume = 0.35;
      moonAudioRef.current.loop = true;

      moonAudioRef.current.play().catch(() => {
      });
    } else {
      moonAudioRef.current.pause();
      moonAudioRef.current.currentTime = 0;
    }
  }, [destination.scene]);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${destination.sky} text-white p-4 sm:p-8 font-mono overflow-hidden`}>
      <audio ref={moonAudioRef} src="/moon.mp3" />
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl sm:text-6xl font-black drop-shadow mt-2">Kevandra: Love Quest</h1>
            <p className="text-slate-300 mt-3">Run the path, collect butterflies, jump over уёбок, reach the date.</p>
          </div>
          <div className="rounded-2xl border-2 border-white/30 bg-black/40 px-4 py-3 text-right">
            <div className="text-sm text-slate-300">CURRENT DESTINATION</div>
            <div className="text-2xl font-bold">{destination.emoji} {destination.name}</div>
          </div>
        </header>
        <section className="grid sm:grid-cols-2 gap-4 mb-6">
          {(Object.keys(players) as PlayerKey[]).map((key) => {
            const p = players[key];
            const active = selectedPlayer === key;

            return (
              <button
                key={key}
                onClick={() => reset(destinationIndex, key)}
                className={`
          rounded-3xl border-4 p-4 text-left transition-all duration-200
          ${active
                    ? "border-cyan-300 bg-cyan-400/10 shadow-[0_0_25px_rgba(34,211,238,0.25)]"
                    : "border-white/20 bg-black/30 hover:bg-white/10"
                  }
        `}
              >
                <div className="text-sm text-slate-400 tracking-widest">
                  PLAY AS
                </div>

                <div className="text-3xl font-black mt-2 text-white">
                  {p.avatar} {p.name}
                </div>

                <div className="text-slate-300 mt-3">
                  Special:
                  <span className="text-cyan-200 font-bold ml-2">
                    {p.special}
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        <section className="rounded-3xl border-4 border-white/70 bg-black/50 shadow-2xl p-4 sm:p-6">
          <div className="grid sm:grid-cols-4 gap-4 mb-5">
            <div className="rounded-2xl bg-slate-950/80 border-2 border-white/20 p-4">
              <div className="text-slate-400 text-sm">PLAYER</div>
              <div className="text-3xl mt-2">{player.avatar} {player.name}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/80 border-2 border-white/20 p-4">
              <div className="text-slate-400 text-sm">HEARTS</div>
              <div className="text-2xl mt-2">{Array.from({ length: 5 }).map((_, i) => <span key={i}>{i < hearts ? "❤️" : "🖤"}</span>)}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/80 border-2 border-white/20 p-4">
              <div className="text-slate-400 text-sm">BUTTERFLIES</div>
              <div className="text-3xl mt-2">🦋 x {butterflies}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/80 border-2 border-white/20 p-4">
              <div className="text-slate-400 text-sm">PARTNER</div>
              <div className="text-3xl mt-2">{player.partnerAvatar} {player.partner}</div>
            </div>
          </div>

          <div
            className={`relative rounded-2xl overflow-hidden border-4 border-white/30 bg-gradient-to-t from-green-950 via-slate-900 to-slate-800 ${gamePhase === "ending" ? "min-h-[560px]" : "min-h-[360px]"
              }`}
          >
            {gamePhase !== "ending" ? (
              <>
                <LevelScenery scene={destination.scene} />

                <div className="absolute bottom-28 left-6 right-6 grid" style={{ gridTemplateColumns: `repeat(${levelLength}, minmax(34px, 1fr))` }}>
                  {level.map((tile, i) => {
                    const isCollected = collected[keyForTile(i)];
                    return (
                      <div key={i} className="relative h-20 flex items-center justify-center">
                        {tile === "butterfly" && !isCollected && <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.3 }} className="text-3xl">🦋</motion.div>}
                        {tile === "уёбок" && !destroyedEnemies[keyForTile(i)] && (
                          <motion.div
                            animate={{ rotate: [-3, 3, -3] }}
                            transition={{ repeat: Infinity, duration: 0.35 }}
                            className="text-4xl"
                          >
                            👹
                          </motion.div>
                        )}
                        {tile === "finish" && <div className="text-5xl">{destination.emoji}</div>}
                        {i === position && !isJumping && (
                          <motion.div
                            layoutId="player"
                            className="absolute -bottom-1 text-5xl z-20 drop-shadow-lg"
                          >
                            {displayAvatar}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {isJumping && jumpStart !== null && jumpEnd !== null && (
                  <motion.div
                    initial={{
                      left: `calc(1.5rem + (${jumpStart} + 0.5) * ((100% - 3rem) / ${levelLength}))`,
                      bottom: "7.5rem",
                      y: 0,
                    }}
                    animate={{
                      left: `calc(1.5rem + (${jumpEnd} + 0.5) * ((100% - 3rem) / ${levelLength}))`,
                      y: [0, -95, 0],
                    }}
                    transition={{ duration: 0.52, ease: "easeOut" }}
                    className="absolute text-5xl z-30 drop-shadow-lg -translate-x-1/2"
                  >
                    {displayAvatar}
                  </motion.div>
                )}
                {specialActive && (
                  <motion.div
                    initial={{
                      left: `calc(1.5rem + (${position} + 0.5) * ((100% - 3rem) / ${levelLength}))`,
                      bottom: "8.5rem",
                      scale: 0.6,
                      opacity: 1,
                    }}
                    animate={{
                      left: "95%",
                      scale: [0.6, 1.4, 1],
                      opacity: [1, 1, 0],
                    }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className={`absolute z-40 h-14 w-24 rounded-full blur-sm ${selectedPlayer === "kevin"
                      ? "bg-cyan-300 shadow-[0_0_35px_15px_rgba(103,232,249,0.8)]"
                      : "bg-pink-300 shadow-[0_0_35px_15px_rgba(249,168,212,0.8)]"
                      }`}
                  />
                )}
                {gamePhase === "boss" && !bossDefeated && (
                  <motion.div
                    initial={{ y: -220, scale: 0.4, opacity: 0 }}
                    animate={{ y: 0, scale: [1.8, 1.6, 1.7], opacity: 1, rotate: [-3, 3, -3] }}
                    transition={{ duration: 0.9, repeat: Infinity, repeatType: "mirror" }}
                    className="absolute left-1/2 top-12 -translate-x-1/2 z-50 text-8xl drop-shadow-2xl"
                  >
                    👹
                    <div className="text-center text-lg mt-2 bg-black/70 border-2 border-red-400 rounded-xl px-3 py-1">
                      BOSS УЁБОК HP: {bossHealth}
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-slate-700 via-slate-900 to-black flex items-center justify-center p-6">
                <div className="w-full max-w-3xl text-center bg-slate-900/80 border-4 border-cyan-300/60 rounded-3xl p-6 flex flex-col items-center shadow-[0_0_40px_rgba(34,211,238,0.25)]">
                  <h2 className="text-4xl font-black text-cyan-100">
                    Finally Together ❤️
                  </h2>

                  <p className="text-lg mt-3 max-w-2xl text-slate-200">
                    All the уёбки are defeated. The distance disappears. Our love story continues.
                  </p>

                  <img
                    src="/us.png"
                    alt="Kevin and Alexandra"
                    className="mt-5 max-h-[300px] w-auto object-contain rounded-xl border-4 border-cyan-300/50 shadow-2xl"
                  />

                  {moonUnlocked && (
                    <button
                      onClick={() => reset(3)}
                      className="mt-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-6 py-3 font-black"
                    >
                      ✨ Secret Level: Moon Picnic 🌙
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-black border-2 border-white/40 p-4 min-h-24">
            <div className="text-green-300 text-sm mb-2">SYSTEM MESSAGE</div>
            <p className="text-lg sm:text-xl leading-relaxed">{message}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
            <button onClick={() => move(-1)} className="rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 transition p-4 font-black">← BACK</button>
            <button
              onClick={arrived || gamePhase === "boss" ? useSpecial : () => move(1)}
              disabled={arrived && specialUsed}
              className={`rounded-2xl active:scale-95 transition p-4 font-black ${arrived
                ? selectedPlayer === "kevin"
                  ? "bg-cyan-400 hover:bg-cyan-300 text-slate-950"
                  : "bg-pink-400 hover:bg-pink-300 text-slate-950"
                : "bg-pink-500 hover:bg-pink-400 text-white"
                } disabled:opacity-50`}
            >
              {gamePhase === "boss"
                ? `USE ${player.special.toUpperCase()} ✨`
                : arrived
                  ? specialUsed
                    ? "SPECIAL USED"
                    : `USE ${player.special.toUpperCase()} ✨`
                  : "FORWARD →"}
            </button>
            <button onClick={jump} className="rounded-2xl bg-cyan-400 text-slate-950 hover:bg-cyan-300 active:scale-95 transition p-4 font-black">JUMP ↑</button>
            <button onClick={() => reset()} className="rounded-2xl bg-slate-700 hover:bg-slate-600 active:scale-95 transition p-4 font-black flex items-center justify-center gap-2"><RotateCcw size={18} /> RESET</button>
            <button onClick={nextDestination} className="rounded-2xl bg-yellow-500 text-slate-950 hover:bg-yellow-400 active:scale-95 transition p-4 font-black">NEXT DATE</button>
          </div>

          <div className="mt-4 text-slate-300 text-sm">
            Controls: arrows / A-D to move. Space, W, or Up Arrow to jump. Press R to restart. Jump skips the next tile, so use it before уёбки.
          </div>
        </section>

        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          {destinations.filter((d) => d.scene !== "moon").map((d, i) => (
            <button key={d.name} onClick={() => reset(i)} className={`rounded-2xl border-2 p-4 text-left transition ${i === destinationIndex ? "border-pink-300 bg-pink-500/20" : "border-white/20 bg-black/30 hover:bg-white/10"}`}>
              <div className="flex items-center gap-2 text-xl font-bold"><MapPin size={18} /> {d.emoji} {d.name}</div>
              <p className="text-slate-300 text-sm mt-2">{d.subtitle}</p>
            </button>
          ))}
        </section>

        {arrived && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-3xl bg-pink-500/20 border-4 border-pink-300 p-6 text-center">
            <Trophy className="mx-auto text-yellow-300" size={42} />
            <h2 className="text-3xl font-black mt-3">Quest Complete</h2>
            <p className="text-xl mt-2">{player.name} reached {destination.name} with {butterflies} butterflies.</p>
            <p className="text-slate-200 mt-2">Achievement unlocked: {player.partner} smiles at the screen. Probably. Hopefully. Very important lore.</p>
            <button onClick={nextDestination} className="mt-5 rounded-2xl bg-white text-slate-950 px-6 py-3 font-black">Continue Story</button>
          </motion.div>
        )}

        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-3xl bg-red-500/20 border-4 border-red-300 p-6 text-center">
            <Heart className="mx-auto text-red-300" size={42} />
            <h2 className="text-3xl font-black mt-3">Vibes Defeated</h2>
            <p className="text-xl mt-2">The уёбки won this round. Unacceptable.</p>
            <button onClick={() => reset()} className="mt-5 rounded-2xl bg-white text-slate-950 px-6 py-3 font-black">Try Again</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
