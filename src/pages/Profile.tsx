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

  const chartHeight = 320;
  const baselineOffset = 40;
  const maxValue = Math.ceil(Math.max(...pillars.map(p => p.value)) / 50) * 50;
  const pinkLines = Array.from({ length: 6 }, (_, i) => ((i + 1) / 6) * maxValue);

  // Date selector state
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);

  function getMonday(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0,0,0,0);
    return date;
  }

  function formatWeek(start: Date) {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${pad(start.getMonth() + 1)}/${pad(start.getDate())}/${start.getFullYear()} - ${pad(end.getMonth() + 1)}/${pad(end.getDate())}/${end.getFullYear()}`;
  }

  const changeWeek = (delta: number, direction: 'left' | 'right') => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + delta * 7);
    setCurrentWeekStart(newStart);

    if (direction === 'left') {
      setLeftPressed(true);
      setTimeout(() => setLeftPressed(false), 200);
    } else {
      setRightPressed(true);
      setTimeout(() => setRightPressed(false), 200);
    }
  };

  return (
    <div class="profile-container">
      <p ref={nameRef} class="profile-name">Max Tim Mustermann</p>
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
          maxHeight: isHistoryOpen ? `${historyRef.current?.scrollHeight}px` : '0px',
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
          maxHeight: isStatsOpen ? `${statsRef.current?.scrollHeight}px` : '0px',
        }}
      >
        <div class="drawer-content-inner">
          <p class="stats-title">MINUTES CHARGED PER DAY</p>

          {/* DATE SELECTOR */}
          <div class="date-selector">
            <button
              class={`date-selector-arrow date-selector-arrow-left ${leftPressed ? 'pressed-left' : ''}`}
              onClick={() => changeWeek(-1, 'left')}
            ></button>

            <div class="date-selector-bar">{formatWeek(currentWeekStart)}</div>

            <button
              class={`date-selector-arrow date-selector-arrow-right ${rightPressed ? 'pressed-right' : ''}`}
              onClick={() => changeWeek(1, 'right')}
            ></button>
          </div>


          {/* Pillar chart */}
          <div class="pillar-chart" style={{ height: `${chartHeight}px` }}>
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

            <div class="pillar-chart-separator"></div>

            {pillars.map((p, idx) => {
              const heightPercent =
                (p.value / maxValue) * (100 - (baselineOffset / chartHeight) * 100);
              const minHeightPercent = (25 / chartHeight) * 100;
              const isClamped = heightPercent < minHeightPercent;
              const finalHeight = isClamped ? minHeightPercent + 3 : heightPercent;

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
