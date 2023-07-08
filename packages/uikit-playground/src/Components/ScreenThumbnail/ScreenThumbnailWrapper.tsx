import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ComponentProps } from 'react';

const ScreenThumbnailWrapper = ({
  children,
  onClick,
  width = '120px',
  height = '170px',
  padding = '20px',
  ...props
}: {
  onClick?: ComponentProps<typeof Box>['onClick'];
  children: ReactNode;
} & ComponentProps<typeof Box>) => (
  <Box
    w={width}
    h={height}
    bg="white"
    border="var(--default-border)"
    borderRadius="8px"
    className={css`
      display: grid;
      place-items: center;
      cursor: pointer;
      overflow: hidden;
      transition: var(--animation-very-fast);
      &:hover {
        transition: var(--animation-very-fast);
        border: 1px solid var(--RCPG-tertary-color) !important;
        .screenThumbnailBackdrop {
          z-index: 10;
          background: #cfcfcf20;
          transition: var(--animation-very-fast);
        }
      }
    `}
  >
    <Box
      w={width}
      h={height}
      position="absolute"
      className="screenThumbnailBackdrop"
      onClick={onClick}
    />
    <Box
      w={`calc(${width} - ${padding})`}
      h={`calc(${height} - ${padding})`}
      position="relative"
      onClick={onClick}
      {...props}
    >
      {children}
    </Box>
  </Box>
);

export default ScreenThumbnailWrapper;
