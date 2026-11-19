import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type IndexedRoomListItemProps = {
	'title': ReactNode;
	'status'?: ReactNode;
	'action': ReactNode;
	'data-qa'?: string;
};

/** A row of the indexed rooms list: the room name, cut when it is too long, its index status, and an action at the end. */
const IndexedRoomListItem = ({ title, status, action, ...props }: IndexedRoomListItemProps) => (
	<Box is='li' display='flex' alignItems='center' justifyContent='space-between' paddingBlock='x8' {...props}>
		<Box display='flex' flexDirection='column' minWidth={0} marginInlineEnd='x8'>
			<Box fontScale='p2m' withTruncatedText>
				{title}
			</Box>
			{status && (
				<Box fontScale='c1' color='hint'>
					{status}
				</Box>
			)}
		</Box>
		{action}
	</Box>
);

export default IndexedRoomListItem;
