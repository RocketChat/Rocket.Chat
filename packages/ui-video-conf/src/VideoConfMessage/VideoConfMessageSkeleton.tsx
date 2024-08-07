import { Skeleton } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement } from 'react';

import VideoConfMessage from './VideoConfMessage';
import VideoConfMessageRow from './VideoConfMessageRow';

type VideoConfMessageSkeletonProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const VideoConfMessageSkeleton = (props: VideoConfMessageSkeletonProps): ReactElement => (
	<VideoConfMessage {...props}>
		<VideoConfMessageRow>
			<Skeleton width='full' pb={4} />
		</VideoConfMessageRow>
		<VideoConfMessageRow backgroundColor='tint'>
			<Skeleton width='full' pb={4} />
		</VideoConfMessageRow>
	</VideoConfMessage>
);

export default VideoConfMessageSkeleton;
