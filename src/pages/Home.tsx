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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [replyVisible, setReplyVisible] = useState(false);
  const [animatedReply, setAnimatedReply] = useState('');
  const replyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [slots, setSlots] = useState<{ slot: number; status: SlotStatus }[]>([]);

  // Poll current user
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const res = await fetch('/api/get-current-username.php');
        const data = await res.json();
        setUsername(data.username || null);
      } catch (err) {
        console.error('Failed to check user', err);
        setUsername(null);
      }
    };
    checkCurrentUser();
    const interval = setInterval(checkCurrentUser, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll displayName
  useEffect(() => {
    if (!username) return;
    const fetchUserData = async () => {
      try {
        const nameRes = await fetch('/api/get-name.php');
        const nameData = await nameRes.json();
        setDisplayName(nameData.name ?? 'User');
      } catch (err) {
        console.error('Error fetching user data:', err);
        setDisplayName('User');
      }
    };
    fetchUserData();
    const interval = setInterval(fetchUserData, 1000);
    return () => clearInterval(interval);
  }, [username]);

  // Poll for new chat reply and animate
  useEffect(() => {
    if (!username) return;

    const pollReply = async () => {
      try {
        const res = await fetch('/api/get-chatgpt-reply.php');
        const data = await res.json();

        if (data.reply && data.reply.trim() !== '') {
          // Reset animation
          setAnimatedReply('');
          setReplyVisible(true);
          if (replyTimerRef.current) clearTimeout(replyTimerRef.current);

          // Animate typing effect
          let i = 0;
          const fullText = data.reply;
          const interval = setInterval(() => {
            setAnimatedReply((prev) => prev + fullText[i]);
            i++;
            if (i >= fullText.length) clearInterval(interval);
          }, 30); // moderate speed

          // Hide container after 20s
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

  // Poll current QR code every second and render it
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
            {!username && <p>Scan this QR code to access recharging:</p>}
            <canvas ref={canvasRef}></canvas>
          </div>

          <div className={`welcome ${username ? '' : 'hidden'}`} id="welcome">
            Welcome, {displayName}
          </div>

          <div className="ellioth-position">
            <img src={elliothPng} className="ellioth floating" alt="Ellioth" />
          </div>
          {/* Reply container */}
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
