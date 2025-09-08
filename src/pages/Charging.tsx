import '../css/Charging.css';
// @ts-ignore
import carImage from '../images/car-home-menu.png';

export default function Charging() {
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

      <div className="optional-timer">Set optional charge timer</div>

      <div className="timer-box">00:00 H</div>

      <div className="stop-charging">
        Your car will stop charging
        <br />
        after your configured
        <br />
        time elapsed.
      </div>

      <button className="apply-button">Apply</button>
    </div>
  );
}
