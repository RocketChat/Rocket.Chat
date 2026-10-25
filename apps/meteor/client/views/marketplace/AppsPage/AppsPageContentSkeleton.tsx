import { Skeleton, Box, Stack } from '@rocket.chat/fuselage';

const AppsPageContentSkeleton = () => {
	const loadingSection = (
		<Stack gap={20}>
			<Skeleton height='x28' width='x150' variant='rect' />
			<Stack gap={8}>
				{Array.from({ length: 3 }, (_, i) => (
					<Skeleton key={i} height='x56' width='100%' variant='rect' />
				))}
			</Stack>
		</Stack>
	);
	return (
		<Box paddingInline='x24' display='flex' flexDirection='column' gap='x32' marginBlockEnd='x8'>
			{loadingSection}
			{loadingSection}
			{loadingSection}
		</Box>
	);
};

export default AppsPageContentSkeleton;
