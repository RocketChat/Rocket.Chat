import { Box, Throbber } from '@rocket.chat/fuselage';

export type MessageListLoaderProps = {
	isLoading: boolean;
};

const MessageListLoader = ({ isLoading }: MessageListLoaderProps) => (
	<Box role='presentation' display='flex' justifyContent='center' paddingBlock={16} minHeight={48}>
		{isLoading && <Throbber size='x12' />}
	</Box>
);

export default MessageListLoader;
