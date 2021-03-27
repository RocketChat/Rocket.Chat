import React from 'react';
import { Icon, Box } from '@rocket.chat/fuselage';

import { ChatInfo } from './ChatInfo';
import { RoomEditWithData } from './ChatRoomEdit';
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
			<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'><Icon name='info-circled' size='x20' /> {t('Room_Info')}</Box>
			<VerticalBar.Close onClick={closeContextualBar} />
		</VerticalBar.Header>
		{context === 'edit' ? <RoomEditWithData id={id} close={handleRoomEditBarCloseButtonClick} /> : <ChatInfo route={PATH} id={id} />}
	</>;
};

export default ({ rid }) => <ChatsContextualBar id={rid} />;
