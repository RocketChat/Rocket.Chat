import { Box, Throbber } from '@rocket.chat/fuselage';

type VideoConfPopupTitleProps = {
	text: string;
	counter?: boolean;
};

const VideoConfPopupTitle = ({ text, counter = false }: VideoConfPopupTitleProps) => (
	<Box display='flex' alignItems='center'>
		<Box fontScale='p2b'>{text}</Box>
		{counter && <Throbber size='x8' mis={4} />}
	</Box>
);

export default VideoConfPopupTitle;
