import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ComponentProps } from 'react';
import React from 'react';

const ScreenThumbnailWrapper = ({
  children,
  onClick,
  ...props
}: {
  onClick?: ComponentProps<typeof Box>['onClick'],
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
      transition: var(--animation-fast);
      &:hover {
        scale: 1.02;
        transition: var(--animation-fast);
        box-shadow: var(--elements-box-shadow);

        .screenThumbnailBackdrop {
          z-index: 10;
          background: #cfcfcf45;
          transition: var(--animation-fast);
        }
      }
    `}
  >
    <Box
      w="120px"
      h="170px"
      position="absolute"
      className="screenThumbnailBackdrop"
      onClick={onClick}
    />
    <Box w="100px" h="150px" position="relative" onClick={onClick} {...props}>
      {children}
    </Box>
  </Box>
);

export default ScreenThumbnailWrapper;
