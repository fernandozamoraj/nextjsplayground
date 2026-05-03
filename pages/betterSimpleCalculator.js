import { useState } from 'react';
import BackLink from '../comps/backLink';

const OPS = [
  { label: '×', value: '*' },
  { label: '+', value: '+' },
  { label: '−', value: '-' },
  { label: '÷', value: '/' },
];

function compute(a, b, op) {
  if (typeof a === 'string' || typeof b === 'string') return 'Error';
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b === 0 ? 'Error: ÷0' : a / b;
    default: return 0;
  }
}

function isValid(str) {
  if (str === '' || str === '-' || str === '.') return false;
  const n = parseFloat(str);
  return !isNaN(n) && isFinite(n);
}

function formatResult(val) {
  if (typeof val === 'string') return val;
  if (!isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';
  return parseFloat(val.toPrecision(10)).toString();
}

const OP_COLORS = {
  active: { bg: '#0d6efd', border: '#0a58ca', color: '#fff' },
  idle:   { bg: '#f0f0f0', border: '#ced4da', color: '#212529' },
};

export default function BetterSimpleCalculator() {
  const [values, setValues] = useState(['', '']);
  const [operations, setOperations] = useState([]);
  const [results, setResults] = useState([]);

  const handleValueChange = (index, val) => {
    const newValues = [...values];
    newValues[index] = val;
    setValues(newValues);
  };

  const handleOperation = (op, level) => {
    if (operations[level] !== undefined) return;

    const a = level === 0 ? parseFloat(values[0]) : results[level - 1];
    const b = parseFloat(values[level + 1]);
    const result = compute(a, b, op);

    setOperations(prev => {
      const next = [...prev];
      next[level] = op;
      return next;
    });
    setResults(prev => {
      const next = [...prev];
      next[level] = result;
      return next;
    });
    setValues(prev => (prev.length < level + 3 ? [...prev, ''] : prev));
  };

  const handleClear = () => {
    setValues(['', '']);
    setOperations([]);
    setResults([]);
  };

  const OpButtonRow = ({ level }) => {
    const selected = operations[level];
    const locked = selected !== undefined;
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        {OPS.map(({ label, value }) => {
          const isSelected = selected === value;
          const theme = isSelected ? OP_COLORS.active : OP_COLORS.idle;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleOperation(value, level)}
              style={{
                minWidth: '54px',
                height: '50px',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: `2px solid ${theme.border}`,
                backgroundColor: theme.bg,
                color: theme.color,
                cursor: locked ? 'default' : 'pointer',
                boxShadow: isSelected ? '0 0 0 3px rgba(13,110,253,0.3)' : 'none',
                transition: 'background-color 0.1s, box-shadow 0.1s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  };

  const firstTwoReady = isValid(values[0]) && isValid(values[1]);

  return (
    <div className="container py-5">
      <BackLink />
      <h2 className="mb-4">Better Simple Calculator</h2>

      <div style={{ maxWidth: '620px' }}>
        {/* First value */}
        <div className="mb-2">
          <label className="form-label fw-semibold">First Value</label>
          <input
            type="number"
            className="form-control"
            value={values[0]}
            onChange={e => handleValueChange(0, e.target.value)}
            readOnly={operations[0] !== undefined}
            placeholder="0"
          />
        </div>

        {/* Second value */}
        <div className="mb-2">
          <label className="form-label fw-semibold">Second Value</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="number"
              className="form-control"
              value={values[1]}
              onChange={e => handleValueChange(1, e.target.value)}
              readOnly={operations[0] !== undefined}
              placeholder="0"
            />
            {firstTwoReady && <OpButtonRow level={0} />}
          </div>
        </div>

        {/* Chain of results + next inputs */}
        {results.map((result, i) => (
          <div key={i}>
            <div className="mb-2">
              <label className="form-label text-secondary" style={{ fontSize: '0.8rem' }}>
                Result
              </label>
              <input
                type="text"
                className="form-control"
                value={formatResult(result)}
                readOnly
                style={{
                  backgroundColor: '#e8f4e8',
                  fontWeight: 'bold',
                  color: typeof result === 'string' ? '#dc3545' : '#155724',
                }}
              />
            </div>

            <div className="mb-2">
              <label className="form-label fw-semibold">Next Value</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="number"
                  className="form-control"
                  value={values[i + 2] || ''}
                  onChange={e => handleValueChange(i + 2, e.target.value)}
                  readOnly={operations[i + 1] !== undefined}
                  placeholder="0"
                />
                {isValid(values[i + 2]) && <OpButtonRow level={i + 1} />}
              </div>
            </div>
          </div>
        ))}

        {/* Clear button */}
        <div className="mt-4">
          <button
            type="button"
            className="btn btn-danger px-4"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
