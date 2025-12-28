import { Box, Skeleton } from '@rocket.chat/fuselage';

const PasswordFieldSkeleton = () => (
	<>
		<Skeleton w={65} h={20} />
		<Box display='flex' flexDirection='row' justifyContent='space-between'>
			<Skeleton w={232} h={26} />
			<Skeleton w={20} h={20} variant='circle' />
		</Box>
		<Box display='flex' flexDirection='row' justifyContent='space-between'>
			<Skeleton w={105} h={26} />
			<Skeleton w={20} h={20} variant='circle' />
		</Box>
	</>
);

export default PasswordFieldSkeleton;
