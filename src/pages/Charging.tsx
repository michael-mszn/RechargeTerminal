import { useState, useEffect, useRef } from 'preact/hooks';
import '../css/Charging.css';
// @ts-ignore
import carImage from '../images/car-home-menu.png';
import { addNotification } from '../main';

export default function Charging() {
  const [timerActive, setTimerActive] = useState(false);
  const [showColon, setShowColon] = useState(true);
  const [timerInput, setTimerInput] = useState(['0', '0', '0', '0']);
  const [currentDigit, setCurrentDigit] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMarginTop, setOverlayMarginTop] = useState('15vh');
  const [displayName, setDisplayName] = useState<string>(''); // 👈 new state
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch display name from backend
  useEffect(() => {
    fetch('https://ellioth.othdb.de/api/get-name.php')
      .then((res) => res.json())
      .then((data) => {
        setDisplayName(data.name || 'No Session Found');
      })
      .catch(() => {
        setDisplayName('Unknown');
      });
  }, []);

  // Blink colon only when timer is active
  useEffect(() => {
    if (timerActive) {
      const interval = setInterval(() => setShowColon((prev) => !prev), 1000);
      return () => clearInterval(interval);
    } else {
      setShowColon(true);
    }
  }, [timerActive]);

  // Overlay scroll disable + positioning
  useEffect(() => {
    if (showOverlay) {
      document.body.style.overflow = 'hidden';
      const handleResize = () => {
        const vh = window.innerHeight;
        setOverlayMarginTop(`${Math.max(5, vh * 0.15)}px`);
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    } else {
      document.body.style.overflow = '';
    }
  }, [showOverlay]);

  // ✅ Apply/Cancel with validation
  const handleApplyCancel = () => {
    if (!timerActive) {
      const hours = parseInt(timerInput[0] + timerInput[1], 10);
      const minutes = parseInt(timerInput[2] + timerInput[3], 10);

      if (hours === 0 && minutes === 0) {
        addNotification('You need to enter a charging time of atleast 1 minute.');
        return;
      }

      setTimerActive(true);
    } else {
      setTimerActive(false);
    }

    setCurrentDigit(null);
    setShowOverlay(false);
  };

  const handleInputChange = (e: any) => {
    if (timerActive) return;
    const value = (e.target as HTMLInputElement).value.replace(/\D/g, '');
    if (!value) return;
    setTimerInput((prev) => {
      const newArr = [...prev];
      let index = currentDigit ?? 0;
      value.split('').forEach((d: string) => {
        newArr[index] = d;
        index = (index + 1) % 4;
      });
      const hours = parseInt(newArr[0] + newArr[1], 10);
      const minutes = parseInt(newArr[2] + newArr[3], 10);
      const clampedHours = Math.min(Math.max(hours, 0), 23)
        .toString()
        .padStart(2, '0');
      const clampedMinutes = Math.min(Math.max(minutes, 0), 59)
        .toString()
        .padStart(2, '0');
      newArr[0] = clampedHours[0];
      newArr[1] = clampedHours[1];
      newArr[2] = clampedMinutes[0];
      newArr[3] = clampedMinutes[1];
      setCurrentDigit(index % 4);
      return newArr;
    });
    (e.target as HTMLInputElement).value = '';
  };

  const handleTimerBoxClick = () => {
    if (!timerActive) {
      setShowOverlay(true);
      setCurrentDigit(0);
      inputRef.current?.focus();
    }
  };

  const renderTimerDigits = () => {
    const digits = timerInput.map((d, i) => (
      <span
        key={i}
        style={{
          color: currentDigit === i && !timerActive ? '#ff3b92' : '#a8e792',
        }}
      >
        {d}
      </span>
    ));
    return (
      <>
        {digits[0]}
        {digits[1]}
        <span className="blink-colon">{showColon ? ':' : ' '}</span>
        {digits[2]}
        {digits[3]}&nbsp;
        <span className={timerActive ? 'spin-hour' : ''}>H</span>
      </>
    );
  };

  const confirmOverlayInput = () => {
    setShowOverlay(false);
    setCurrentDigit(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const getFinishTime = () => {
    const hours = parseInt(timerInput[0] + timerInput[1], 10);
    const minutes = parseInt(timerInput[2] + timerInput[3], 10);
    const now = new Date();
    now.setHours(now.getHours() + hours);
    now.setMinutes(now.getMinutes() + minutes);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="charging-page">
      <h2 className="greeting">Hello, {displayName}</h2>
      <p className="charging-status">
        Your car is charging since 2h34min. lore ipsum dolor sit lore ipsum
        dolor sitlore ipsum dolor sitlore ipsum dolor sit
      </p>

      <div className="car-image-wrapper">
        <img src={carImage} alt="Car charging" className="car-image" />
        <span className="current-overlay">30A</span>
      </div>

      {!timerActive ? (
        <div className="optional-timer">Set optional charge timer</div>
      ) : (
        <div className="optional-timer">Charging ends in</div>
      )}

      <div className="timer-box" onClick={handleTimerBoxClick}>
        {renderTimerDigits()}
      </div>

      <input
        type="number"
        inputMode="numeric"
        ref={inputRef}
        onInput={handleInputChange}
        value=""
        style={{
          position: 'absolute',
          opacity: 0,
          width: '1px',
          height: '1px',
          border: 'none',
          padding: 0,
          margin: 0,
        }}
      />

      {showOverlay && (
        <div className="floating-timer-overlay">
          <div
            className="floating-timer-container"
            style={{ marginTop: overlayMarginTop }}
          >
            <button
              className="close-overlay"
              onClick={() => setShowOverlay(false)}
            >
              ×
            </button>
            <div className="optional-timer">Set optional charge timer</div>
            <div className="timer-box">{renderTimerDigits()}</div>

            <div className="finish-time">
              The charging session will finish at{' '}
              <span className="finish-time-green">{getFinishTime()}</span>
            </div>

            <button className="confirm-overlay" onClick={confirmOverlayInput}>
              Confirm
            </button>
          </div>
        </div>
      )}

      <div className="stop-charging">
        Your car will stop charging
        <br />
        after your configured
        <br />
        time elapsed.
      </div>

      <button
        className={`apply-button ${timerActive ? 'cancel-button' : ''}`}
        onClick={handleApplyCancel}
      >
        {timerActive ? 'Cancel' : 'Apply'}
      </button>
    </div>
  );
}
