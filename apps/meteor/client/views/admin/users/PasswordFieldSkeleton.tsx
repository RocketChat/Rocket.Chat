import { Box, Skeleton } from '@rocket.chat/fuselage';

const PasswordFieldSkeleton = () => (
	<>
		<Skeleton width={65} height={20} />
		<Box display='flex' flexDirection='row' justifyContent='space-between'>
			<Skeleton width={232} height={26} />
			<Skeleton width={20} height={20} variant='circle' />
		</Box>
		<Box display='flex' flexDirection='row' justifyContent='space-between'>
			<Skeleton width={105} height={26} />
			<Skeleton width={20} height={20} variant='circle' />
		</Box>
	</>
);

export default PasswordFieldSkeleton;
