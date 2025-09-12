import { useState, useEffect, useRef } from 'preact/hooks';
import '../css/Charging.css';
// @ts-ignore
import carCharging from '../images/car-home-menu-charging.png';
// @ts-ignore
import carAuthRequired from '../images/car-home-menu-auth-required.png';
// @ts-ignore
import carFullyCharged from '../images/car-home-menu-fully-charged.png';
// @ts-ignore
import carError from '../images/car-home-menu-error.png';

import { addNotification } from '../main';

type ParkingStatusResponse = {
  status: string;
  slot_id?: number;
  since?: string;
  amperes?: number;
};

export default function Charging() {
  const [displayName, setDisplayName] = useState("Loading...");
  const [isConnected, setIsConnected] = useState(false);

  const [currentAmps, setCurrentAmps] = useState(0);
  const [targetAmps, setTargetAmps] = useState(0);
  const [chargingText, setChargingText] = useState("Loading status...");
  const [chargingColor, setChargingColor] = useState("#a8e792");
  const [chargingSince, setChargingSince] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [showColon, setShowColon] = useState(true);
  const [timerInput, setTimerInput] = useState(['0','0','0','0']);
  const [currentDigit, setCurrentDigit] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMarginTop, setOverlayMarginTop] = useState('15vh');
  const [carImage, setCarImage] = useState(carCharging);

  const inputRef = useRef<HTMLInputElement>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const currentAmpsRef = useRef(currentAmps);
  const targetAmpsRef = useRef(targetAmps);
  const chargingSinceRef = useRef<number | null>(chargingSince);
  const wasVisibleRef = useRef(false);

  // --- Connection polling ---
  useEffect(() => {
    const fetchConnection = async () => {
      try {
        const res = await fetch("/api/get-name.php");
        const data = await res.json();
        console.log("[get-name.php] response:", data);
        setDisplayName(data.name || "No Session Found");
        setIsConnected(!!data.name && data.name !== "No Session Found");
      } catch {
        setDisplayName("Unknown");
        setIsConnected(false);
      }
    };
    fetchConnection();
    const interval = setInterval(fetchConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Animate amperes ---
  const animateValue = (from: number, to: number, duration: number) => {
    let start: number | null = null;
    const easeOutQuad = (t: number) => t * (2 - t);
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = easeOutQuad(progress);
      const value = Math.floor(from + (to - from) * eased);
      setCurrentAmps(value);
      currentAmpsRef.current = value;
      if (progress < 1) requestAnimationFrame(step);
      else { setCurrentAmps(to); currentAmpsRef.current = to; }
    };
    requestAnimationFrame(step);
  };

  // --- Poll car status ---
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/get-current-users-car-status.php", { credentials: 'include' });
        const data: ParkingStatusResponse = await res.json();

        switch (data.status) {
          case "charging": setCarImage(carCharging); break;
          case "auth_required": setCarImage(carAuthRequired); break;
          case "fully_charged": setCarImage(carFullyCharged); break;
          case "error": setCarImage(carError); break;
          default: setCarImage(carError); break;
        }

        if (data.status === "charging" && data.since) {
          const start = new Date(data.since.replace(" ", "T") + "Z").getTime();
          if (chargingSinceRef.current == null) { setChargingSince(start); chargingSinceRef.current = start; }
          setChargingColor("#a8e792");

          if (!wasVisibleRef.current) {
            animateValue(0, data.amperes ?? 0, 1000);
            wasVisibleRef.current = true;
          } else if (typeof data.amperes === "number" && data.amperes !== targetAmpsRef.current) {
            animateValue(currentAmpsRef.current, data.amperes, 1000);
            targetAmpsRef.current = data.amperes;
            setTargetAmps(data.amperes);
          }
        } else {
          setChargingSince(null);
          chargingSinceRef.current = null;
          wasVisibleRef.current = false;

          switch (data.status) {
            case "fully_charged":
              setChargingText("Your car finished charging.");
              setChargingColor("#7eaf8b");
              break;
            case "auth_required":
              setChargingText("Your car requires authentication before it can start charging.");
              setChargingColor("#66a9f4");
              break;
            case "error":
            default:
              setChargingText("The terminal ran into an issue with your car. Did you run out of balance?");
              setChargingColor("#f91853");
              break;
          }
        }
      } catch {
        setChargingText("Failed to load charging status.");
        setChargingColor("#f91853");
        setChargingSince(null);
        chargingSinceRef.current = null;
        wasVisibleRef.current = false;
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Live charging text ---
  useEffect(() => {
    if (!chargingSince) return;
    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - chargingSince) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      setChargingText(`Your car is charging since ${hours}h${minutes}min.`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [chargingSince]);

  // --- Timer colon blink ---
  useEffect(() => {
    if (!timerActive) { setShowColon(true); return; }
    const interval = setInterval(() => setShowColon(prev => !prev), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // --- Overlay scroll ---
  useEffect(() => {
    if (showOverlay) {
      document.body.style.overflow = 'hidden';
      const handleResize = () => setOverlayMarginTop(`${Math.max(5, window.innerHeight * 0.15)}px`);
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    } else document.body.style.overflow = '';
  }, [showOverlay]);

  // --- Fetch timer from backend (skip when overlay open) ---
  useEffect(() => {
    const fetchTimer = async () => {
      try {
        const res = await fetch("/api/get-timer.php", { credentials: 'include' });
        const data = await res.json();
        console.log("[get-timer.php] response:", data);

        // skip updating if user is editing overlay
        if (showOverlay) return;

        if (data.success && data.timer_end) {
          const now = Date.now();
          const end = new Date(data.timer_end + "Z"); // treat as UTC
          const secondsLeft = Math.max(Math.floor((end.getTime() - now) / 1000), 0);

          setRemainingSeconds(secondsLeft);
          setTimerActive(secondsLeft > 0);

          // Only update timerInput if timer is active
          if (secondsLeft > 0) {
            const hours = Math.floor(secondsLeft / 3600);
            const minutes = Math.floor((secondsLeft % 3600) / 60);
            setTimerInput([
              String(hours).padStart(2,'0')[0],
              String(hours).padStart(2,'0')[1],
              String(minutes).padStart(2,'0')[0],
              String(minutes).padStart(2,'0')[1],
            ]);
          }
        }
      } catch (err) { console.error("[get-timer.php] error:", err); }
    };
    fetchTimer();
    const interval = setInterval(fetchTimer, 10000);
    return () => clearInterval(interval);
  }, [showOverlay]);

  // --- Countdown timer ---
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);

          // --- Update backend when charging finishes ---
          fetch("/api/set-car-status.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "fully_charged" }),
            credentials: "include"
          })
            .then(res => res.json())
            .then(data => console.log("[set-car-status.php] response:", data))
            .catch(err => console.error("[set-car-status.php] error:", err));

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // --- Apply/Cancel timer ---
  const handleApplyCancel = async () => {
    if (!timerActive) {
      if (!isConnected) { addNotification("You need to be connected to apply a timer."); return; }
      if (carImage !== carCharging) { addNotification("Your car needs to be charging to apply a timer."); return; }

      const hours = parseInt(timerInput[0]+timerInput[1],10);
      const minutes = parseInt(timerInput[2]+timerInput[3],10);
      if(hours===0 && minutes===0){ addNotification('You need to enter a charging time of at least 1 minute.'); return; }

      setTimerActive(true);
      setRemainingSeconds(hours * 3600 + minutes * 60);

      const body = { action: 'apply', hours, minutes };
      const res = await fetch("/api/set-timer.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include"
      });
      console.log("[set-timer.php] response:", await res.json());

    } else {
      setTimerActive(false);
      setRemainingSeconds(0);
      setTimerInput(['0','0','0','0']);

      const body = { action: 'cancel' };
      const res = await fetch("/api/set-timer.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include"
      });
      console.log("[set-timer.php] response:", await res.json());
    }

    setCurrentDigit(null);
    setShowOverlay(false);
  };

  // --- Input handling ---
  const handleInputChange = (e: any) => {
    if(timerActive) return;
    const value = (e.target as HTMLInputElement).value.replace(/\D/g,'');
    if(!value) return;

    setTimerInput(prev => {
      const newArr = [...prev];
      let index = currentDigit ?? 0;
      value.split('').forEach(d => { newArr[index] = d; index = (index+1)%4; });
      const hours = parseInt(newArr[0]+newArr[1],10);
      const minutes = parseInt(newArr[2]+newArr[3],10);
      const clampedHours = Math.min(Math.max(hours,0),23).toString().padStart(2,'0');
      const clampedMinutes = Math.min(Math.max(minutes,0),59).toString().padStart(2,'0');
      newArr[0]=clampedHours[0]; newArr[1]=clampedHours[1]; newArr[2]=clampedMinutes[0]; newArr[3]=clampedMinutes[1];
      setCurrentDigit(index%4);
      return newArr;
    });
    (e.target as HTMLInputElement).value='';
  };

  const handleTimerBoxClick = () => {
    if(!timerActive){ setShowOverlay(true); setCurrentDigit(0); inputRef.current?.focus(); }
  };

  const renderTimerDigits = () => {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const digits = (timerActive ?
        [String(hours).padStart(2,'0')[0], String(hours).padStart(2,'0')[1], String(minutes).padStart(2,'0')[0], String(minutes).padStart(2,'0')[1]]
        : timerInput
    ).map((d,i) => (
      <span key={i} style={{color: currentDigit===i && !timerActive ? '#ff3b92':'#a8e792'}}>{d}</span>
    ));
    return <>
      {digits[0]}{digits[1]}<span className="blink-colon">{showColon?':':' '}</span>{digits[2]}{digits[3]}&nbsp;
      <span className={timerActive?'spin-hour':''}>H</span>
    </>;
  };

  const confirmOverlayInput = () => { setShowOverlay(false); setCurrentDigit(null); window.scrollTo({top: document.body.scrollHeight, behavior:'smooth'}); };

  const getFinishTime = () => {
    let totalSeconds = remainingSeconds;
    if (!timerActive) {
      const hours = parseInt(timerInput[0]+timerInput[1],10);
      const minutes = parseInt(timerInput[2]+timerInput[3],10);
      totalSeconds = hours*3600 + minutes*60;
    }
    const now = new Date();
    now.setSeconds(now.getSeconds() + totalSeconds);
    return now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  };

  return (
    <div className="charging-page">
      <h2 className="greeting">Hello, {displayName}</h2>
      <p className="charging-status" style={{color: chargingColor}}>{chargingText}</p>

      <div className="car-image-wrapper">
        <img src={carImage} alt="Car status" className="car-image"/>
        {chargingSince && <span className="current-overlay">{currentAmps}A</span>}
      </div>

      {!timerActive ? <div className="optional-timer">Set optional charge timer</div> : <div className="optional-timer">Charging ends in</div>}

      <div className="timer-box" onClick={handleTimerBoxClick}>{renderTimerDigits()}</div>

      <input type="number" inputMode="numeric" ref={inputRef} onInput={handleInputChange} value="" style={{position:'absolute',opacity:0,width:'1px',height:'1px',border:'none',padding:0,margin:0}}/>

      {showOverlay &&
        <div className="floating-timer-overlay">
          <div className="floating-timer-container" style={{marginTop: overlayMarginTop}}>
            <button className="close-overlay" onClick={()=>setShowOverlay(false)}>×</button>
            <div className="optional-timer">Set optional charge timer</div>
            <div className="timer-box">{renderTimerDigits()}</div>
            <div className="finish-time">The charging session will finish at <span className="finish-time-green">{getFinishTime()}</span></div>
            <button className="confirm-overlay" onClick={confirmOverlayInput}>Confirm</button>
          </div>
        </div>
      }

      <div className="stop-charging">
        Your car will stop charging<br/>after your configured<br/>time elapsed.
      </div>

      <button className={`apply-button ${timerActive?'cancel-button':''}`} onClick={handleApplyCancel}>{timerActive?'Cancel':'Apply'}</button>
    </div>
  );
}