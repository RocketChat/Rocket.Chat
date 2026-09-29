import { Box, IconButton } from '@rocket.chat/fuselage';

import { stopShareButtonStyles } from './stageStyles';

export type StopShareButtonProps = {
	onStop: () => void;
};

/** Stops the reader's own screen share, from the corner of the screen they are sharing. */
const StopShareButton = ({ onStop }: StopShareButtonProps) => (
	<Box className={stopShareButtonStyles}>
		<IconButton icon='cross' small secondary onClick={onStop} title='Stop sharing' />
	</Box>
);

export default StopShareButton;
