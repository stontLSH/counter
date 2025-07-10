import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FC } from 'react';
import './App.css';

const EMOJI_MAP = {
  '0': '😐',
  '10': '😃',
  '50': '🔥',
  '100': '🎉',
  '-10': '🥶',
  '-50': '💀',
};
const MSG_MAP = {
  '0': '시작!',
  '10': '두 자릿수 돌파!',
  '50': '대단해요!',
  '100': '백의 전설!',
  '-10': '조심하세요!',
  '-50': '위험해요!',
};

const ErrorMessage: FC<{ message: string }> = ({ message }) => (
  <div className="error-message-animated">{message}</div>
);
const CountDisplay: FC<{ count: number; emoji: string }> = ({
  count,
  emoji,
}) => (
  <div className="count-display">
    <span>현재 합계</span>
    <strong>
      {count} {emoji}
    </strong>
  </div>
);
interface NumberInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error: boolean;
}
const NumberInput: FC<NumberInputProps> = ({ value, onChange, error }) => (
  <input
    className={`number-input${error ? ' input-error' : ''}`}
    type="text"
    value={value}
    onChange={onChange}
    placeholder="숫자를 입력하세요"
    autoComplete="off"
    inputMode="numeric"
    maxLength={10}
  />
);

function getColorByCount(count: number) {
  // -100~100 사이 HSL 색상 변화
  const norm = Math.max(-100, Math.min(100, count));
  const hue = 120 + norm * 1.2; // 초록~노랑~빨강
  return `hsl(${hue}, 80%, 90%)`;
}

function getEmoji(count: number) {
  let emoji = '😐';
  Object.keys(EMOJI_MAP).forEach((k) => {
    if (count >= Number(k)) emoji = EMOJI_MAP[Number(k)];
    if (count <= Number(k) && Number(k) < 0) emoji = EMOJI_MAP[Number(k)];
  });
  return emoji;
}
function getMsg(count: number) {
  let msg = '';
  Object.keys(MSG_MAP).forEach((k) => {
    if (count === Number(k)) msg = MSG_MAP[Number(k)];
  });
  return msg;
}

function App() {
  const [count, setCount] = useState(0);
  const [number, setNumber] = useState(0);
  const [error, setError] = useState(false);
  const [maxCount, setMaxCount] = useState(0);
  const [minCount, setMinCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [goal, setGoal] = useState('');
  const [goalReached, setGoalReached] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [auto, setAuto] = useState<'none' | 'up' | 'down'>('none');
  const [limitMinus, setLimitMinus] = useState(false);
  const [limitPlus, setLimitPlus] = useState(false);
  const [copied, setCopied] = useState(false);

  // 카드 이동/회전 (이전 코드 유지)
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    return {
      x: Math.random() * (winW * 0.6),
      y: Math.random() * (winH * 0.6),
    };
  });
  const [vel, setVel] = useState({ vx: 2, vy: 2 });
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 16.67, 2);
      lastTime = now;
      setPos((prev) => {
        const { x, y } = prev;
        const { vx, vy } = vel;
        const card = cardRef.current;
        const cardW = card ? card.offsetWidth : 360;
        const cardH = card ? card.offsetHeight : 220;
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        let nextX = x + vx * dt;
        let nextY = y + vy * dt;
        let newVx = vx;
        let newVy = vy;
        if (nextX < 0) {
          nextX = 0;
          newVx = -vx;
        } else if (nextX > winW - cardW) {
          nextX = winW - cardW;
          newVx = -vx;
        }
        if (nextY < 0) {
          nextY = 0;
          newVy = -vy;
        } else if (nextY > winH - cardH) {
          nextY = winH - cardH;
          newVy = -vy;
        }
        if (newVx !== vx || newVy !== vy) setVel({ vx: newVx, vy: newVy });
        return { x: nextX, y: nextY };
      });
      setAngle((a) => (a + 1.5 * dt) % 360);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [vel]);
  useEffect(() => {
    const handleResize = () => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      setPos({
        x: Math.random() * (winW * 0.6),
        y: Math.random() * (winH * 0.6),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 자동 증가/감소
  useEffect(() => {
    if (auto === 'none') return;
    const timer = setInterval(() => {
      if (auto === 'up') handleAdd();
      if (auto === 'down') handleSub();
    }, 700);
    return () => clearInterval(timer);
  });

  // 목표치 도달 체크
  useEffect(() => {
    if (goal && Number(goal) === count) setGoalReached(true);
    else setGoalReached(false);
  }, [goal, count]);

  // 복사 알림
  useEffect(() => {
    if (copied) setTimeout(() => setCopied(false), 1200);
  }, [copied]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || isNaN(Number(value))) {
      setError(true);
      setNumber(0);
    } else {
      setError(false);
      setNumber(Number(value));
    }
  };
  const handleGoalChange = (e: ChangeEvent<HTMLInputElement>) => {
    setGoal(e.target.value.replace(/[^0-9-]/g, ''));
  };
  const handleAdd = () => {
    if (!error) {
      const n = number;
      if (limitPlus && count + n > 100) return;
      setCount((prev) => {
        const next = prev + n;
        setMaxCount((m) => Math.max(m, next));
        setMinCount((m) => Math.min(m, next));
        setHistory((h) => [`+${n} → ${next}`, ...h.slice(0, 19)]);
        return next;
      });
    }
  };
  const handleSub = () => {
    if (!error) {
      const n = number;
      if (limitMinus && count - n < 0) return;
      setCount((prev) => {
        const next = prev - n;
        setMaxCount((m) => Math.max(m, next));
        setMinCount((m) => Math.min(m, next));
        setHistory((h) => [`-${n} → ${next}`, ...h.slice(0, 19)]);
        return next;
      });
    }
  };
  const handleReset = () => {
    setShowConfirm(true);
  };
  const doReset = () => {
    setCount(0);
    setNumber(0);
    setError(false);
    setMaxCount(0);
    setMinCount(0);
    setHistory([]);
    setGoalReached(false);
    setShowConfirm(false);
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(String(count));
    setCopied(true);
  };

  // 카드 색상, 이모지, 메시지
  const cardBg = getColorByCount(count);
  const emoji = getEmoji(count);
  const msg = getMsg(count);

  return (
    <>
      {/* 카드 */}
      <div
        ref={cardRef}
        className="card-neo"
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          transform: `rotate(${angle}deg)`,
          willChange: 'transform, left, top',
          zIndex: 10,
          background: cardBg,
          transition: 'background 0.5s',
        }}
      >
        <h1 className="title-gradient">🔥 멋진 카운터 앱 🔥</h1>
        <CountDisplay count={count} emoji={emoji} />
        {msg && <div style={{ fontWeight: 600, marginBottom: 8 }}>{msg}</div>}
        <div style={{ fontSize: '0.95em', marginBottom: 8 }}>
          <span>
            최대: {maxCount} / 최소: {minCount}
          </span>
        </div>
        <div className="input-row">
          <NumberInput
            value={number === 0 ? '' : String(number)}
            onChange={handleChange}
            error={error}
          />
          <button
            className="add-btn"
            onClick={handleAdd}
            disabled={
              error || number === 0 || (limitPlus && count + number > 100)
            }
            type="button"
          >
            ➕ 더하기
          </button>
          <button
            className="add-btn"
            onClick={handleSub}
            disabled={
              error || number === 0 || (limitMinus && count - number < 0)
            }
            type="button"
          >
            ➖ 빼기
          </button>
        </div>
        {error && <ErrorMessage message="숫자만 입력해 주세요!" />}
        <div
          style={{
            margin: '10px 0 0 0',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            className="add-btn reset-btn"
            onClick={handleReset}
            type="button"
          >
            🔄 초기화
          </button>
          <button className="add-btn" onClick={handleCopy} type="button">
            📋 복사
          </button>
          <label
            style={{
              fontSize: '0.95em',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <input
              type="checkbox"
              checked={limitMinus}
              onChange={(e) => setLimitMinus(e.target.checked)}
            />{' '}
            0 이하 제한
          </label>
          <label
            style={{
              fontSize: '0.95em',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <input
              type="checkbox"
              checked={limitPlus}
              onChange={(e) => setLimitPlus(e.target.checked)}
            />{' '}
            100 이상 제한
          </label>
        </div>
        <div
          style={{
            margin: '10px 0 0 0',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <label
            style={{
              fontSize: '0.95em',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <input
              type="radio"
              checked={auto === 'none'}
              onChange={() => setAuto('none')}
            />{' '}
            수동
          </label>
          <label
            style={{
              fontSize: '0.95em',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <input
              type="radio"
              checked={auto === 'up'}
              onChange={() => setAuto('up')}
            />{' '}
            자동 증가
          </label>
          <label
            style={{
              fontSize: '0.95em',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <input
              type="radio"
              checked={auto === 'down'}
              onChange={() => setAuto('down')}
            />{' '}
            자동 감소
          </label>
        </div>
        <div
          style={{
            margin: '10px 0 0 0',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={goal}
            onChange={handleGoalChange}
            placeholder="목표값 입력"
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #bbb',
              minWidth: 80,
            }}
          />
          {goalReached && goal && (
            <span style={{ fontSize: '1.5em', marginLeft: 4 }}>
              🎊 목표 달성!
            </span>
          )}
        </div>
        {/* 이력 */}
        <div style={{ margin: '18px 0 0 0', width: '100%' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>이력</div>
          <ul
            style={{
              maxHeight: 80,
              overflowY: 'auto',
              fontSize: '0.95em',
              margin: 0,
              padding: 0,
              listStyle: 'none',
            }}
          >
            {history.length === 0 && (
              <li style={{ color: '#aaa' }}>아직 없음</li>
            )}
            {history.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
        {/* 초기화 모달 */}
        {showConfirm && (
          <div
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: '100vw',
              height: '100vh',
              background: '#0008',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 32,
                minWidth: 220,
                textAlign: 'center',
                boxShadow: '0 4px 24px #0002',
              }}
            >
              <div style={{ marginBottom: 18, fontWeight: 600 }}>
                정말 초기화할까요?
              </div>
              <button
                className="add-btn"
                onClick={doReset}
                style={{ marginRight: 8 }}
              >
                네
              </button>
              <button
                className="add-btn reset-btn"
                onClick={() => setShowConfirm(false)}
              >
                아니오
              </button>
            </div>
          </div>
        )}
        {/* 복사 알림 */}
        {copied && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 18,
              background: '#222',
              color: '#fff',
              borderRadius: 8,
              padding: '4px 12px',
              fontSize: '0.95em',
              zIndex: 99,
            }}
          >
            복사됨!
          </div>
        )}
        {/* 목표 달성 애니메이션(간단 이모지) */}
        {goalReached && goal && (
          <div
            style={{
              position: 'absolute',
              left: 10,
              bottom: 10,
              fontSize: '2em',
              pointerEvents: 'none',
            }}
          >
            🎆🎉✨
          </div>
        )}
      </div>
      <footer className="footer">
        <span>Made with React & Vite</span>
      </footer>
    </>
  );
}

export default App;
