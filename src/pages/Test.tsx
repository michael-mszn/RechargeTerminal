/** @jsxImportSource preact */
import { useState } from 'preact/hooks';
import '../css/Test.css';

type SlotStatus = 'empty' | 'charging' | 'auth_required' | 'fully_charged' | 'error';

export default function Test() {
  const [slotId, setSlotId] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const sendStatus = async (status: SlotStatus) => {
    if (!slotId) {
      alert('Please enter a slot number.');
      return;
    }

    const formData = new FormData();
    formData.append('slot_id', slotId);
    formData.append('status', status);

    try {
      const response = await fetch('https://ellioth.othdb.de/api/parking-slots-api.php', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        setResult(JSON.stringify(json, null, 2));
      } catch {
        setResult('Non-JSON response: ' + text);
      }
    } catch (err) {
      setResult('Request failed: ' + err);
    }
  };

  return (
    <div className="test-container">
      <h1>Parking Slot API Test</h1>

      <input
        type="number"
        min={1}
        max={16}
        placeholder="Slot ID (1-16)"
        value={slotId}
        onInput={(e: any) => setSlotId(e.target.value)}
      />

      <div className="button-row">
        <button onClick={() => sendStatus('charging')}>Charging</button>
        <button onClick={() => sendStatus('fully_charged')}>Finished Charging</button>
        <button onClick={() => sendStatus('auth_required')}>Auth Required</button>
        <button onClick={() => sendStatus('error')}>Error</button>
        <button onClick={() => sendStatus('empty')}>Empty</button>
      </div>

      <pre className="result">{result}</pre>
    </div>
  );
}
