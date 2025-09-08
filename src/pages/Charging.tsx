import { useState, useEffect, useRef } from 'preact/hooks';
import '../css/Charging.css';
// @ts-ignore
import carImage from '../images/car-home-menu.png';

export default function Charging() {
  const [timerActive, setTimerActive] = useState(false);
  const [showColon, setShowColon] = useState(true);
  const [floatingInputActive, setFloatingInputActive] = useState(false);
  const [timerInput, setTimerInput] = useState(['0','0','0','0']); // 4-digit time
  const [currentDigit, setCurrentDigit] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Blink colon every second when timer is active
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setShowColon(prev => !prev), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Handle Apply / Cancel
  const handleApplyCancel = () => {
    setTimerActive(prev => !prev);
    setCurrentDigit(null); // reset highlight
  };

  // Handle input typing
  const handleInputChange = (e: any) => {
    if (timerActive) return; // prevent input while charging
    const value = (e.target as HTMLInputElement).value.replace(/\D/g,'');
    if (!value) return;

    setTimerInput(prev => {
      const newArr = [...prev];
      let index = currentDigit !== null ? currentDigit : 0;

      value.split('').forEach((d: string) => {
        newArr[index] = d;
        index = (index + 1) % 4;
      });

      // Clamp hours and minutes
      const hours = parseInt(newArr[0] + newArr[1], 10);
      const minutes = parseInt(newArr[2] + newArr[3], 10);
      const clampedHours = Math.min(Math.max(hours, 0), 23).toString().padStart(2, '0');
      const clampedMinutes = Math.min(Math.max(minutes, 0), 59).toString().padStart(2, '0');

      newArr[0] = clampedHours[0];
      newArr[1] = clampedHours[1];
      newArr[2] = clampedMinutes[0];
      newArr[3] = clampedMinutes[1];

      setCurrentDigit(index % 4); // highlight next digit
      return newArr;
    });

    (e.target as HTMLInputElement).value = ''; // clear input
  };

  // Show floating input
  const handleTimerBoxClick = () => {
    if (!timerActive) setFloatingInputActive(true);
    inputRef.current?.focus();
    if (!timerActive && currentDigit === null) setCurrentDigit(0);
  };

  const closeFloatingInput = () => {
    setFloatingInputActive(false);
    setCurrentDigit(null);
  };

  // Render timer digits with colon and blue highlight
  const renderTimerDigits = () => {
    const digits = timerInput.map((d, i) => (
      <span key={i} style={{ color: currentDigit === i ? '#66a9f4' : '#ff3b92' }}>{d}</span>
    ));

    return (
      <>
        {digits[0]}{digits[1]}
        <span className="blink-colon">{showColon ? ':' : ' '}</span>
        {digits[2]}{digits[3]}&nbsp;
        <span className={timerActive ? 'spin-hour' : ''}>H</span>
      </>
    );
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

      {/* Original timer box */}
      {!timerActive && !floatingInputActive && (
        <div className="optional-timer" onClick={handleTimerBoxClick}>
          Set optional charge timer
        </div>
      )}
      {!timerActive && !floatingInputActive && (
        <div className="timer-box" onClick={handleTimerBoxClick}>
          {renderTimerDigits()}
        </div>
      )}

      {/* Floating input overlay */}
      {floatingInputActive && (
        <div className="floating-timer-overlay">
          <div className="floating-timer-container">
            <div className="optional-timer">Set optional charge timer</div>
            <div className="timer-box">
              {renderTimerDigits()}
            </div>
            <button className="close-overlay" onClick={closeFloatingInput}>Done</button>
          </div>
          {/* Hidden input for numpad */}
          <input
            type="number"
            inputMode="numeric"
            autoFocus
            ref={inputRef}
            onInput={handleInputChange}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '1px',
              height: '1px',
              border: 'none',
              padding: 0,
              margin: 0
            }}
          />
        </div>
      )}

      <div className="stop-charging">
        Your car will stop charging<br/>after your configured<br/>time elapsed.
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
