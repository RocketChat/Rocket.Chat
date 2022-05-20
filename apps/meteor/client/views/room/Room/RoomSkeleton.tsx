import { Skeleton, Box, InputBox } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import Header from '../../../components/Header';
import VerticalBarSkeleton from '../../../components/VerticalBar/VerticalBarSkeleton';
import { RoomTemplate } from '../components/RoomTemplate/RoomTemplate';

const RoomSkeleton: FC = () => (
	<RoomTemplate>
		<RoomTemplate.Header>
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
		</RoomTemplate.Header>
		<RoomTemplate.Body>
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
			<Box pi='x24' pb='x16' display='flex'>
				<InputBox.Skeleton />
			</Box>
		</RoomTemplate.Body>
		<RoomTemplate.Aside>
			<VerticalBarSkeleton />
		</RoomTemplate.Aside>
	</RoomTemplate>
);
export default memo(RoomSkeleton);
