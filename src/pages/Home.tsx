/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
import QRCode from 'qrcode';
import '../css/Home.css';
// @ts-ignore
import elliothPng from '../images/ellioth.png';
// @ts-ignore
import linePng from '../images/dialogue-line.png';
// @ts-ignore
import gridPng from '../images/grid.png';
// @ts-ignore
import carsTestPng from '../images/cars-test.png';
// @ts-ignore
import carAuthRequired from '../images/car-auth-required.png';
// @ts-ignore
import carCharging from '../images/car-charging.png';
// @ts-ignore
import carError from '../images/car-error.png';
// @ts-ignore
import carFullyCharged from '../images/car-fully-charged.png';

type SlotStatus = 'empty' | 'charging' | 'auth_required' | 'error' | 'fully_charged';

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [counter, setCounter] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chatReply, setChatReply] = useState<string>('');
  const [slots, setSlots] = useState<{ slot: number; status: SlotStatus }[]>([]);

  // New state for current time and date strings
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Function to format date like "Samstag, 1. Februar 2025"
  function formatDate(date: Date): string {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Function to format time like "10:00"
  function formatTime(date: Date): string {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // Update time and date every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(formatDate(now));
      setCurrentTime(formatTime(now));
    };

    updateDateTime(); // initial call
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate QR code when no user
  useEffect(() => {
    if (!username && canvasRef.current) {
      const url = 'https://10.127.0.38/terminalserver/redirect.php';
      QRCode.toCanvas(canvasRef.current, url, (error) => {
        if (error) console.error('QR error:', error);
      });
    }
  }, [username]);

  // Poll generate-token.php when user is not signed in (Token refresh is handled server-side)
  useEffect(() => {
    if (username) return;

    const pollQRToken = () => {
      fetch('https://10.127.0.38/terminalserver/generate-token.php')
        .then(() => {})
        .catch(err => console.error("Token polling failed", err));
    };

    pollQRToken(); // Run immediately
    const interval = setInterval(pollQRToken, 10000);

    return () => clearInterval(interval);
  }, [username]);

  // Poll for current user
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const res = await fetch('https://10.127.0.38/terminalserver/get-current-username.php');
        const data = await res.json();
        if (!data.username) {
          setUsername(null);
        } else {
          setUsername(data.username);
        }
      } catch (err) {
        console.error('Failed to check user', err);
        setUsername(null);
      }
    };

    checkCurrentUser();
    const interval = setInterval(checkCurrentUser, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll counter & displayName every second when logged in
  useEffect(() => {
    if (!username) return;

    const fetchUserData = async () => {
      try {
        const nameRes = await fetch('https://10.127.0.38/terminalserver/get-name.php');
        const nameData = await nameRes.json();
        setDisplayName(nameData.name ?? 'User');

        const counterRes = await fetch(
          `https://10.127.0.38/terminalserver/get-current-users-counter.php?user=${encodeURIComponent(username)}`
        );
        const counterData = await counterRes.json();
        setCounter(counterData.counter ?? 'N/A');
      } catch (err) {
        console.error('Error fetching user data:', err);
        setDisplayName('User');
        setCounter('Error');
      }
    };

    fetchUserData();
    const interval = setInterval(fetchUserData, 1000);

    return () => clearInterval(interval);
  }, [username]);

  useEffect(() => {
    if (!username) return;

    const pollReply = async () => {
      try {
        const res = await fetch("https://10.127.0.38/terminalserver/get-chatgpt-reply.php");
        const data = await res.json();

        if (data.reply && data.reply.trim() !== "") {
          setChatReply(data.reply);
        }
      } catch (err) {
        console.error("Failed to fetch chat reply", err);
        setChatReply("Error loading reply");
      }
    };

    pollReply();
    const interval = setInterval(pollReply, 1000);
    return () => clearInterval(interval);
  }, [username]);

  // Poll parking slot status
  useEffect(() => {
    const fetchSlotStatus = async () => {
      try {
        const res = await fetch('https://10.127.0.38/terminalserver/get-parking-status.php');
        const data = await res.json();
        setSlots(data);
      } catch (err) {
        console.error("Failed to fetch slot status", err);
      }
    };

    fetchSlotStatus();
    const interval = setInterval(fetchSlotStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Map statuses to icons
  const getCarIcon = (status: SlotStatus): string | null => {
    switch (status) {
      case 'charging': return carCharging;
      case 'auth_required': return carAuthRequired;
      case 'error': return carError;
      case 'fully_charged': return carFullyCharged;
      default: return null;
    }
  };

  return (
    <div class="fullscreen">
      <div className="aspect-box">
        <div className="center-vertical">
          <div className="headline">
            <p className="bold">Parkplatzbelegung</p>
          </div>
        </div>
        <div className="center-vertical">
            <div className="grid-position">
              <img src={gridPng} className="grid" />
            </div>

            <div className="cars-position">
              {slots.map(({ slot, status }) => {
                const icon = getCarIcon(status);
                if (!icon) return null;

                const baseSpacing = 6.29;
                const separatorsBefore = Math.floor((slot - 1) / 4);
                const leftPercent = (slot - 1) * baseSpacing + separatorsBefore * 1.75;

                return (
                  <img
                    key={slot}
                    src={icon}
                    className="car-icon"
                    style={{ left: `${leftPercent}%` }}
                    alt={`Car in slot ${slot}`}
                  />
                );
              })}
            </div>
            <div
              className={`qrcode-container time-element ${
                username ? 'qr-moved' : 'qr'
              }`}
            >
              {!username && <p className="time-element">Scan this QR code:</p>}
              <canvas ref={canvasRef}></canvas>
            </div>

            <p className="time-element">{currentDate}</p>
            <p className="time-element fontstyle-time-text">{currentTime}</p>

            {/* Counter only shown when user is logged in */}
            <div className={`counter time-element ${username ? '' : 'hidden'}`} id="counter">
              Welcome, {displayName} — Counter: {counter}
            </div>

            <div className="ellioth-position">
              <img src={elliothPng} className="ellioth" alt="Ellioth" />
            </div>
            <p className="time-element fontstyle-ellioth-name">Ellioth</p>
            <div className="line-position">
              <img src={linePng} className="line" />
            </div>
            <p className="time-element dialogue-box">
              {chatReply || "ChatGPT reply gets placed HERE"}
            </p>
        </div>
      </div>
    </div>
  );
}
