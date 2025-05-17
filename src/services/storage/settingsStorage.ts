import { STORES, getValue, setValue } from './db';

export const THEME_KEY = 'theme';
export const WELCOMED_KEY = 'welcomed';
export const loadTheme = async (): Promise<string | null> => {
  try {
    return await getValue<string>(STORES.SETTINGS, THEME_KEY);
  } catch (error) {
    console.error('Failed to load theme setting:', error);
    return null;
  }
};

export const saveTheme = async (theme: string): Promise<void> => {
  try {
    await setValue(STORES.SETTINGS, THEME_KEY, theme);
  } catch (error) {
    console.error('Failed to save theme setting:', error);
  }
};

export const hasSeenWelcome = async (): Promise<boolean> => {
  try {
    const welcomed = await getValue<boolean>(STORES.SETTINGS, WELCOMED_KEY);
    return welcomed === true;
  } catch (error) {
    console.error('Failed to check welcome status:', error);
    return false;
  }
};

export const setSeenWelcome = async (): Promise<void> => {
  try {
    await setValue(STORES.SETTINGS, WELCOMED_KEY, true);
  } catch (error) {
    console.error('Failed to save welcome status:', error);
  }
};

export const getCustomThemeVars = async (mode: string): Promise<Record<string, string> | null> => {
  try {
    return await getValue<Record<string, string>>(STORES.SETTINGS, `theme-custom-${mode}`);
  } catch (error) {
    console.error('Failed to load custom theme variables:', error);
    return null;
  }
};

export const saveCustomThemeVars = async (mode: string, vars: Record<string, string>): Promise<void> => {
  try {
    await setValue(STORES.SETTINGS, `theme-custom-${mode}`, vars);
  } catch (error) {
    console.error('Failed to save custom theme variables:', error);
  }
};
