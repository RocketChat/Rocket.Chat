import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';

const Wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <Box
    is="span"
    display="inline-flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="space-between"
    paddingBlock={4}
    paddingInline={2}
    verticalAlign="middle"
    height="x24"
    className={css`
      cursor: pointer;
    `}
    width="x24"
  >
    {children}
  </Box>
);

export default Wrapper;
