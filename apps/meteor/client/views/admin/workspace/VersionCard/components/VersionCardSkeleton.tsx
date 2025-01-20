import { Box, Skeleton } from '@rocket.chat/fuselage';

export const VersionCardSkeleton = () => {
	return (
		<>
			<Skeleton height={28} width={160} />
			<Skeleton height={28} width={150} />
			<Box display='flex' width={160} height={28} alignItems='center'>
				<Skeleton height={38} width={28} mie={12} />
				<Skeleton height={20} width={120} />
			</Box>
			<Box display='flex' width={180} height={28} alignItems='center'>
				<Skeleton height={38} width={28} mie={12} />
				<Skeleton height={20} width={140} />
			</Box>
			<Box display='flex' width={160} height={28} alignItems='center'>
				<Skeleton height={38} width={28} mie={12} />
				<Skeleton height={20} width={120} />
			</Box>
			<Skeleton height={50} width={160} />
		</>
	);
};
