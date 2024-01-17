import { codeBlock } from '@rocket.chat/ui-theming/src/codeBlockStyles';
import { convertToCss } from '@rocket.chat/ui-theming/src/helpers/convertToCss';
import { filterOnlyChangedColors } from '@rocket.chat/ui-theming/src/helpers/filterOnlyChangedColors';
import { useCreateStyleContainer } from '@rocket.chat/ui-theming/src/hooks/useCreateStyleContainer';
import { defaultPalette } from '@rocket.chat/ui-theming/src/palette';
import { darkPalette } from '@rocket.chat/ui-theming/src/paletteDark';
import { type Parameters } from '@storybook/addons';
import { type DecoratorFn } from '@storybook/react';
import { themes } from '@storybook/theming';
import { createElement } from 'react';
import { createPortal } from 'react-dom';
import { useDarkMode } from 'storybook-dark-mode';

import manifest from '../package.json';
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

export const decorators: DecoratorFn[] = [
  (fn) =>
    createElement(function RocketChatDarkMode() {
      const dark = useDarkMode();

      const palette = convertToCss(
        filterOnlyChangedColors(defaultPalette, dark ? darkPalette : {}),
        'body'
      );

      return (
        <>
          {createPortal(
            dark ? palette + codeBlock : palette,
            useCreateStyleContainer('main-palette')
          )}
          {fn()}
        </>
      );
    }),
];
