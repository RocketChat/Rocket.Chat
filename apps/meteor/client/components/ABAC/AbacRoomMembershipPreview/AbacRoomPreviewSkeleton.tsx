import { Box, Skeleton } from '@rocket.chat/fuselage';

const AbacRoomPreviewSkeleton = () => (
	<>
		{Array.from({ length: 3 }, (_, index) => (
			<Box
				key={index}
				display='grid'
				alignItems='center'
				gap={8}
				paddingInline={24}
				paddingBlock={8}
				style={{ gridTemplateColumns: 'auto 1fr' }}
			>
				<Skeleton variant='rect' width='x28' height='x28' />
				<Skeleton width='full' />
			</Box>
		))}
	</>
);

export default AbacRoomPreviewSkeleton;
