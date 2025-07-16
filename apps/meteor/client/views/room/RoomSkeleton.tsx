import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';

import HeaderSkeleton from './Header/HeaderSkeleton';
import HeaderSkeletonV2 from './HeaderV2/HeaderSkeleton';
import RoomComposerSkeleton from './composer/RoomComposer/RoomComposerSkeleton';
import RoomLayout from './layout/RoomLayout';
import MessageListSkeleton from '../../components/message/list/MessageListSkeleton';

const RoomSkeleton = (): ReactElement => (
	<RoomLayout
		header={
			<FeaturePreview feature='newNavigation'>
				<FeaturePreviewOff>
					<HeaderSkeleton />
				</FeaturePreviewOff>
				<FeaturePreviewOn>
					<HeaderSkeletonV2 />
				</FeaturePreviewOn>
			</FeaturePreview>
		}
		body={
			<>
				<MessageListSkeleton />
				<RoomComposerSkeleton />
			</>
		}
	/>
);
export default RoomSkeleton;
