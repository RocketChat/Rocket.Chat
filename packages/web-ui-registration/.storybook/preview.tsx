import { themes } from '@storybook/theming';
import { type Parameters } from '@storybook/addons';
import manifest from '../package.json';
import logo from './logo.svg';
import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';

export const parameters: Parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  backgrounds: {
    grid: {
      cellSize: 4,
      cellAmount: 4,
      opacity: 0.5,
    },
  },
  options: {
    storySort: ([, a], [, b]) => a.kind.localeCompare(b.kind),
  },
  layout: 'fullscreen',
  darkMode: {
    dark: {
      ...themes.dark,
      brandTitle: manifest.name,
      brandImage: logo,
      brandUrl: manifest.homepage,
    },
    light: {
      ...themes.normal,
      brandTitle: manifest.name,
      brandImage: logo,
      brandUrl: manifest.homepage,
    },
  },
};

