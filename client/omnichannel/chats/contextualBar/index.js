import React from 'react';
import { Icon, Box } from '@rocket.chat/fuselage';

import { ChatInfo } from './ChatInfo';
import { RoomEditWithData } from './ChatRoomForm';
import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useUserSubscription } from '../../../contexts/UserContext';
import { hasPermission } from '../../../../app/authorization/client';

const PATH = 'live';

const ChatsContextualBar = ({ id }) => {
	const t = useTranslation();

	const context = useRouteParameter('context');

	const directoryRoute = useRoute(PATH);

	const subscription = useUserSubscription(id);
	const hasGlobalEditRoomPermission = hasPermission('save-others-livechat-room-info');

	const hasEditAccess = !!subscription || hasGlobalEditRoomPermission;

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
		{context === 'edit' && hasEditAccess ? <RoomEditWithData id={id} close={handleRoomEditBarCloseButtonClick} hasEditAccess={hasEditAccess} /> : <ChatInfo route={PATH} id={id} hasEditAccess={hasEditAccess} />}
	</>;
};

export default ({ rid }) => <ChatsContextualBar id={rid} />;
