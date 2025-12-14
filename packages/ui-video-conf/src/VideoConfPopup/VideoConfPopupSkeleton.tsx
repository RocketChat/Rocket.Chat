import { Box, Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import VideoConfPopup from './VideoConfPopup';
import VideoConfPopupContent from './VideoConfPopupContent';
import VideoConfPopupFooter from './VideoConfPopupFooter';
import VideoConfPopupHeader from './VideoConfPopupHeader';

type VideoConfPopupSkeletonProps = Omit<ComponentProps<typeof VideoConfPopup>, 'children'>;

const VideoConfPopupSkeleton = (props: VideoConfPopupSkeletonProps) => (
	<VideoConfPopup aria-label='Loading' {...props}>
		<VideoConfPopupHeader>
			<Skeleton width='100%' />
		</VideoConfPopupHeader>
		<VideoConfPopupContent>
			<Box display='flex' alignItems='center'>
				<Skeleton variant='rect' height='x36' width='x36' />
				<Skeleton mis={8} variant='rect' height='x24' width='x120' />
			</Box>
		</VideoConfPopupContent>
		<VideoConfPopupFooter>
			<Skeleton variant='rect' height='x40' />
		</VideoConfPopupFooter>
	</VideoConfPopup>
);

export default VideoConfPopupSkeleton;
