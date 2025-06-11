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

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [counter, setCounter] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chatReply, setChatReply] = useState<string>("");

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
        .then(() => {
        })
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

  return (
    <div class="fullscreen">
      <div className="aspect-box">
        <div className="center-vertical">
          <div className="headline">
            <p className="bold">Parkplatzbelegung</p>
          </div>
        </div>
        <div className="center-vertical">
          <div>
            <div className="grid-position">
              <img src={gridPng} className="grid" />
            </div>
            <div className="cars-position">
              <img src={carsTestPng} className="cars" />
            </div>
            <p className="time-element">Samstag, 1. Februar 2025</p>
            <p className="time-element fontstyle-time-text">10:00</p>
            <p className="time-element fontstyle-charge-text">Auto lädt seit</p>
            <p className="time-element fontstyle-charge-time">2h 34m</p>

            {/* Conditional QR or Counter */}
            <div className="auth-state time-element">
              <div className={`qrcode time-element ${username ? 'hidden' : ''}`} id="qrcode">
                <p className="time-element">Scan this QR code:</p>
                <canvas ref={canvasRef}></canvas>
              </div>
              <div className={`counter time-element ${username ? '' : 'hidden'}`} id="counter">
                Welcome, {displayName} — Counter: {counter}
              </div>
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
    </div>
  );
}
