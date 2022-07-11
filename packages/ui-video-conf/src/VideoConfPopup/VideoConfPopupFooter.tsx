import type { ReactNode } from 'react';
import React from 'react';
import { Margins } from '@rocket.chat/fuselage';

const VideoConfPopupFooter = ({ children }: { children: ReactNode }) => <Margins blockStart='x16'>{children}</Margins>

export default VideoConfPopupFooter;
