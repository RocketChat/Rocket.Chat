import { Box, Skeleton } from '@rocket.chat/fuselage';

const AbacRoomPreviewSkeleton = () => (
	<>
		{Array.from({ length: 3 }, (_, index) => (
			<Box key={index} display='flex' alignItems='center' paddingInline={24} paddingBlock={8}>
				<Skeleton variant='rect' width='x28' height='x28' flexShrink={0} />
				<Skeleton width='full' marginInlineStart={8} />
			</Box>
		))}
	</>
);

export default AbacRoomPreviewSkeleton;
