import React from 'react';
import type { ReactNode, ReactElement } from 'react';
import { ButtonGroup } from '@rocket.chat/fuselage';

const VideoConfPopupControllers = ({ children }: { children: ReactNode }): ReactElement => <ButtonGroup mbs='x16'>{children}</ButtonGroup>;

export default VideoConfPopupControllers;
