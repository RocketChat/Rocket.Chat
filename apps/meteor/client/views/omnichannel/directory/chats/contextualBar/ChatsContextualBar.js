import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import { useTabBarClose } from '../../../../room/providers/ToolboxProvider';
import ChatInfo from './ChatInfo';
import RoomEditWithData from './RoomEditWithData';

const PATH = 'live';

const ChatsContextualBar = ({ rid }) => {
	const t = useTranslation();

	const context = useRouteParameter('context');

	const directoryRoute = useRoute(PATH);

	const closeContextualBar = useTabBarClose();

	const handleRoomEditBarCloseButtonClick = () => {
		directoryRoute.push({ id: rid, tab: 'room-info' });
	};

	return (
		<>
			<VerticalBar.Header>
				{(context === 'info' || !context) && (
					<>
						<VerticalBar.Icon name='info-circled' />
						<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
					</>
				)}
				{context === 'edit' && (
					<>
						<VerticalBar.Icon name='pencil' />
						<VerticalBar.Text>{t('edit-room')}</VerticalBar.Text>
					</>
				)}
				<VerticalBar.Close onClick={closeContextualBar} />
			</VerticalBar.Header>
			{context === 'edit' ? <RoomEditWithData id={rid} close={handleRoomEditBarCloseButtonClick} /> : <ChatInfo route={PATH} id={rid} />}
		</>
	);
};

export default ChatsContextualBar;
