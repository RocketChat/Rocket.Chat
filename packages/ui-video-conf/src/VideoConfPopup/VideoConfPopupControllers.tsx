import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';

const VideoConfPopupControllers = ({ children }: { children: ReactNode }): ReactElement => <ButtonGroup medium>{children}</ButtonGroup>;

export default VideoConfPopupControllers;
