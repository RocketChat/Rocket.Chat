import { Box } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarAction,
	ContextualbarClose,
} from '../../../components/Contextualbar';
import Chat from './chats/Chat';
import ChatInfoDirectory from './chats/contextualBar/ChatInfoDirectory';
import { RoomEditWithData } from './chats/contextualBar/RoomEdit';
import { FormSkeleton } from './components';
import { useOmnichannelRoomInfo } from './hooks/useOmnichannelRoomInfo';

const ChatsContextualBar = ({ chatReload }: { chatReload?: () => void }) => {
	const t = useTranslation();

	const directoryRoute = useRoute('omnichannel-directory');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id') || '';

	const openInRoom = () => id && directoryRoute.push({ tab: 'chats', id, context: 'view' });

	const handleClose = () => directoryRoute.push({ tab: 'chats' });

	const handleCancel = () => id && directoryRoute.push({ tab: 'chats', id, context: 'info' });

	const { data: room, isLoading, isError, refetch: reloadInfo } = useOmnichannelRoomInfo(id);

	if (context === 'view' && id) {
		return <Chat rid={id} />;
	}

	if (isLoading) {
		return (
			<Box pi={24}>
				<FormSkeleton />
			</Box>
		);
	}

	if (isError || !room) {
		return <Box mbs={16}>{t('Room_not_found')}</Box>;
	}

	return (
		<Contextualbar>
			<ContextualbarHeader expanded>
				{context === 'info' && (
					<>
						<ContextualbarIcon name='info-circled' />
						<ContextualbarTitle>{t('Room_Info')}</ContextualbarTitle>
						<ContextualbarAction title={t('View_full_conversation')} name='new-window' onClick={openInRoom} />
					</>
				)}
				{context === 'edit' && (
					<>
						<ContextualbarIcon name='pencil' />
						<ContextualbarTitle>{t('edit-room')}</ContextualbarTitle>
					</>
				)}
				<ContextualbarClose onClick={handleClose} />
			</ContextualbarHeader>
			{context === 'info' && <ChatInfoDirectory id={id} room={room} />}
			{context === 'edit' && id && <RoomEditWithData id={id} reload={chatReload} reloadInfo={reloadInfo} onClose={handleCancel} />}
		</Contextualbar>
	);
};

export default ChatsContextualBar;
