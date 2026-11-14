import { Box, Throbber } from '@rocket.chat/fuselage';

export type MessageListLoaderProps = {
	isLoading: boolean;
};

/** The row of a page still to load, with a spinner while it loads. */
const MessageListLoader = ({ isLoading }: MessageListLoaderProps) => (
	<Box role='presentation' display='flex' justifyContent='center' alignItems='center' height='x32' color='default'>
		{isLoading && <Throbber inheritColor />}
	</Box>
);

export default MessageListLoader;
