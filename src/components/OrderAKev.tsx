import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  activities,
  extras,
  kevOptions,
  type KevType,
} from "../data/kevCatalog";

import {
  createKevOrder,
  watchKevOrder,
  type KevOrderStatus,
} from "../lib/kevOrders";

import "./OrderAKev.css";

type Step =
  | "kev"
  | "activity"
  | "extras"
  | "review"
  | "tracking";

const statusSteps: {
  status: KevOrderStatus;
  label: string;
  emoji: string;
}[] = [
    {
      status: "requested",
      label: "Order Received",
      emoji: "📦",
    },
    {
      status: "notified",
      label: "Kev Notified",
      emoji: "📱",
    },
    {
      status: "accepted",
      label: "Kev Accepted",
      emoji: "❤️",
    },
    {
      status: "en_route",
      label: "Kev En Route",
      emoji: "🚗",
    },
    {
      status: "delivered",
      label: "Delivered",
      emoji: "💋",
    },
  ];

const statusOrder: KevOrderStatus[] = [
  "requested",
  "notified",
  "accepted",
  "en_route",
  "delivered",
];

export default function OrderAKev() {
  const [step, setStep] = useState<Step>("kev");

  const [selectedKev, setSelectedKev] =
    useState<KevType | null>(null);

  const [selectedActivity, setSelectedActivity] =
    useState<string | null>(null);

  const [selectedExtras, setSelectedExtras] =
    useState<string[]>([]);

  const [specialInstructions, setSpecialInstructions] =
    useState("");

  const [orderId, setOrderId] =
    useState<string | null>(null);

  const [orderStatus, setOrderStatus] =
    useState<KevOrderStatus>("requested");

  const [latestKevMessage, setLatestKevMessage] =
    useState("");

  const [submitting, setSubmitting] = useState(false);

  const [loadingMessage, setLoadingMessage] =
    useState("LOCATING KEV...");

  const selectedKevData = useMemo(
    () => kevOptions.find((kev) => kev.id === selectedKev),
    [selectedKev]
  );

  const selectedActivityData = useMemo(
    () =>
      activities.find(
        (activity) => activity.id === selectedActivity
      ),
    [selectedActivity]
  );

  const selectedExtraData = useMemo(
    () =>
      extras.filter((extra) =>
        selectedExtras.includes(extra.id)
      ),
    [selectedExtras]
  );

  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = watchKevOrder(orderId, (order) => {
      setOrderStatus(order.status);
      setLatestKevMessage(order.latestKevMessage ?? "");
    });

    return unsubscribe;
  }, [orderId]);

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((current) =>
      current.includes(extraId)
        ? current.filter((id) => id !== extraId)
        : [...current, extraId]
    );
  };

  const placeOrder = async () => {
    if (!selectedKev || !selectedActivity) return;

    setSubmitting(true);
    setLoadingMessage("LOCATING KEV...");

    const timer1 = window.setTimeout(
      () => setLoadingMessage("PACKING AFFECTION..."),
      600
    );

    const timer2 = window.setTimeout(
      () => setLoadingMessage("NOTIFYING KEV..."),
      1200
    );

    try {
      const newOrderId = await createKevOrder({
        kevType: selectedKev,
        activity: selectedActivity,
        extras: selectedExtras,
        specialInstructions: specialInstructions.trim(),
      });

      setOrderId(newOrderId);
      setStep("tracking");
    } catch (error) {
      console.error("Unable to order Kev", error);
      alert(
        "Kev ordering temporarily malfunctioned. Please poke Kevin manually."
      );
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setSubmitting(false);
    }
  };

  const resetOrder = () => {
    setStep("kev");
    setSelectedKev(null);
    setSelectedActivity(null);
    setSelectedExtras([]);
    setSpecialInstructions("");
    setOrderId(null);
    setOrderStatus("requested");
    setLatestKevMessage("");
  };

  const currentStatusIndex = statusOrder.indexOf(orderStatus);

  return (
    <div className="order-kev-page">
      <div className="order-kev-shell">
        <header className="order-kev-header">
          <div>
            <div className="order-kev-eyebrow">
              KEVANDRA DELIVERY NETWORK
            </div>

            <h1>ORDER A KEV™</h1>

            <p>
              Premium Kev delivery.
              <br />
              Exclusively serving Alexandra.
            </p>
          </div>

          <Link to="/" className="order-home-button">
            ← LOVE QUEST
          </Link>
        </header>

        {step !== "tracking" && (
          <div className="order-progress">
            <ProgressDot
              active={step === "kev"}
              complete={step !== "kev"}
              text="KEV"
            />

            <ProgressLine />

            <ProgressDot
              active={step === "activity"}
              complete={
                step === "extras" ||
                step === "review"
              }
              text="DATE"
            />

            <ProgressLine />

            <ProgressDot
              active={step === "extras"}
              complete={step === "review"}
              text="EXTRAS"
            />

            <ProgressLine />

            <ProgressDot
              active={step === "review"}
              complete={false}
              text="ORDER"
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "kev" && (
            <motion.main
              key="kev"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <SectionTitle
                number="01"
                title="CHOOSE YOUR KEV"
                subtitle="Select the Kev best suited to your current needs."
              />

              <div className="kev-grid">
                {kevOptions.map((kev) => {
                  const selected = selectedKev === kev.id;

                  return (
                    <button
                      key={kev.id}
                      type="button"
                      className={`kev-card ${selected ? "selected" : ""
                        }`}
                      onClick={() => setSelectedKev(kev.id)}
                    >
                      <div className="kev-image-container">
                        <img
                          src={kev.image}
                          alt={kev.name}
                          className="kev-image"
                        />

                        <span className="kev-card-emoji">
                          {kev.emoji}
                        </span>

                        {selected && (
                          <div className="selected-badge">
                            SELECTED ✓
                          </div>
                        )}
                      </div>

                      <div className="kev-card-body">
                        <h2>{kev.name}</h2>
                        <p>{kev.description}</p>

                        <div className="kev-price">
                          $0.00
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Navigation>
                <span />

                <button
                  disabled={!selectedKev}
                  onClick={() => setStep("activity")}
                  className="primary-order-button"
                >
                  CONTINUE WITH{" "}
                  {selectedKevData?.name.toUpperCase() ??
                    "KEV"}{" "}
                  →
                </button>
              </Navigation>
            </motion.main>
          )}

          {step === "activity" && (
            <motion.main
              key="activity"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <SectionTitle
                number="02"
                title="CHOOSE YOUR ADVENTURE"
                subtitle={`What would you like to do with ${selectedKevData?.name}?`}
              />

              <div className="activity-grid">
                {activities.map((activity) => {
                  const selected =
                    selectedActivity === activity.id;

                  return (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() =>
                        setSelectedActivity(activity.id)
                      }
                      className={`activity-card ${selected ? "selected" : ""
                        }`}
                    >
                      <div className="activity-emoji">
                        {activity.emoji}
                      </div>

                      <div>
                        <h3>{activity.name}</h3>
                        <p>{activity.description}</p>
                      </div>

                      {selected && (
                        <span className="activity-check">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <Navigation>
                <button
                  onClick={() => setStep("kev")}
                  className="secondary-order-button"
                >
                  ← BACK
                </button>

                <button
                  disabled={!selectedActivity}
                  onClick={() => setStep("extras")}
                  className="primary-order-button"
                >
                  CUSTOMIZE MY KEV →
                </button>
              </Navigation>
            </motion.main>
          )}

          {step === "extras" && (
            <motion.main
              key="extras"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <SectionTitle
                number="03"
                title="CUSTOMIZE YOUR KEV"
                subtitle="Optional enhancements. Most are suspiciously free."
              />

              <div className="extras-panel">
                {extras.map((extra) => {
                  const selected =
                    selectedExtras.includes(extra.id);

                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => toggleExtra(extra.id)}
                      className={`extra-row ${selected ? "selected" : ""
                        }`}
                    >
                      <span className="extra-checkbox">
                        {selected ? "✓" : ""}
                      </span>

                      <span className="extra-emoji">
                        {extra.emoji}
                      </span>

                      <span className="extra-name">
                        {extra.name}
                      </span>

                      <span className="extra-price">
                        {extra.priceLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="instructions-panel">
                <label htmlFor="kevInstructions">
                  SPECIAL DELIVERY INSTRUCTIONS
                </label>

                <textarea
                  id="kevInstructions"
                  value={specialInstructions}
                  onChange={(event) =>
                    setSpecialInstructions(
                      event.target.value.slice(0, 300)
                    )
                  }
                  placeholder="Tell your Kev anything..."
                  rows={5}
                />

                <div className="character-count">
                  {specialInstructions.length}/300
                </div>
              </div>

              <Navigation>
                <button
                  onClick={() => setStep("activity")}
                  className="secondary-order-button"
                >
                  ← BACK
                </button>

                <button
                  onClick={() => setStep("review")}
                  className="primary-order-button"
                >
                  REVIEW ORDER →
                </button>
              </Navigation>
            </motion.main>
          )}

          {step === "review" && (
            <motion.main
              key="review"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <SectionTitle
                number="04"
                title="REVIEW YOUR ORDER"
                subtitle="Please verify your Kev before deployment."
              />

              <div className="checkout-grid">
                <div className="checkout-kev">
                  {selectedKevData && (
                    <img
                      src={selectedKevData.image}
                      alt={selectedKevData.name}
                    />
                  )}
                </div>

                <div className="checkout-receipt">
                  <div className="receipt-line">
                    <span>PRODUCT</span>
                    <strong>
                      {selectedKevData?.emoji}{" "}
                      {selectedKevData?.name}
                    </strong>
                  </div>

                  <div className="receipt-line">
                    <span>ACTIVITY</span>
                    <strong>
                      {selectedActivityData?.emoji}{" "}
                      {selectedActivityData?.name}
                    </strong>
                  </div>

                  <div className="receipt-section">
                    <span>EXTRAS</span>

                    {selectedExtraData.length === 0 ? (
                      <strong>Standard Kev package</strong>
                    ) : (
                      selectedExtraData.map((extra) => (
                        <strong key={extra.id}>
                          {extra.emoji} {extra.name}
                        </strong>
                      ))
                    )}
                  </div>

                  {specialInstructions && (
                    <div className="receipt-section">
                      <span>
                        DELIVERY INSTRUCTIONS
                      </span>

                      <blockquote>
                        “{specialInstructions}”
                      </blockquote>
                    </div>
                  )}

                  <div className="receipt-divider" />

                  <div className="price-row">
                    <span>Subtotal</span>
                    <span>$0.00</span>
                  </div>

                  <div className="price-row">
                    <span>Kev Tax</span>
                    <span>$0.00</span>
                  </div>

                  <div className="price-row">
                    <span>Alexandra Discount</span>
                    <span>-$0.00</span>
                  </div>

                  <div className="total-row">
                    <span>TOTAL</span>
                    <span>ONE KISS 💋</span>
                  </div>
                </div>
              </div>

              <Navigation>
                <button
                  disabled={submitting}
                  onClick={() => setStep("extras")}
                  className="secondary-order-button"
                >
                  ← BACK
                </button>

                <button
                  disabled={submitting}
                  onClick={placeOrder}
                  className="place-order-button"
                >
                  {submitting
                    ? loadingMessage
                    : "❤️ ORDER MY KEV"}
                </button>
              </Navigation>
            </motion.main>
          )}

          {step === "tracking" && (
            <motion.main
              key="tracking"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="tracking-screen"
            >
              <div className="confirmation-heart">
                ❤️
              </div>

              <div className="order-confirmed-label">
                ORDER CONFIRMED
              </div>

              <h2>
                Your {selectedKevData?.name} has been
                requested.
              </h2>

              <p className="order-number">
                ORDER #
                {orderId
                  ?.slice(0, 8)
                  .toUpperCase()}
              </p>

              <div className="tracker">
                {statusSteps.map((status, index) => {
                  const complete =
                    index <= currentStatusIndex;

                  const current =
                    status.status === orderStatus;

                  return (
                    <div
                      key={status.status}
                      className="tracker-row"
                    >
                      <div
                        className={`tracker-dot ${complete ? "complete" : ""
                          } ${current ? "current" : ""
                          }`}
                      >
                        {complete
                          ? status.emoji
                          : "○"}
                      </div>

                      <div>
                        <div
                          className={
                            complete
                              ? "tracker-label complete"
                              : "tracker-label"
                          }
                        >
                          {status.label}
                        </div>

                        {current && (
                          <div className="tracker-current">
                            CURRENT STATUS
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {orderStatus === "declined" && (
                <div className="kev-message error">
                  😭 Kev is temporarily unavailable.
                  Please attempt additional persuasion.
                </div>
              )}

              {latestKevMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="kev-message"
                >
                  <span>
                    💌 MESSAGE FROM YOUR KEV
                  </span>

                  <p>“{latestKevMessage}”</p>
                </motion.div>
              )}

              {orderStatus === "delivered" && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="delivery-complete"
                >
                  <div>💋 ❤️ 💋</div>
                  <h3>KEV DELIVERED</h3>
                  <p>
                    Destination: Alexandra's arms.
                  </p>
                </motion.div>
              )}

              <button
                onClick={resetOrder}
                className="order-another-button"
              >
                ORDER ANOTHER KEV
              </button>
            </motion.main>
          )}
        </AnimatePresence>

        <footer className="kev-footer">
          KEV DELIVERY SERVICE™ · NO REFUNDS · UNLIMITED
          AFFECTION
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="section-title">
      <span>{number}</span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="order-navigation">
      {children}
    </div>
  );
}

function ProgressLine() {
  return <div className="progress-line" />;
}

function ProgressDot({
  active,
  complete,
  text,
}: {
  active: boolean;
  complete: boolean;
  text: string;
}) {
  return (
    <div className="progress-item">
      <div
        className={`progress-dot ${active ? "active" : ""
          } ${complete ? "complete" : ""}`}
      >
        {complete ? "✓" : ""}
      </div>

      <span>{text}</span>
    </div>
  );
}