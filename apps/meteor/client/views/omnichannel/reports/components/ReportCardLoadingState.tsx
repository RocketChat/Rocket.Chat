import { Box, Skeleton } from '@rocket.chat/fuselage';

export const ReportCardLoadingState = () => (
	<Box display='flex' height='100%' width='100%' gap={16}>
		<Box flexGrow={1} paddingBlock={8}>
			<Skeleton style={{ transform: 'none' }} height='100%' />
		</Box>
		<Box flexGrow={1}>
			<Skeleton height={28} />
			<Skeleton height={28} />
			<Skeleton height={28} />
			<Skeleton height={28} />
			<Skeleton height={28} />
		</Box>
	</Box>
);
