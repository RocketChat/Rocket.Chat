import { Skeleton, Box } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';

import VerticalBarSkeleton from '../../components/VerticalBar/VerticalBarSkeleton';
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
				<Box display='flex' height='100%' justifyContent='flex-start' flexDirection='column'>
					<Box pi='x24' pb='x16' display='flex'>
						<Box>
							<Skeleton variant='rect' width={36} height={36} />
						</Box>
						<Box mis='x8' flexGrow={1}>
							<Skeleton width='100%' />
							<Skeleton width='69%' />
						</Box>
					</Box>
					<Box pi='x24' pb='x16' display='flex'>
						<Box>
							<Skeleton variant='rect' width={36} height={36} />
						</Box>
						<Box mis='x8' flexGrow={1}>
							<Skeleton width='100%' />
							<Skeleton width='40%' />
						</Box>
					</Box>
				</Box>
				<ComposerSkeleton />
			</>
		}
		aside={<VerticalBarSkeleton />}
	/>
);
export default RoomSkeleton;
