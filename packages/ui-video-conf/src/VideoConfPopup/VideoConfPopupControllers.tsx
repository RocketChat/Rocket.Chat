import React from 'react';
import type { ReactNode, ReactElement } from 'react';
import { ButtonGroup } from '@rocket.chat/fuselage';

const VideoConfPopupControllers = ({ children }: { children: ReactNode }): ReactElement => <ButtonGroup medium>{children}</ButtonGroup>;

export default VideoConfPopupControllers;
