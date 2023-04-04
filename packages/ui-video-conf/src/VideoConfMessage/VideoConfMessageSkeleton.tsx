import { Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import VideoConfMessage from './VideoConfMessage';
import VideoConfMessageRow from './VideoConfMessageRow';

const VideoConfMessageSkeleton = (): ReactElement => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<Skeleton width='full' pb='x4' />
		</VideoConfMessageRow>
		<VideoConfMessageRow backgroundColor='tint'>
			<Skeleton width='full' pb='x4' />
		</VideoConfMessageRow>
	</VideoConfMessage>
);

export default VideoConfMessageSkeleton;
