import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Sun, Moon } from 'lucide-react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'vectorops_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    return 'dark'; // Default night mode
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // ignore
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Neumorphic Theme Toggle Component
 * Demonstrates the design system:
 * - Pressed/inset track
 * - Tactile raised toggle button with dual shadows
 * - Emerald accent glow in dark mode / Crisp tactile pill in light mode
 * - 120ms transition on press
 */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'day' : 'night'} mode`}
      title={`Switch to ${isDark ? 'Day mode (light)' : 'Night mode (dark)'}`}
      className={`relative inline-flex items-center h-8 w-16 px-1 rounded-full neo-inset cursor-pointer transition-all duration-150 select-none group focus:outline-none ${className}`}
    >
      {/* Track icons */}
      <div className="absolute inset-0 px-2 flex items-center justify-between pointer-events-none text-xs">
        <Sun className={`w-3.5 h-3.5 transition-colors duration-200 ${!isDark ? 'text-[var(--accent)] opacity-100' : 'text-[var(--text-muted)] opacity-40'}`} />
        <Moon className={`w-3.5 h-3.5 transition-colors duration-200 ${isDark ? 'text-[var(--accent)] opacity-100' : 'text-[var(--text-muted)] opacity-40'}`} />
      </div>

      {/* Floating thumb with tactile dual-shadow */}
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ease-out z-10 ${
          isDark
            ? 'translate-x-8 bg-[var(--surface-raised)] text-[var(--accent)] shadow-[0_0_12px_rgba(47,209,145,0.35)]'
            : 'translate-x-0 bg-[var(--surface-raised)] text-[var(--accent)] shadow-[0_2px_8px_rgba(28,154,104,0.25)]'
        } neo-toggle-thumb`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5" />
        ) : (
          <Sun className="w-3.5 h-3.5" />
        )}
      </div>
    </button>
  );
};
