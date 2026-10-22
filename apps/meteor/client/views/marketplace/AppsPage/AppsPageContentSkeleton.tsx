import { Skeleton, Box } from '@rocket.chat/fuselage';

const AppsPageContentSkeleton = () => {
	const loadingSection = (
		<Box display='flex' flexDirection='column' gap={20}>
			<Skeleton height='x28' width='x150' variant='rect' />
			<Box display='flex' flexDirection='column' gap={8}>
				{Array.from({ length: 3 }, (_, i) => (
					<Skeleton key={i} height='x56' width='100%' variant='rect' />
				))}
			</Box>
		</Box>
	);
	return (
		<Box paddingInline={24} display='flex' flexDirection='column' gap={36} marginBlockEnd={8}>
			{loadingSection}
			{loadingSection}
			{loadingSection}
		</Box>
	);
};

export default AppsPageContentSkeleton;
