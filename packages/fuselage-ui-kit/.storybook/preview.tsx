import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { DocsContainer as BaseContainer } from '@storybook/addon-docs';
import { type Parameters } from '@storybook/addons';
import { type DecoratorFn } from '@storybook/react';
import { themes } from '@storybook/theming';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentPropsWithoutRef } from 'react';
import { useDarkMode } from 'storybook-dark-mode';

import manifest from '../package.json';
import { surface } from './helpers';
import logo from './logo.svg';

import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';
import '@rocket.chat/fuselage-polyfills';
import 'normalize.css/normalize.css';

type DocsContainerProps = ComponentPropsWithoutRef<typeof BaseContainer>;

const DocsContainer = (props: DocsContainerProps) => {
  const dark = useDarkMode();

  const { context } = props;

  return (
    <BaseContainer
      {...props}
      context={{
        ...context,
        storyById: (id) => {
          const storyContext = context.storyById(id);
          return {
            ...storyContext,
            parameters: {
              ...storyContext?.parameters,
              docs: {
                ...storyContext?.parameters?.docs,
                theme: dark
                  ? {
                      ...themes.dark,
                      appContentBg: surface.main,
                      barBg: surface.main,
                    }
                  : themes.light,
              },
            },
          };
        },
      }}
    />
  );
};

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

const queryClient = new QueryClient();

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
  (fn) => <QueryClientProvider client={queryClient} children={fn()} />,
];
