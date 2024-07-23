import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';

import MessageListSkeleton from '../../components/message/list/MessageListSkeleton';
import HeaderSkeleton from './Header/HeaderSkeleton';
import HeaderSkeletonV2 from './HeaderV2/HeaderSkeleton';
import RoomComposerSkeleton from './composer/RoomComposer/RoomComposerSkeleton';
import RoomLayout from './layout/RoomLayout';

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
