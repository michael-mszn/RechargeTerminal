import { useState, useEffect } from 'preact/hooks';
import '../css/Charging.css';
// @ts-ignore
import carImage from '../images/car-home-menu.png';

export default function Charging() {
  const [timerActive, setTimerActive] = useState(false);
  const [showColon, setShowColon] = useState(true);

  // Blink colon every second when timer is active
  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setShowColon(prev => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  const handleApplyCancel = () => {
    setTimerActive(prev => !prev);
    setShowColon(true); // reset colon
  };

  return (
    <div className="charging-page">
      <h2 className="greeting">Hello, Max</h2>

      <p className="charging-status">
        Your car is charging since 2h34min. lore ipsum dolor sit lore ipsum dolor sitlore ipsum dolor sitlore ipsum dolor sit
      </p>

      <div className="car-image-wrapper">
        <img src={carImage} alt="Car charging" className="car-image" />
        <span className="current-overlay">30A</span>
      </div>

      {/* Optional timer text */}
      <div className="optional-timer">
        {!timerActive ? 'Set optional charge timer' : 'Charging ends in'}
      </div>

      {/* Timer box */}
      <div className={`timer-box ${timerActive ? 'active-timer' : ''}`}>
        {!timerActive ? (
          <span>00:00 H</span>
        ) : (
          <>
            00
            <span className="blink-colon">{showColon ? ':' : ' '}</span>
            00&nbsp;
            <span className="spin-hour">H</span>
          </>
        )}
      </div>

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
