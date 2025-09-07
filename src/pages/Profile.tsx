/** @jsxImportSource preact */
import { useState, useRef, useLayoutEffect, useMemo } from 'preact/hooks';
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
      let fontSize = 10;
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
      setTimeout(() => setLeftPressed(false), 400);
    } else {
      setRightPressed(true);
      setTimeout(() => setRightPressed(false), 400);
    }
  };

  // -------------------
  // HISTORY TABLE DATA
  // -------------------
  const dummyHistory = useMemo(() => {
    return Array.from({ length: 23 }, (_, i) => ({
      date: `0${(i % 12) + 1}/${(i % 28) + 1}/2025`,
      kWh: (Math.random() * 10 + 1).toFixed(2),
      cost: `-${(Math.random() * 5 + 0.5).toFixed(2)}€`,
      duration: Math.floor(Math.random() * 120) + 10,
    }));
  }, []); // generated only once

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(dummyHistory.length / itemsPerPage);

  const [prevPressed, setPrevPressed] = useState(false);
  const [nextPressed, setNextPressed] = useState(false);

  const handlePageChange = (page: number, direction?: 'prev' | 'next') => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (direction === 'prev') {
      setPrevPressed(true);
      setTimeout(() => setPrevPressed(false), 400);
    } else if (direction === 'next') {
      setNextPressed(true);
      setTimeout(() => setNextPressed(false), 400);
    }
  };

  const displayedData = dummyHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Fill rows to always show 5
  const paddedData = [...displayedData];
  while (paddedData.length < 5) paddedData.push({ date: '', kWh: '', cost: '', duration: 0 });

  // Pagination display logic: max 3 consecutive pages
  const getPagesToShow = () => {
    let pages = [];
    if (totalPages <= 3) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (currentPage === 1) {
      pages = [1, 2, 3];
    } else if (currentPage === totalPages) {
      pages = [totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [currentPage - 1, currentPage, currentPage + 1];
    }
    return pages;
  };
  const pagesToShow = getPagesToShow();

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
        style={{ maxHeight: isHistoryOpen ? `${historyRef.current?.scrollHeight}px` : '0px' }}
      >
        <div class="drawer-content-inner">
          <p class="stats-title">CHARGING HISTORY</p>

          {/* History Table */}
          <table class="history-table">
            <thead>
            <tr>
              <th>DATE</th>
              <th>KWH</th>
              <th>COSTS</th>
              <th>MINUTES</th>
            </tr>
            </thead>
            <tbody>
            {paddedData.map((row, idx) => (
              <tr key={idx}>
                <td>{row.date}</td>
                <td>{row.kWh}</td>
                <td>{row.cost}</td>
                <td>{row.duration}</td>
              </tr>
            ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div class="history-pagination">
            {currentPage > 1 && (
              <button
                class={`history-pagination-arrow ${prevPressed ? 'pressed' : ''}`}
                onClick={() => handlePageChange(currentPage - 1, 'prev')}
              >
                ◀
              </button>
            )}

            {pagesToShow.map((p) => (
              <button
                key={p}
                class={`history-pagination-page ${p === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(p)}
              >
                {p}
              </button>
            ))}

            {currentPage < totalPages && (
              <button
                class={`history-pagination-arrow ${nextPressed ? 'pressed' : ''}`}
                onClick={() => handlePageChange(currentPage + 1, 'next')}
              >
                ▶
              </button>
            )}
          </div>
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
        style={{ maxHeight: isStatsOpen ? `${statsRef.current?.scrollHeight}px` : '0px' }}
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
              const bottomPercent = (line / maxValue) * (100 - (baselineOffset / chartHeight) * 100);
              return <div key={idx} class="pillar-chart-line" style={{ bottom: `calc(${bottomPercent}% + ${baselineOffset}px)` }}></div>;
            })}

            <div class="pillar-chart-separator"></div>

            {pillars.map((p, idx) => {
              const heightPercent = (p.value / maxValue) * (100 - (baselineOffset / chartHeight) * 100);
              const minHeightPercent = (25 / chartHeight) * 100;
              const isClamped = heightPercent < minHeightPercent;
              const finalHeight = isClamped ? minHeightPercent + 3 : heightPercent;

              return (
                <div class="pillar" key={idx}>
                  <div class="pillar-bar" style={{ height: `${finalHeight}%`, bottom: `${baselineOffset}px`, position: 'absolute' }}>
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
