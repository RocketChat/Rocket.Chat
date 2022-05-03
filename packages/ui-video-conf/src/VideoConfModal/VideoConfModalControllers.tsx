import React from 'react';
import type { ReactNode, ReactElement } from 'react';
import { ButtonGroup } from '@rocket.chat/fuselage';

const VideoConfModalControllers = ({ children }: { children: ReactNode }): ReactElement => <ButtonGroup mbs='x24'>{children}</ButtonGroup>;

export default VideoConfModalControllers;
