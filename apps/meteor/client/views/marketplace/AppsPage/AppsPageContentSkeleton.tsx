import { Skeleton, Box } from '@rocket.chat/fuselage';

const AppsPageContentSkeleton = () => {
	const loadingRows = Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height='x56' marginBlockEnd={8} width='100%' variant='rect' />);
	return (
		<Box paddingInline={24}>
			<Box marginBlockEnd={36}>
				<Skeleton height='x28' width='x150' marginBlockEnd={20} variant='rect' />
				{loadingRows}
			</Box>
			<Box marginBlockEnd={36}>
				<Skeleton height='x28' width='x150' marginBlockEnd={20} variant='rect' />
				{loadingRows}
			</Box>
			<Skeleton height='x28' width='x150' marginBlockEnd={20} variant='rect' />
			{loadingRows}
		</Box>
	);
};

export default AppsPageContentSkeleton;
