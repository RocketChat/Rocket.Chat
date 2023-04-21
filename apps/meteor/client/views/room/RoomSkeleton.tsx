import { Skeleton } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';

import VerticalBarSkeleton from '../../components/VerticalBar/VerticalBarSkeleton';
import MessageListSkeleton from '../../components/message/list/MessageListSkeleton';
import ComposerSkeleton from './Room/ComposerSkeleton';
import RoomLayout from './layout/RoomLayout';

const RoomSkeleton = (): ReactElement => (
	<RoomLayout
		header={
			<Header>
				<Header.Avatar>
					<Skeleton variant='rect' width={36} height={36} />
				</Header.Avatar>
				<Header.Content>
					<Header.Content.Row>
						<Skeleton width='10%' />
					</Header.Content.Row>
					<Header.Content.Row>
						<Skeleton width='30%' />
					</Header.Content.Row>
				</Header.Content>
			</Header>
		}
		body={
			<>
				<MessageListSkeleton />
				<ComposerSkeleton />
			</>
		}
		aside={<VerticalBarSkeleton />}
	/>
);
export default RoomSkeleton;
