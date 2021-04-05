import React from 'react';

import { ChatInfo } from './ChatInfo';
import { RoomEditWithData } from './ChatRoomForm';
import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const PATH = 'live';

const ChatsContextualBar = ({ id }) => {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const directoryRoute = useRoute(PATH);

	const closeContextualBar = () => {
		directoryRoute.push({ id });
	};

	const handleRoomEditBarCloseButtonClick = () => {
		directoryRoute.push({ id, tab: 'room-info' });
	};

	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='info-circled' />
			<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
			<VerticalBar.Close onClick={closeContextualBar} />
		</VerticalBar.Header>
		{context === 'edit' ? <RoomEditWithData id={id} close={handleRoomEditBarCloseButtonClick} /> : <ChatInfo route={PATH} id={id} />}
	</>;
};

export default ({ rid }) => <ChatsContextualBar id={rid} />;
