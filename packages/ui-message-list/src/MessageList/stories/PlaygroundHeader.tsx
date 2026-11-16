import { Box } from '@rocket.chat/fuselage';

export type PlaygroundHeaderProps = {
	/** Makes the header taller, as a header does when an avatar or an asynchronous warning arrives late. */
	extraHeight?: number;
};

const PlaygroundHeader = ({ extraHeight = 0 }: PlaygroundHeaderProps) => (
	<Box padding='x16' paddingBlockEnd={16 + extraHeight} fontScale='p2' color='hint' data-qa='start-of-conversation'>
		Start of conversation
	</Box>
);

export default PlaygroundHeader;
