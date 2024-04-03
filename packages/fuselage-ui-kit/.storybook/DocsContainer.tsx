import { DocsContainer as BaseContainer } from '@storybook/addon-docs/blocks';
import { themes } from '@storybook/theming';
import type { ComponentProps } from 'react';
import { useDarkMode } from 'storybook-dark-mode';

import { surface } from './helpers';

export const DocsContainer = ({
  children,
  context,
}: ComponentProps<typeof BaseContainer>) => {
  const dark = useDarkMode();

  return (
    <BaseContainer
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
    >
      {children}
    </BaseContainer>
  );
};
