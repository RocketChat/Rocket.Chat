import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { roomTypes } from '../../../../app/utils/client';
import Header from '../../../components/Header';
import MarkdownText from '../../../components/MarkdownText';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import { useLayout } from '../../../contexts/LayoutContext';
import { useUserSubscription } from '../../../contexts/UserContext';
import Burger from './Burger';
import QuickActions from './Omnichannel/QuickActions';
import ParentRoomWithData from './ParentRoomWithData';
import ParentTeam from './ParentTeam';
import RoomTitle from './RoomTitle';
import ToolBox from './ToolBox';
import Encrypted from './icons/Encrypted';
import Favorite from './icons/Favorite';
import Translate from './icons/Translate';

const RoomHeader = ({ room, topic }) => {
	const { isMobile } = useLayout();
	const avatar = <RoomAvatar room={room} />;
	const subscription = useUserSubscription(room._id);
	const showQuickActions = roomTypes.showQuickActionButtons(room.t);
	return (
		<Header>
			{isMobile && (
				<Header.ToolBox>
					<Burger />
				</Header.ToolBox>
			)}
			{avatar && <Header.Avatar>{avatar}</Header.Avatar>}
			<Header.Content>
				<Header.Content.Row>
					<RoomTitle room={room} />
					{subscription ? <Favorite room={room} /> : null}
					{room.prid && <ParentRoomWithData room={room} />}
					{room.teamId && !room.teamMain && <ParentTeam room={room} />}
					<Encrypted room={room} />
					<Translate room={room} />
					{showQuickActions && (
						<Box mis='x20' display='flex'>
							<QuickActions room={room} />
						</Box>
					)}
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle>
						{topic && <MarkdownText variant='inlineWithoutBreaks' content={topic} />}
					</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			<Header.ToolBox>
				<ToolBox room={room} />
			</Header.ToolBox>
		</Header>
	);
};

export default RoomHeader;
