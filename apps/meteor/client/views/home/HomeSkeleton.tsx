import { Box } from '@rocket.chat/fuselage';
import { ListSkeleton, Page } from '@rocket.chat/ui-client';

import { RoomSkeleton } from '../room';
import HeaderSkeleton from '../room/Header/HeaderSkeleton';

const HomeSkeleton = () => {
	return (
		<Page>
			<Box display='flex' flexDirection='row' height='full'>
				<Box flexGrow={0.15}>
					<HeaderSkeleton />
					<ListSkeleton listCount={3} />
				</Box>
				<Box flexGrow={0.85}>
					<RoomSkeleton />
				</Box>
			</Box>
		</Page>
	);
};

export default HomeSkeleton;
