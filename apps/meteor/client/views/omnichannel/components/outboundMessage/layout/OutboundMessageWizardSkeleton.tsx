import { Box, Skeleton, Stack } from '@rocket.chat/fuselage';

/**
 * The wizard's tabs and fields as placeholders, while its providers load.
 */
const OutboundMessageWizardSkeleton = () => {
	return (
		<Box role='status' aria-busy='true'>
			<Stack direction='row' gap='x8'>
				<Skeleton width={75} height={40} />
				<Skeleton width={100} height={50} />
				<Skeleton width={100} height={50} />
				<Skeleton width={100} height={50} />
			</Stack>

			<Box marginBlockStart='x8'>
				<Skeleton width={80} height={30} />
				<Skeleton width='100%' height={50} />
			</Box>
			<Box marginBlockStart='x8'>
				<Skeleton width={80} height={30} />
				<Skeleton width='100%' height={50} />
			</Box>
			<Box marginBlockStart='x8'>
				<Skeleton width={80} height={30} />
				<Skeleton width='100%' height={50} />
			</Box>
			<Box marginBlockStart='x8'>
				<Skeleton width={80} height={30} />
				<Skeleton width='100%' height={50} />
			</Box>
			<Box marginBlockStart='x8' display='flex' justifyContent='end'>
				<Skeleton width={85} height={60} />
			</Box>
		</Box>
	);
};

export default OutboundMessageWizardSkeleton;
