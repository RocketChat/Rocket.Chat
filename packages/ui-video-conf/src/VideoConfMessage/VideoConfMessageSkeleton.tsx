import { Skeleton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import VideoConfMessage from './VideoConfMessage';
import VideoConfMessageRow from './VideoConfMessageRow';

const VideoConfMessageSkeleton = (): ReactElement => (
	<VideoConfMessage>
		<VideoConfMessageRow>
			<Skeleton width='full' />
		</VideoConfMessageRow>
		<VideoConfMessageRow backgroundColor='neutral-100'>
			<Skeleton width='full' />
		</VideoConfMessageRow>
	</VideoConfMessage>
);

export default VideoConfMessageSkeleton;
