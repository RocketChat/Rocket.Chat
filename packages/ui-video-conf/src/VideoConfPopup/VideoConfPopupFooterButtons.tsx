import { ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';

const VideoConfPopupFooterButtons = ({ children }: { children: ReactNode }): ReactElement => (
	<ButtonGroup width='full' stretch>
		{children}
	</ButtonGroup>
);

export default VideoConfPopupFooterButtons;
