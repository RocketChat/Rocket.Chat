import { Skeleton, Stack } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import VideoConfPopup from './VideoConfPopup';
import VideoConfPopupContent from './VideoConfPopupContent';
import VideoConfPopupFooter from './VideoConfPopupFooter';
import VideoConfPopupHeader from './VideoConfPopupHeader';

export type VideoConfPopupSkeletonProps = Omit<ComponentProps<typeof VideoConfPopup>, 'children'>;

const VideoConfPopupSkeleton = (props: VideoConfPopupSkeletonProps) => (
	<VideoConfPopup aria-label='Loading' {...props}>
		<VideoConfPopupHeader>
			<Skeleton width='100%' />
		</VideoConfPopupHeader>
		<VideoConfPopupContent>
			<Stack direction='row' align='center' gap={8}>
				<Skeleton variant='rect' height='x36' width='x36' />
				<Skeleton variant='rect' height='x24' width='x120' />
			</Stack>
		</VideoConfPopupContent>
		<VideoConfPopupFooter>
			<Skeleton variant='rect' height='x40' />
		</VideoConfPopupFooter>
	</VideoConfPopup>
);

export default VideoConfPopupSkeleton;
