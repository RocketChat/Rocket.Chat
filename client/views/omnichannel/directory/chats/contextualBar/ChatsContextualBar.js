import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../../../contexts/RouterContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import ChatInfo from './ChatInfo';
import RoomEditWithData from './RoomEditWithData';

const PATH = 'live';

const ChatsContextualBar = ({ rid }) => {
	const t = useTranslation();

	const context = useRouteParameter('context');

	const directoryRoute = useRoute(PATH);

	const closeContextualBar = () => {
		directoryRoute.push({ id: rid });
	};

	const handleRoomEditBarCloseButtonClick = () => {
		directoryRoute.push({ id: rid, tab: 'room-info' });
	};

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='info-circled' />
				<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
				<VerticalBar.Close onClick={closeContextualBar} />
			</VerticalBar.Header>
			{context === 'edit' ? (
				<RoomEditWithData id={rid} close={handleRoomEditBarCloseButtonClick} />
			) : (
				<ChatInfo route={PATH} id={rid} />
			)}
		</>
	);
};

export default ChatsContextualBar;
