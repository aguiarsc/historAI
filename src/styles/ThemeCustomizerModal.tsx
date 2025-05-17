import { useState, useEffect, useRef } from 'react';
import { getCustomThemeVars, saveCustomThemeVars } from '../services/storage/settingsStorage';
import './ThemeCustomizer.css';

export type ThemeMode = 'light' | 'dark';
export type ThemeVars = Record<string, string>;

type TabType = 'presets' | 'customize';

/**
 * Props for the ThemeCustomizerModal component.
 */
interface ThemeCustomizerModalProps {
  open: boolean;
  onClose: (saved?: boolean) => void;
  currentTheme: ThemeMode;
}

/**
 * Built-in color presets for different themes.
 */
const PRESETS: Record<string, Record<ThemeMode, ThemeVars>> = {
  'HistorIA Default': {
    dark: {
      '--color-bg': '#181c24',
      '--color-bg-panel': '#232837',
      '--color-bg-panel-dark': '#1a1e29',
      '--color-text': '#e6eaf3',
      '--color-text-secondary': '#a0a8b8',
      '--color-accent': '#8cb0f5',
      '--color-border': '#2c3142',
    },
    light: {
      '--color-bg': '#f8fafc',
      '--color-bg-panel': '#ffffff',
      '--color-bg-panel-dark': '#f1f5f9',
      '--color-text': '#1e293b',
      '--color-text-secondary': '#64748b',
      '--color-accent': '#4f46e5',
      '--color-border': '#e2e8f0',
    }
  },
  'Nord': {
    dark: {
      '--color-bg': '#2e3440',
      '--color-bg-panel': '#3b4252',
      '--color-bg-panel-dark': '#232831',
      '--color-text': '#eceff4',
      '--color-text-secondary': '#bec7d8',
      '--color-accent': '#a8d9e5',
      '--color-border': '#4c566a',
    },
    light: {
      '--color-bg': '#eceff4',
      '--color-bg-panel': '#e5e9f0',
      '--color-bg-panel-dark': '#d8dee9',
      '--color-text': '#2e3440',
      '--color-text-secondary': '#4c566a',
      '--color-accent': '#5e81ac',
      '--color-border': '#d8dee9',
    }
  },
  'Dracula': {
    dark: {
      '--color-bg': '#282a36',
      '--color-bg-panel': '#44475a',
      '--color-bg-panel-dark': '#21222c',
      '--color-text': '#f8f8f2',
      '--color-text-secondary': '#c6c6c0',
      '--color-accent': '#ff79c6',
      '--color-border': '#6272a4',
    },
    light: {
      '--color-bg': '#f8f8f2',
      '--color-bg-panel': '#ffffff',
      '--color-bg-panel-dark': '#e7e7e7',
      '--color-text': '#282a36',
      '--color-text-secondary': '#505d8a',
      '--color-accent': '#b81d70',
      '--color-border': '#bd93f9',
    }
  },
  'Gruvbox': {
    dark: {
      '--color-bg': '#282828',
      '--color-bg-panel': '#3c3836',
      '--color-bg-panel-dark': '#1d2021',
      '--color-text': '#ebdbb2',
      '--color-text-secondary': '#bdaf9a',
      '--color-accent': '#fabd2f',
      '--color-border': '#504945',
    },
    light: {
      '--color-bg': '#fbf1c7',
      '--color-bg-panel': '#ebdbb2',
      '--color-bg-panel-dark': '#d5c4a1',
      '--color-text': '#3c3836',
      '--color-text-secondary': '#5e5247',
      '--color-accent': '#9a3d02',
      '--color-border': '#bdae93',
    }
  },
  'Tokyo Night': {
    dark: {
      '--color-bg': '#1a1b26',
      '--color-bg-panel': '#24283b',
      '--color-bg-panel-dark': '#16161e',
      '--color-text': '#c0caf5',
      '--color-text-secondary': '#a9b1d6',
      '--color-accent': '#a0c5fa',
      '--color-border': '#414868',
    },
    light: {
      '--color-bg': '#e1e2e7',
      '--color-bg-panel': '#d5d6db',
      '--color-bg-panel-dark': '#cbccd1',
      '--color-text': '#343b58',
      '--color-text-secondary': '#565a6e',
      '--color-accent': '#1e66c6',
      '--color-border': '#a8aecb',
    }
  },
  'Solarized Dark': {
    dark: {
      '--color-bg': '#002b36',
      '--color-bg-panel': '#073642',
      '--color-bg-panel-dark': '#001f27',
      '--color-text': '#93a1a1',
      '--color-text-secondary': '#839496',
      '--color-accent': '#50afee',
      '--color-border': '#073642',
    },
    light: {
      '--color-bg': '#fdf6e3',
      '--color-bg-panel': '#eee8d5',
      '--color-bg-panel-dark': '#e7e1cf',
      '--color-text': '#586e75',
      '--color-text-secondary': '#657b83',
      '--color-accent': '#005a9e',
      '--color-border': '#eee8d5',
    }
  },
  'Monokai': {
    dark: {
      '--color-bg': '#272822',
      '--color-bg-panel': '#3e3d32',
      '--color-bg-panel-dark': '#20201c',
      '--color-text': '#f8f8f2',
      '--color-text-secondary': '#adef36',
      '--color-accent': '#ff70a3',
      '--color-border': '#75715e',
    },
    light: {
      '--color-bg': '#f9f8f5',
      '--color-bg-panel': '#f0f0eb',
      '--color-bg-panel-dark': '#e5e5e0',
      '--color-text': '#272822',
      '--color-text-secondary': '#5f5b4c',
      '--color-accent': '#b30042',
      '--color-border': '#ccc8c0',
    }
  },
  'Ayu Mirage': {
    dark: {
      '--color-bg': '#1f2430',
      '--color-bg-panel': '#252b38',
      '--color-bg-panel-dark': '#1c202b',
      '--color-text': '#cbccc6',
      '--color-text-secondary': '#949eb1',
      '--color-accent': '#ffae57',
      '--color-border': '#373e4d',
    },
    light: {
      '--color-bg': '#f8f9fa',
      '--color-bg-panel': '#ffffff',
      '--color-bg-panel-dark': '#f0f2f4',
      '--color-text': '#5c6773',
      '--color-text-secondary': '#505a66',
      '--color-accent': '#c33a42',
      '--color-border': '#e6e6e6',
    }
  },
  'One Dark': {
    dark: {
      '--color-bg': '#282c34',
      '--color-bg-panel': '#21252b',
      '--color-bg-panel-dark': '#1b1e23',
      '--color-text': '#abb2bf',
      '--color-text-secondary': '#8f96a5',
      '--color-accent': '#6bbaff',
      '--color-border': '#3b4048',
    },
    light: {
      '--color-bg': '#fafafa',
      '--color-bg-panel': '#eaeaeb',
      '--color-bg-panel-dark': '#dadadb',
      '--color-text': '#383a42',
      '--color-text-secondary': '#585b65',
      '--color-accent': '#1a52c0',
      '--color-border': '#c8c8c8',
    }
  },
  'GitHub Dark': {
    dark: {
      '--color-bg': '#0d1117',
      '--color-bg-panel': '#161b22',
      '--color-bg-panel-dark': '#010409',
      '--color-text': '#c9d1d9',
      '--color-text-secondary': '#8b949e',
      '--color-accent': '#6aaeff',
      '--color-border': '#30363d',
    },
    light: {
      '--color-bg': '#ffffff',
      '--color-bg-panel': '#f6f8fa',
      '--color-bg-panel-dark': '#eaeef2',
      '--color-text': '#24292e',
      '--color-text-secondary': '#586069',
      '--color-accent': '#0259bc',
      '--color-border': '#e1e4e8',
    }
  }
};

async function getStoredTheme(mode: ThemeMode): Promise<ThemeVars> {
  try {
    const vars = await getCustomThemeVars(mode);
    if (!vars || Object.keys(vars).length === 0) {
      return PRESETS['HistorIA Default'][mode];
    }
    return vars;
  } catch (error) {
    console.error('Failed to load theme:', error);
    return PRESETS['HistorIA Default'][mode];
  }
}

/**
 * Modal dialog for customizing application theme colors and presets.
 * @param {ThemeCustomizerModalProps} props
 */
function ThemeCustomizerModal({ open, onClose, currentTheme }: ThemeCustomizerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(currentTheme);
  const [theme, setTheme] = useState<ThemeVars>({});
  const [activePreset, setActivePreset] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('presets');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, onClose]);

  const getMatchingPreset = () => {
    const themeString = JSON.stringify(theme);
    for (const [name, preset] of Object.entries(PRESETS)) {
      if (JSON.stringify(preset[themeMode]) === themeString) {
        return name;
      }
    }
    return '';
  };

  useEffect(() => {
    if (open) {
      const loadTheme = async () => {
        const storedTheme = await getStoredTheme(themeMode);
        setTheme(storedTheme);
      };
      loadTheme();
    }
  }, [open, themeMode]);

  useEffect(() => {
    if (Object.keys(theme).length > 0) {
      setActivePreset(getMatchingPreset());
    }
  }, [theme]);

  useEffect(() => {
    if (open && Object.keys(theme).length > 0) {
      Object.entries(theme).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }
  }, [theme, open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (open) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);

  const handleColorChange = (key: string, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const handlePresetSelect = (presetName: string) => {
    const presetTheme = PRESETS[presetName][themeMode];
    setTheme(presetTheme);
    setActivePreset(presetName);
  };

  const handleSave = async () => {
    await saveCustomThemeVars(themeMode, theme);
    onClose(true);
  };

  const handleReset = () => {
    setTheme(PRESETS['HistorIA Default'][themeMode]);
    setActivePreset('HistorIA Default');
  };

  if (!open) return null;

  return (
    <div className="theme-modal-overlay">
      <div className="theme-modal" ref={modalRef}>
        <div className="theme-modal-header">
          <h2>Theme Customizer</h2>
          <div className="theme-mode-toggle">
            <button
              className={`theme-mode-btn ${themeMode === 'light' ? 'active' : ''}`}
              onClick={() => setThemeMode('light')}
            >
              Light
            </button>
            <button
              className={`theme-mode-btn ${themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => setThemeMode('dark')}
            >
              Dark
            </button>
          </div>
          <button className="theme-modal-close" onClick={() => onClose()}>
            &times;
          </button>
        </div>

        <div className="theme-modal-tabs">
          <button
            className={`theme-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            Theme Presets
          </button>
          <button
            className={`theme-tab-btn ${activeTab === 'customize' ? 'active' : ''}`}
            onClick={() => setActiveTab('customize')}
          >
            Custom Colors
          </button>
        </div>

        <div className={`theme-tab-content ${activeTab === 'presets' ? 'active' : ''}`}>
          <div className="theme-presets">
            {Object.keys(PRESETS).map(presetName => (
              <button
                key={presetName}
                className={`theme-preset-btn ${activePreset === presetName ? 'active' : ''}`}
                onClick={() => handlePresetSelect(presetName)}
                type="button"
              >
                <div
                  className="theme-preset-swatch"
                  style={{
                    '--preview-bg': PRESETS[presetName][themeMode]['--color-bg-panel'],
                    '--preview-accent': PRESETS[presetName][themeMode]['--color-accent'],
                    '--preview-highlight': `${PRESETS[presetName][themeMode]['--color-text-secondary']}80`
                  } as React.CSSProperties}
                ></div>
                <div className="theme-preset-info">
                  <span className="theme-preset-name">{presetName}</span>
                  <span className="theme-preset-description">
                    {presetName === 'HistorIA Default' ? 'Default application theme' :
                      presetName === 'Nord' ? 'Cool blue-tinted theme' :
                        presetName === 'Dracula' ? 'Dark purple-based theme' :
                          presetName === 'Gruvbox' ? 'Warm earth-tone theme' :
                            presetName === 'Tokyo Night' ? 'Dark blue Tokyo-inspired theme' :
                              presetName === 'Solarized' ? 'Eye-friendly light theme' :
                                'Custom theme preset'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={`theme-tab-content ${activeTab === 'customize' ? 'active' : ''}`}>
          <div className="theme-color-grid">
            {Object.entries(theme).map(([key, value]) => (
              <div className="theme-color-item" key={key}>
                <label className="theme-color-label">
                  {key.replace('--color-', '')}
                  <div className="theme-color-value">{value}</div>
                </label>
                <input
                  type="color"
                  value={value}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="theme-color-picker"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="theme-modal-footer">
          <button className="theme-btn" onClick={handleReset}>
            Reset to Default
          </button>
          <div className="theme-modal-actions">
            <button className="theme-btn" onClick={() => onClose()}>
              Cancel
            </button>
            <button className="theme-btn primary" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemeCustomizerModal;
