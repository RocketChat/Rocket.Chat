import { PaletteStyleTag } from '@rocket.chat/fuselage';
import type { Decorator, Parameters } from '@storybook/react';
import { themes } from '@storybook/theming';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDarkMode } from 'storybook-dark-mode';

import manifest from '../package.json';
import DocsContainer from './DocsContainer';
import { surface } from './helpers';
import logo from './logo.svg';

import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
import 'normalize.css/normalize.css';

export const parameters: Parameters = {
  backgrounds: {
    grid: {
      cellSize: 4,
      cellAmount: 4,
      opacity: 0.5,
    },
  },
  options: {
    storySort: {
      method: 'alphabetical',
    },
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

const queryClient = new QueryClient();

export const decorators: Decorator[] = [
  (fn) => {
    const dark = useDarkMode();

    return (
      <>
        <PaletteStyleTag theme={dark ? 'dark' : 'light'} />
        {fn()}
      </>
    );
  },
  (fn) => <QueryClientProvider client={queryClient} children={fn()} />,
];

export const tags = ['autodocs'];
