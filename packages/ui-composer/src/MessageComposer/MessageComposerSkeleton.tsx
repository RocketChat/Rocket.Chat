import { Skeleton, Box } from '@rocket.chat/fuselage';

import { MessageComposer, MessageComposerToolbar } from '.';

const MessageComposerSkeleton = () => (
	<MessageComposer>
		<Box width='100%' display='flex' alignItems='center' height='x52' pi={12}>
			<Skeleton width='100%' height={36} />
		</Box>
		<MessageComposerToolbar height={36} />
	</MessageComposer>
);

export default MessageComposerSkeleton;
