import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { memo, useMemo } from 'react';

const availablePercentualWidths = [47, 68, 75, 82];

type MessageListSkeletonProps = {
	messageCount?: number;
};

const MessageListSkeleton = ({ messageCount = 2 }: MessageListSkeletonProps): ReactElement => {
	const widths = useMemo(
		() => Array.from({ length: messageCount }, (_, index) => `${availablePercentualWidths[index % availablePercentualWidths.length]}%`),
		[messageCount],
	);

	return (
		<Box display='flex' height='100%' justifyContent='flex-start' flexDirection='column'>
			{widths.map((width, index) => (
				<Box key={index} pi={24} pb={16} display='flex'>
					<Box>
						<Skeleton variant='rect' width={36} height={36} />
					</Box>
					<Box mis={8} flexGrow={1}>
						<Skeleton width='100%' />
						<Skeleton width={width} />
					</Box>
				</Box>
			))}
		</Box>
	);
};

export default memo(MessageListSkeleton);
