import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ComponentProps } from 'react';
import React from 'react';

const ScreenThumbnailWrapper = ({
  children,
  ...props
}: {
  children: ReactNode,
} & ComponentProps<typeof Box>) => (
  <Box
    w="120px"
    h="170px"
    bg="white"
    border="var(--default-border)"
    borderRadius={'20px'}
    className={css`
      display: grid;
      place-items: center;
      cursor: pointer;
      overflow: hidden;
      transition: var(--animation-default);
      &:hover {
        scale: 1.1;
        transition: var(--animation-default);
        box-shadow: var(--elements-box-shadow);
      }
    `}
  >
    <Box w="100px" h="150px" position="relative" {...props}>
      {children}
    </Box>
  </Box>
);

export default ScreenThumbnailWrapper;
