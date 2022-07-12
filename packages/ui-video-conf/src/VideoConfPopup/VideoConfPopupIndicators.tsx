import React from 'react';
import { Box } from '@rocket.chat/fuselage';

const VideoConfPopupIndicators = ({ current, total }: { current: number; total: number }) => 
  <Box mbs='x8' fontScale='micro' color='neutral-700'>{current} of {total}</Box>

export default VideoConfPopupIndicators;
