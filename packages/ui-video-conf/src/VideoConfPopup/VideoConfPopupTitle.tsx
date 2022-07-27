import { Box, Throbber } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

type VideoConfPopupTitleProps = {
	text: string;
	counter?: boolean;
};

const VideoConfPopupTitle = ({ text, counter = false }: VideoConfPopupTitleProps): ReactElement => (
	<Box display='flex' alignItems='center'>
		<Box fontScale='p2b'>{text}</Box>
		{counter && <Throbber size='x8' mis='x4' />}
	</Box>
);

export default VideoConfPopupTitle;
