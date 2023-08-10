import './Thumbnail.scss';
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
  <Box w={width} h={height} className={'screen-thumbnail-wrapper'}>
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
      overflow="hidden"
      onClick={onClick}
      {...props}
    >
      {children}
    </Box>
  </Box>
);

export default ScreenThumbnailWrapper;
