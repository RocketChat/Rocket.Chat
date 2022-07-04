import type { ReactNode } from 'react';
import React from 'react';
import { ButtonGroup } from '@rocket.chat/fuselage';

const VideoConfPopupFooterButtons = ({ children }: { children: ReactNode }) => <ButtonGroup width='full' stretch>{children}</ButtonGroup>

export default VideoConfPopupFooterButtons;
