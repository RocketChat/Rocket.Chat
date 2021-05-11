import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import Chat from './chats/Chat';
import ChatInfo from './chats/contextualBar/ChatInfo';
import RoomEditWithData from './chats/contextualBar/RoomEditWithData';

const ChatsContextualBar = ({ chatReload }) => {
	const directoryRoute = useRoute('omnichannel-directory');

	const bar = useRouteParameter('bar') || 'info';
	const id = useRouteParameter('id');

	const t = useTranslation();

	const openInRoom = () => {
		directoryRoute.push({ page: 'chats', id, bar: 'view' });
	};

	const handleChatsVerticalBarCloseButtonClick = () => {
		directoryRoute.push({ page: 'chats' });
	};

	const handleChatsVerticalBarBackButtonClick = () => {
		directoryRoute.push({ page: 'chats', id, bar: 'info' });
	};

	if (bar === 'view') {
		return <Chat rid={id} />;
	}

	return (
		<VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{bar === 'info' && (
					<>
						<VerticalBar.Icon name='info-circled' />
						<VerticalBar.Text>{t('Room_Info')}</VerticalBar.Text>
						<VerticalBar.Action
							title={t('View_full_conversation')}
							name={'new-window'}
							onClick={openInRoom}
						/>
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
			{bar === 'info' && <ChatInfo id={id} />}
			{bar === 'edit' && (
				<RoomEditWithData
					id={id}
					close={handleChatsVerticalBarBackButtonClick}
					reload={chatReload}
				/>
			)}
		</VerticalBar>
	);
};

export default ChatsContextualBar;
