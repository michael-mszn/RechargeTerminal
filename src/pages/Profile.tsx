/** @jsxImportSource preact */
import { useState, useRef, useLayoutEffect, useEffect } from 'preact/hooks';
import '../css/Profile.css';
{/* @ts-ignore */}
import profilePic from '../images/profile-picture.png';

export default function Profile() {
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isStatsOpen, setStatsOpen] = useState(false);
  const [isLogoutActive, setLogoutActive] = useState(false);
  const [fullName, setFullName] = useState('Max Dummy Mustername');
  const [weeklyStats, setWeeklyStats] = useState<{ [key: string]: number }>({});

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

  // Date selector state
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  const [balance, setBalance] = useState('0.00');

  const days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  const pillars = days.map((day, idx) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + idx);
    const key = `${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getDate().toString().padStart(2,'0')}/${date.getFullYear()}`;
    return { day, value: weeklyStats[key] ?? 0 };
  });


  const chartHeight = 320;
  const baselineOffset = 40;
  let computedMax = Math.max(...pillars.map(p => p.value));
  if (computedMax === 0) computedMax = 50; // fallback for all-zero week

  const maxValue = Math.ceil(computedMax / 50) * 50;

  const minHeightPercent = (25 / chartHeight) * 100;
  const pinkLines = Array.from({ length: 6 }, (_, i) => ((i + 1) / 6) * maxValue);

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

  const handleLogoutClick = async () => {
    try {
      await fetch('/api/logout.php', { method: 'POST', credentials: 'same-origin' });
      window.location.href = '/login'; // redirect to login page
    } catch (err) {
      console.error('Logout failed', err);
      alert('Logout failed'); // simple fallback feedback
    }
  };

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return '';
    };

    const fetchBalance = async () => {
      try {
        const userToken = getCookie('current_qr_code') || '';
        const res = await fetch(`/api/get-current-users-credit.php?user=${encodeURIComponent(userToken)}`, { credentials: 'same-origin' });
        const data = await res.json();
        if (data.balance !== undefined) {
          setBalance(parseFloat(data.balance).toFixed(2));
        }
      } catch (err) {
        console.error('Balance fetch error:', err);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 1000);
    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // -------------------
  // HISTORY TABLE DATA
  // -------------------
  const [dummyHistory, setDummyHistory] = useState(() => {
    // keep an initial empty array to avoid undefined issues
    return Array.from({ length: 5 }, () => ({
      date: '',
      kWh: '',
      cost: '',
      duration: 0,
    }));
  });

  useEffect(() => {
    async function fetchChargingSessions() {
      try {
        const res = await fetch('/api/get-charging-sessions.php', { credentials: 'same-origin' });
        const data = await res.json();
        const sessions = data.sessions || [];

        const formatted = sessions.map((s: any) => {
          const startDate = new Date(s.start_time);
          const dateStr = `${String(startDate.getMonth() + 1).padStart(2, '0')}/${String(
            startDate.getDate()
          ).padStart(2, '0')}/${startDate.getFullYear()}`;

          return {
            date: dateStr,
            kWh: s.kwh.toFixed(2),
            cost: `-${s.cost.toFixed(2)}€`,
            duration: Math.ceil(s.duration_seconds / 60),
          };
        });

        setDummyHistory(formatted);
        setCurrentPage(1); // reset pagination to first page
      } catch (err) {
        console.error('Error fetching charging sessions:', err);
      }
    }

    fetchChargingSessions();
  }, []);

  useEffect(() => {
    const fetchFullName = async () => {
      try {
        const res = await fetch('/api/get-fullname.php', { credentials: 'same-origin' });
        const data = await res.json();
        if (data.fullName) setFullName(data.fullName);
      } catch (err) {
        console.error('Failed to fetch full name:', err);
      }
    };

    fetchFullName();
  }, []);

  // fetch weekly stats when week changes
  useEffect(() => {
    const fetchWeeklyStats = async () => {
      const startDate = currentWeekStart;
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      const startStr = `${startDate.getFullYear()}-${(startDate.getMonth()+1).toString().padStart(2,'0')}-${startDate.getDate().toString().padStart(2,'0')}`;
      const endStr   = `${endDate.getFullYear()}-${(endDate.getMonth()+1).toString().padStart(2,'0')}-${endDate.getDate().toString().padStart(2,'0')}`;

      try {
        const res = await fetch(`/api/get-weekly-stats.php?start=${startStr}&end=${endStr}`, { credentials: 'same-origin' });
        const data = await res.json();
        if (data.stats) {
          setWeeklyStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch weekly stats', err);
      }
    };

    fetchWeeklyStats();
  }, [currentWeekStart]);

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
    const pages: number[] = [];
    const maxPages = 3;

    let start = currentPage - 1;
    let end = currentPage + 1;

    // Clamp the range
    if (start < 1) {
      start = 1;
      end = Math.min(maxPages, totalPages);
    } else if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, totalPages - (maxPages - 1));
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };
  const pagesToShow = getPagesToShow();


  return (
    <div class="profile-container">
      <p ref={nameRef} className="profile-name">
        {fullName}
      </p>
      <img src={profilePic} alt="Profile" class="profile-picture" />
      <p id="balance" className="profile-balance">Balance: {balance}€</p>

      <p
        className={`profile-logout ${isLogoutActive ? 'active' : ''}`}
        onMouseDown={() => setLogoutActive(true)}
        onMouseUp={() => setLogoutActive(false)}
        onClick={handleLogoutClick}
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
        <div className="drawer-content-inner">
          <p className="stats-title">CHARGING HISTORY</p>

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
                <td>{row.duration === 0 ? '\u2007' : row.duration}</td>
              </tr>
            ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="history-pagination">
            {/* Always render arrows */}
            <button
              className={`history-pagination-arrow ${prevPressed ? 'pressed' : ''}`}
              onClick={() => handlePageChange(currentPage - 1, 'prev')}
              disabled={currentPage === 1} // disable at first page
              style={{ visibility: currentPage === 1 ? 'hidden' : 'visible' }}
            >
              ◀
            </button>

            {pagesToShow.map((p) => (
              <button
                key={p}
                className={`history-pagination-page ${p === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(p)}
              >
                {p}
              </button>
            ))}

            <button
              className={`history-pagination-arrow ${nextPressed ? 'pressed' : ''}`}
              onClick={() => handlePageChange(currentPage + 1, 'next')}
              disabled={currentPage === totalPages} // disable at last page
              style={{
                visibility: currentPage === totalPages ? 'hidden' : 'visible',
              }}
            >
              ▶
            </button>
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
        style={{
          maxHeight: isStatsOpen
            ? `${statsRef.current?.scrollHeight}px`
            : '0px',
        }}
      >
        <div class="drawer-content-inner">
          <p className="stats-title">MINUTES CHARGED PER DAY</p>

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
                (line / maxValue) *
                (100 - (baselineOffset / chartHeight) * 100);
              return (
                <div
                  key={idx}
                  class="pillar-chart-line"
                  style={{
                    bottom: `calc(${bottomPercent}% + ${baselineOffset}px)`,
                  }}
                ></div>
              );
            })}

            <div class="pillar-chart-separator"></div>

            {pillars.map((p, idx) => {
              const heightPercent = (p.value / maxValue) * (100 - (baselineOffset / chartHeight) * 100);
              const finalHeight = heightPercent < minHeightPercent ? minHeightPercent : heightPercent;

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
