import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './ui.css';
import {
  hexToRgb,
  rgbToHex,
  getContrastRatio,
  passesNormalTextAA,
  passesNormalTextAAA,
  passesLargeTextAA,
  passesLargeTextAAA,
  passesUIComponentsAA
} from './utils/contrast';

interface ColorInputProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  onPickFromCanvas: () => void;
}

function ColorInput({ label, color, onChange, onPickFromCanvas }: ColorInputProps) {
  const [hexValue, setHexValue] = useState(color);

  useEffect(() => {
    setHexValue(color);
  }, [color]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexValue(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(value);
    }
  };

  const handleBlur = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
      setHexValue(color);
    }
  };

  return (
    <div className="color-input-container">
      <label className="color-label">{label}</label>
      <div className="color-input-row">
        <div className="color-swatch" style={{ backgroundColor: color }} />
        <input
          type="text"
          className="hex-input"
          value={hexValue}
          onChange={handleHexChange}
          onBlur={handleBlur}
          placeholder="#000000"
          maxLength={7}
        />
        <button className="pick-button" onClick={onPickFromCanvas}>
          Pick from canvas
        </button>
      </div>
    </div>
  );
}

interface ResultRowProps {
  label: string;
  ratio: number;
  aaThreshold: number;
  aaaThreshold?: number;
  showAAA?: boolean;
}

function ResultRow({ label, ratio, aaThreshold, aaaThreshold, showAAA = false }: ResultRowProps) {
  const passesAA = ratio >= aaThreshold;
  const passesAAA = showAAA && aaaThreshold ? ratio >= aaaThreshold : false;

  return (
    <div className="result-row">
      <div className="result-label">{label}</div>
      <div className="result-badges">
        <div className={`badge ${passesAA ? 'pass' : 'fail'}`}>
          WCAG AA {passesAA ? 'Pass' : 'Fail'}
        </div>
        {showAAA && (
          <div className={`badge ${passesAAA ? 'pass' : 'fail'}`}>
            WCAG AAA {passesAAA ? 'Pass' : 'Fail'}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [contrastRatio, setContrastRatio] = useState<number | null>(null);

  useEffect(() => {
    const fgRgb = hexToRgb(foregroundColor);
    const bgRgb = hexToRgb(backgroundColor);

    if (fgRgb && bgRgb) {
      const ratio = getContrastRatio(fgRgb, bgRgb);
      setContrastRatio(ratio);
    } else {
      setContrastRatio(null);
    }
  }, [foregroundColor, backgroundColor]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage;
      if (message) {
        if (message.type === 'color-picked') {
          const { color, target } = message;
          if (target === 'foreground') {
            setForegroundColor(color);
          } else if (target === 'background') {
            setBackgroundColor(color);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handlePickForeground = () => {
    parent.postMessage({ pluginMessage: { type: 'pick-color', target: 'foreground' } }, '*');
  };

  const handlePickBackground = () => {
    parent.postMessage({ pluginMessage: { type: 'pick-color', target: 'background' } }, '*');
  };

  return (
    <div className="app-container">
      <div className="color-inputs">
        <ColorInput
          label="Foreground color"
          color={foregroundColor}
          onChange={setForegroundColor}
          onPickFromCanvas={handlePickForeground}
        />
        <ColorInput
          label="Background color"
          color={backgroundColor}
          onChange={setBackgroundColor}
          onPickFromCanvas={handlePickBackground}
        />
      </div>

      <div className="contrast-display">
        <div className="contrast-label">Contrast Ratio</div>
        <div className="contrast-value">
          {contrastRatio !== null ? contrastRatio.toFixed(2) : '--'} : 1
        </div>
      </div>

      <div className="results-section">
        <ResultRow
          label="Normal text"
          ratio={contrastRatio || 0}
          aaThreshold={4.5}
          aaaThreshold={7}
          showAAA={true}
        />
        <ResultRow
          label="Large text"
          ratio={contrastRatio || 0}
          aaThreshold={3}
          aaaThreshold={4.5}
          showAAA={true}
        />
        <ResultRow
          label="UI components and graphics"
          ratio={contrastRatio || 0}
          aaThreshold={3}
          showAAA={false}
        />
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

