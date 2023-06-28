import { Skeleton } from '@rocket.chat/fuselage';
import { Header, HeaderAvatar, HeaderContent, HeaderContentRow } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';

import { ContextualbarSkeleton } from '../../components/Contextualbar';
import MessageListSkeleton from '../../components/message/list/MessageListSkeleton';
import ComposerSkeleton from './Room/ComposerSkeleton';
import RoomLayout from './layout/RoomLayout';

const RoomSkeleton = (): ReactElement => (
	<RoomLayout
		header={
			<Header>
				<HeaderAvatar>
					<Skeleton variant='rect' width={36} height={36} />
				</HeaderAvatar>
				<HeaderContent>
					<HeaderContentRow>
						<Skeleton width='10%' />
					</HeaderContentRow>
					<HeaderContentRow>
						<Skeleton width='30%' />
					</HeaderContentRow>
				</HeaderContent>
			</Header>
		}
		body={
			<>
				<MessageListSkeleton />
				<ComposerSkeleton />
			</>
		}
		aside={<ContextualbarSkeleton />}
	/>
);
export default RoomSkeleton;
