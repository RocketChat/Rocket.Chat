import { Box, Skeleton } from '@rocket.chat/fuselage';

const OutboubdMessageWizardSkeleton = () => {
	return (
		<Box>
			<Box display='flex'>
				<Skeleton width={75} height={40} />
				<Skeleton mis={8} width={100} height={50} />
				<Skeleton mis={8} width={100} height={50} />
				<Skeleton mis={8} width={100} height={50} />
			</Box>

			<Box mbs={10}>
				<Skeleton width={80} height={30} />
				<Skeleton width='100%' height={50} />
			</Box>
			<Box mbs={10}>
				<Skeleton width={80} height={30} />
				<Skeleton width='100%' height={50} />
			</Box>
			<Box mbs={10}>
				<Skeleton width={80} height={30} />
				<Skeleton width='100%' height={50} />
			</Box>
			<Box mbs={10}>
				<Skeleton width={80} height={30} />
				<Skeleton width='100%' height={50} />
			</Box>
			<Box mbs={10} display='flex' justifyContent='end'>
				<Skeleton width={85} height={60} />
			</Box>
		</Box>
	);
};

export default OutboubdMessageWizardSkeleton;
