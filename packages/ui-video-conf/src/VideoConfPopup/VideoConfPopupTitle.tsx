import { Box, Throbber } from '@rocket.chat/fuselage';

export type VideoConfPopupTitleProps = {
	text: string;
	counter?: boolean;
};

const VideoConfPopupTitle = ({ text, counter = false }: VideoConfPopupTitleProps) => (
	<Box display='flex' alignItems='center' gap={4}>
		<Box fontScale='p2b'>{text}</Box>
		{counter && <Throbber size='x8' />}
	</Box>
);

export default VideoConfPopupTitle;
