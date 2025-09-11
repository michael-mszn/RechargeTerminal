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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [replyVisible, setReplyVisible] = useState(false);
  const [animatedReply, setAnimatedReply] = useState('');
  const replyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [slots, setSlots] = useState<{ slot: number; status: SlotStatus }[]>([]);

  const lastNameRef = useRef<string | null>(null); // last observed name
  const lastWelcomeRef = useRef<string | null>(null); // last name we sent welcome for

  // Poll current username and trigger welcome message
  useEffect(() => {
    const pollUserAndName = async () => {
      try {
        const userRes = await fetch('/api/get-current-username.php');
        const userData = await userRes.json();
        const currentUsername = userData.username || null;
        setUsername(currentUsername);

        let name = 'Unknown';

        if (currentUsername) {
          // Only fetch name if a username is present
          const nameRes = await fetch('/api/get-name.php');
          const nameData = await nameRes.json();
          name = nameData.name?.trim() || 'Unknown';
        }

        // First poll
        if (lastNameRef.current === null) {
          lastNameRef.current = name;
          console.log('[Home.tsx] Initial name detected:', name);
          if (name !== 'Unknown') {
            lastWelcomeRef.current = name;
            console.log('[Home.tsx] Triggering welcome message for initial name:', name);
            await fetch('/api/welcome-message.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reply: `Welcome, ${name}` }),
              credentials: 'same-origin',
            });
          }
          return;
        }

        // Detect name change
        if (name !== lastNameRef.current) {
          console.log('[Home.tsx] Name change detected:', lastNameRef.current, '->', name);
          lastNameRef.current = name;

          if (name === 'Unknown') {
            // user logged out, reset welcome trigger
            lastWelcomeRef.current = null;
          } else if (lastWelcomeRef.current !== name) {
            // new user logged in
            lastWelcomeRef.current = name;
            console.log('[Home.tsx] Triggering welcome message for:', name);
            await fetch('/api/welcome-message.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reply: `Welcome, ${name}` }),
              credentials: 'same-origin',
            });
          }
        }
      } catch (err) {
        console.error('Error polling user and name:', err);
      }
    };

    pollUserAndName();
    const interval = setInterval(pollUserAndName, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll chatGPT reply and animate
  useEffect(() => {
    if (!username) return;

    const pollReply = async () => {
      try {
        const res = await fetch('/api/get-chatgpt-reply.php');
        const data = await res.json();

        if (data.reply && data.reply.trim() !== '') {
          setAnimatedReply('');
          setReplyVisible(true);
          if (replyTimerRef.current) clearTimeout(replyTimerRef.current);

          let i = 0;
          const fullText = data.reply;
          const interval = setInterval(() => {
            setAnimatedReply((prev) => prev + fullText[i]);
            i++;
            if (i >= fullText.length) clearInterval(interval);
          }, 15);

          replyTimerRef.current = setTimeout(() => {
            setReplyVisible(false);
            setAnimatedReply('');
          }, 20000);
        }
      } catch (err) {
        console.error('Failed to fetch chat reply', err);
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
        const res = await fetch('/api/get-parking-status.php');
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

  // Poll QR code
  useEffect(() => {
    const updateQRCode = async () => {
      try {
        const res = await fetch('/api/get-current-qr-code.php');
        const data = await res.json();
        const qrUrl = data.current_qr_code;
        if (canvasRef.current) {
          QRCode.toCanvas(canvasRef.current, qrUrl, (error) => {
            if (error) console.error('QR error:', error);
          });
        }
      } catch (err) {
        console.error('Failed to fetch QR code:', err);
      }
    };

    updateQRCode();
    const interval = setInterval(updateQRCode, 1000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="fullscreen">
      <div className="aspect-box">
        <div className="center-vertical">
          <div className="headline">
            <p className="bold">Parking Slots</p>
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

          <div className={`qrcode-container qr`}>
            <p>Scan this QR code to access recharging:</p>
            <canvas ref={canvasRef}></canvas>
          </div>

          <div className="ellioth-position">
            <img src={elliothPng} className="ellioth floating" alt="Ellioth" />
          </div>

          {/* Reply container below Ellioth */}
          <div className={`reply-container ${replyVisible ? '' : 'hidden'}`}>
            <p className="time-element fontstyle-ellioth-name">Ellioth</p>
            <div className="line-position">
              <img src={linePng} className="line" />
            </div>
            <p className="time-element dialogue-box">
              <span className="reply-animated">{animatedReply}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
