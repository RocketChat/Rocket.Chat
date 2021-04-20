import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import ChatInfo from './chats/contextualBar/ChatInfo';
import RoomEditWithData from './chats/contextualBar/RoomEditWithData';

const ChatsContextualBar = ({ chatReload }) => {
	const liveRoute = useRoute('live');
	const directoryRoute = useRoute('omnichannel-directory');

	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const t = useTranslation();

	const openInRoom = () => {
		liveRoute.push({ id });
	};

	const handleChatsVerticalBarCloseButtonClick = () => {
		directoryRoute.push({ tab: 'chats' });
	};

	return (
		<VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{context === 'info' && (
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
				{context === 'edit' && (
					<>
						<VerticalBar.Icon name='pencil' />
						<VerticalBar.Text>{t('edit-room')}</VerticalBar.Text>
					</>
				)}
				<VerticalBar.Close onClick={handleChatsVerticalBarCloseButtonClick} />
			</VerticalBar.Header>
			{context === 'info' && <ChatInfo id={id} />}
			{context === 'edit' && (
				<RoomEditWithData
					id={id}
					close={handleChatsVerticalBarCloseButtonClick}
					reload={chatReload}
				/>
			)}
		</VerticalBar>
	);
};

export default ChatsContextualBar;
