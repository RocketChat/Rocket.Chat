import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { type Parameters } from '@storybook/addons';
import { type DecoratorFn } from '@storybook/react';
import { themes } from '@storybook/theming';
import { useDarkMode } from 'storybook-dark-mode';

import manifest from '../package.json';
import { DocsContainer } from './DocsContainer';
import { surface } from './helpers';
import logo from './logo.svg';

import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
import '@rocket.chat/fuselage-polyfills';
import 'normalize.css/normalize.css';

export const parameters: Parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
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
  docs: {
    container: DocsContainer,
  },
  darkMode: {
    dark: {
      ...themes.dark,
      appBg: surface.sidebar,
      appContentBg: surface.main,
      barBg: surface.main,
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

export const decorators: DecoratorFn[] = [
  (fn) => {
    const dark = useDarkMode();

    return (
      <>
        <PaletteStyleTag theme={dark ? 'dark' : 'light'} />
        {fn()}
      </>
    );
  },
];
