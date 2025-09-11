import { useEffect } from 'preact/hooks';

const VAPID_PUBLIC_KEY = 'BNsoK5f2uifDBmBjnUTJrBUGK4U1WLW8mCdfT1yOJu4dLlRDLCvo9wU6XqKuBvSvH1xH2NdtLTcz-BoVCm_EfVw';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

export function usePushNotifications() {
  useEffect(() => {
    const rememberToken = getCookie('current_qr_code');
    if (!rememberToken) {
      console.warn('[⚠️] No current_qr_code cookie found');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[⚠️] Push notifications not supported');
      return;
    }

    const registerSWAndSubscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[🔔] SW registered', registration);

        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // Send subscription to backend
        const res = await fetch('/api/subscribe.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            remember_token: rememberToken,
            subscription: subscription.toJSON(),
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error: ${res.status} - ${text}`);
        }

        const data = await res.json();
        console.log('[✅] Subscribed successfully:', data);
      } catch (err) {
        console.error('[❌] Push subscription failed:', err);
      }
    };

    registerSWAndSubscribe();
  }, []);
}
