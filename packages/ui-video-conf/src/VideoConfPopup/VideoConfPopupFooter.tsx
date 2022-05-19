import type { ReactNode } from 'react';
import React from 'react';
import { ButtonGroup } from '@rocket.chat/fuselage';

const VideoConfPopupFooter = ({ children }: { children: ReactNode }) => <ButtonGroup width='full' stretch mbs='x16'>{children}</ButtonGroup>

export default VideoConfPopupFooter;
