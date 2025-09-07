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

  // Dynamically resize name to fit screen width with 7.5% margin
  useLayoutEffect(() => {
    const resizeName = () => {
      const el = nameRef.current;
      if (!el) return;

      const parentWidth = el.parentElement?.offsetWidth || 0;
      let fontSize = 10; // starting size in vw
      el.style.fontSize = fontSize + 'vw';

      // Reduce font size until it fits inside 85% of parent width
      while (el.scrollWidth > parentWidth * 0.85 && fontSize > 3) {
        fontSize -= 0.5;
        el.style.fontSize = fontSize + 'vw';
      }
    };

    resizeName();
    window.addEventListener('resize', resizeName);
    return () => window.removeEventListener('resize', resizeName);
  }, []);

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
        <p class="drawer-content">hello</p>
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
        <p class="drawer-content">hello</p>
      </div>
    </div>
  );
}
