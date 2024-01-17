import { Box } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
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

const ChatsContextualBar: FC<{ chatReload?: () => void }> = ({ chatReload }) => {
	const directoryRoute = useRoute('omnichannel-directory');

	const bar = useRouteParameter('bar') || 'info';
	const id = useRouteParameter('id') || '';

	const t = useTranslation();

	const openInRoom = (): void => {
		id && directoryRoute.push({ page: 'chats', id, bar: 'view' });
	};

	const handleChatsContextualbarCloseButtonClick = (): void => {
		directoryRoute.push({ page: 'chats' });
	};

	const handleChatsContextualbarBackButtonClick = (): void => {
		id && directoryRoute.push({ page: 'chats', id, bar: 'info' });
	};

	const { data: room, isLoading, isError, refetch: reloadInfo } = useOmnichannelRoomInfo(id);

	if (bar === 'view' && id) {
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
				{bar === 'info' && (
					<>
						<ContextualbarIcon name='info-circled' />
						<ContextualbarTitle>{t('Room_Info')}</ContextualbarTitle>
						<ContextualbarAction title={t('View_full_conversation')} name='new-window' onClick={openInRoom} />
					</>
				)}
				{bar === 'edit' && (
					<>
						<ContextualbarIcon name='pencil' />
						<ContextualbarTitle>{t('edit-room')}</ContextualbarTitle>
					</>
				)}
				<ContextualbarClose onClick={handleChatsContextualbarCloseButtonClick} />
			</ContextualbarHeader>
			{bar === 'info' && <ChatInfoDirectory id={id} room={room} />}
			{bar === 'edit' && (
				<RoomEditWithData id={id} reload={chatReload} reloadInfo={reloadInfo} onClose={handleChatsContextualbarBackButtonClick} />
			)}
		</Contextualbar>
	);
};

export default ChatsContextualBar;
