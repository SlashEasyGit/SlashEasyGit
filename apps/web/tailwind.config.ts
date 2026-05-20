import type { Config } from 'tailwindcss';
import tchartsPreset from '@tcharts/ui/tailwind-preset';

const config: Config = {
  presets: [tchartsPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
