import { Box, Throbber, Stack } from '@rocket.chat/fuselage';

export type VideoConfPopupTitleProps = {
	text: string;
	counter?: boolean;
};

const VideoConfPopupTitle = ({ text, counter = false }: VideoConfPopupTitleProps) => (
	<Stack direction='row' align='center' gap={4}>
		<Box fontScale='p2b'>{text}</Box>
		{counter && <Throbber size='x8' />}
	</Stack>
);

export default VideoConfPopupTitle;
