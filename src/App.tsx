import { useState, ChangeEvent } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [number, setNumber] = useState('');
  const [error, setError] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumber(value);
    setError(value !== '' && isNaN(Number(value)));
  };

  const handleClick = () => {
    setCount((prev) => prev + Number(number || 0));
    setNumber('');
  };

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <div>
          <input
            type="text"
            name="number"
            value={number}
            onChange={handleChange}
            placeholder="숫자를 입력하세요"
            autoComplete="off"
          />
        </div>
        {error && <p className="error-message">숫자만 입력해 주세요.</p>}
        <div>
          <button onClick={handleClick} disabled={error || number === ''}>
            count is {count}
          </button>
        </div>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
