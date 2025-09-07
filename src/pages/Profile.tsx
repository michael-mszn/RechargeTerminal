/** @jsxImportSource preact */
import { useState, useRef, useLayoutEffect } from 'preact/hooks';
import '../css/Profile.css';
{/* @ts-ignore */}
import profilePic from '../images/profile-picture.png';

export default function Profile() {
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isStatsOpen, setStatsOpen] = useState(false);
  const [isLogoutActive, setLogoutActive] = useState(false);

  const historyRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);

  const toggleHistory = () => setHistoryOpen(prev => !prev);
  const toggleStats = () => setStatsOpen(prev => !prev);

  // Dynamic font resizing for name
  useLayoutEffect(() => {
    const resizeName = () => {
      const el = nameRef.current;
      if (!el) return;

      const parentWidth = el.parentElement?.offsetWidth || 0;
      let fontSize = 10; // starting size in vw
      el.style.fontSize = fontSize + 'vw';

      while (el.scrollWidth > parentWidth * 0.85 && fontSize > 3) {
        fontSize -= 0.5;
        el.style.fontSize = fontSize + 'vw';
      }
    };

    resizeName();
    window.addEventListener('resize', resizeName);
    return () => window.removeEventListener('resize', resizeName);
  }, []);

  const pillars = [
    { day: 'MO', value: 175 },
    { day: 'TU', value: 20 },
    { day: 'WE', value: 0 },
    { day: 'TH', value: 150 },
    { day: 'FR', value: 180 },
    { day: 'SA', value: 50 },
    { day: 'SU', value: 260 },
  ];

  // Chart config
  const chartHeight = 320;          // px height of chart container
  const baselineOffset = 40;        // px reserved at bottom (≈6vw margin for separator + labels)
  const maxValue = Math.ceil(Math.max(...pillars.map(p => p.value)) / 50) * 50;

  // Horizontal lines (6 evenly spaced including the baseline one)
  const pinkLines = Array.from({ length: 6 }, (_, i) => ((i + 1) / 6) * maxValue);

  return (
    <div class="profile-container">
      <p ref={nameRef} class="profile-name">
        Max Tim Mustermann
      </p>
      <img src={profilePic} alt="Profile" class="profile-picture" />
      <p class="profile-balance">Balance: 183.86€</p>

      <p
        class={`profile-logout ${isLogoutActive ? 'active' : ''}`}
        onMouseDown={() => setLogoutActive(true)}
        onMouseUp={() => setLogoutActive(false)}
      >
        Logout
      </p>

      {/* History drawer */}
      <div class="profile-drawer">
        <button
          class={`drawer-button ${isHistoryOpen ? 'active' : ''}`}
          onClick={toggleHistory}
        >
          ▶
        </button>
        <span class="drawer-title">History</span>
      </div>
      <div
        ref={historyRef}
        class="drawer-content-wrapper"
        style={{
          maxHeight: isHistoryOpen
            ? `${historyRef.current?.scrollHeight}px`
            : '0px',
        }}
      >
        <div class="drawer-content-inner">
          <p class="drawer-content">hello</p>
        </div>
      </div>

      {/* Statistics drawer */}
      <div class="profile-drawer">
        <button
          class={`drawer-button ${isStatsOpen ? 'active' : ''}`}
          onClick={toggleStats}
        >
          ▶
        </button>
        <span class="drawer-title">Statistics</span>
      </div>
      <div
        ref={statsRef}
        class="drawer-content-wrapper"
        style={{
          maxHeight: isStatsOpen
            ? `${statsRef.current?.scrollHeight}px`
            : '0px',
        }}
      >
        <div class="drawer-content-inner">
          <p class="stats-title">MINUTES CHARGED PER DAY</p>
          <div class="pillar-chart" style={{ height: `${chartHeight}px` }}>
            {/* Thin pink lines */}
            {pinkLines.map((line, idx) => {
              const bottomPercent =
                (line / maxValue) * (100 - (baselineOffset / chartHeight) * 100);
              return (
                <div
                  key={idx}
                  class="pillar-chart-line"
                  style={{ bottom: `calc(${bottomPercent}% + ${baselineOffset}px)` }}
                ></div>
              );
            })}

            {/* Thick separator line */}
            <div class="pillar-chart-separator"></div>

            {/* Pillars */}
            {pillars.map((p, idx) => {
              const heightPercent =
                (p.value / maxValue) * (100 - (baselineOffset / chartHeight) * 100);

              const minHeightPercent = (25 / chartHeight) * 100;

              // if bar is shorter than min → apply buffer
              const isClamped = heightPercent < minHeightPercent;
              const finalHeight = isClamped
                ? minHeightPercent + 3 // add breathing room
                : heightPercent;

              return (
                <div class="pillar" key={idx}>
                  <div
                    class="pillar-bar"
                    style={{
                      height: `${finalHeight}%`,
                      bottom: `${baselineOffset}px`,
                      position: 'absolute',
                    }}
                  >
                    <span class="pillar-value">{p.value}</span>
                  </div>
                  <span class="pillar-label">{p.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
