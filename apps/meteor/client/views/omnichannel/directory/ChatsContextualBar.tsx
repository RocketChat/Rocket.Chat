import { Box } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
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

	const handleChatsVerticalBarCloseButtonClick = (): void => {
		directoryRoute.push({ page: 'chats' });
	};

	const handleChatsVerticalBarBackButtonClick = (): void => {
		id && directoryRoute.push({ page: 'chats', id, bar: 'info' });
	};

	const { data: room, isLoading, isError, refetch: reloadInfo } = useOmnichannelRoomInfo(id);

	if (bar === 'view' && id) {
		return <Chat rid={id} />;
	}

	if (isLoading) {
		return (
			<Box pi='x24'>
				<FormSkeleton />
			</Box>
		);
	}

	if (isError || !room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	return (
		<VerticalBar>
			<VerticalBar.Header expanded>
				{bar === 'info' && (
					<>
						<VerticalBar.Icon name='info-circled' />
						<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
						<VerticalBar.Action title={t('View_full_conversation')} name={'new-window'} onClick={openInRoom} />
					</>
				)}
				{bar === 'edit' && (
					<>
						<VerticalBar.Icon name='pencil' />
						<VerticalBar.Text>{t('edit-room')}</VerticalBar.Text>
					</>
				)}
				<VerticalBar.Close onClick={handleChatsVerticalBarCloseButtonClick} />
			</VerticalBar.Header>
			{bar === 'info' && <ChatInfoDirectory id={id} room={room} />}
			{bar === 'edit' && (
				<RoomEditWithData id={id} reload={chatReload} reloadInfo={reloadInfo} onClose={handleChatsVerticalBarBackButtonClick} />
			)}
		</VerticalBar>
	);
};

export default ChatsContextualBar;
