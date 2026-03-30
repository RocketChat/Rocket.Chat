import { Box } from '@rocket.chat/fuselage';
import { Page } from '@rocket.chat/ui-client';

import MessageListSkeleton from '../../components/message/list/MessageListSkeleton';
import { RoomSkeleton } from '../room';
import HeaderSkeleton from '../room/Header/HeaderSkeleton';

const HomeSkeleton = () => {
	return (
		<Page>
			<Box display='flex' flexDirection='row' height='full'>
				<Box flexGrow={0.15}>
					<HeaderSkeleton />
					<MessageListSkeleton messageCount={3} />
				</Box>
				<Box flexGrow={0.85}>
					<RoomSkeleton />
				</Box>
			</Box>
		</Page>
	);
};

export default HomeSkeleton;
