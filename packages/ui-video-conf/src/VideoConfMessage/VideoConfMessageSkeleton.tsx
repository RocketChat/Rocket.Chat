import { Skeleton } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement } from 'react';

import VideoConfMessage from './VideoConfMessage';
import VideoConfMessageRow from './VideoConfMessageRow';

const VideoConfMessageSkeleton = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>): ReactElement => (
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
