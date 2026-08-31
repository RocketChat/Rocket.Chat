import type { IRoom } from '@rocket.chat/core-typings';
import { hasJoinedVideoConference } from '@rocket.chat/core-typings';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useSetModal, useUserId } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ConferenceRoomPanel from './ConferenceRoomPanel';
import ConferenceStoresReady from './ConferenceStoresReady';
import CallPanelHeader from './components/CallPanelHeader';
import NotFoundPage from '../notFound/NotFoundPage';
import ChatAccessModal from './components/ChatAccessModal/ChatAccessModal';
import ConferenceChatNotShared from './components/ConferenceChatNotShared';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';
import { hasConferenceChatAccess } from '../../../lib/videoConference/chatAccess';
import PageLoading from '../root/PageLoading';

const roomTypeIcon = (t?: IRoom['t']): 'hash' | 'hashtag-lock' | 'at' | 'baloons' => {
	switch (t) {
		case 'p':
			return 'hashtag-lock';
		case 'd':
			return 'at';
		default:
			return 'hash';
	}
};

type ConferenceChatProps = {
	callId: string;
	rid?: string;
	tmid?: string;
	roomName?: string;
	roomType?: IRoom['t'];
	loading: boolean;
	chatAccess?: ConferenceChatAccess;
	onClose: () => void;
};

const ConferenceChat = ({ callId, rid, tmid, roomName, roomType, loading, chatAccess, onClose }: ConferenceChatProps) => {
	const { t } = useTranslation();
	const uid = useUserId();
	const setModal = useSetModal();

	if (loading) {
		return <PageLoading />;
	}

	if (!rid) {
		return <NotFoundPage />;
	}

	// Membership grants no room access, so the chat may be a room this user can't read. The server already
	// worked out who those members are, which beats letting the room fetch fail and calling it a missing page.
	const shared = hasConferenceChatAccess(chatAccess, uid);
	const presentWithoutAccess = shared && chatAccess ? chatAccess.members.filter(hasJoinedVideoConference).length : 0;

	const headerLabel = tmid ? t('Thread') : t('Chat');
	const title = roomName ? (
		<>
			{/* Labelled as a whole, because the icon between the words otherwise lands in the middle of the name. */}
			<Box is='span' aria-label={`${tmid ? t('Thread_in') : t('Chat_in')} ${roomName}`}>
				{tmid ? t('Thread_in') : t('Chat_in')} <Icon name={roomTypeIcon(roomType)} size='x16' /> {roomName}
			</Box>
		</>
	) : (
		headerLabel
	);

	return (
		<Box position='relative' display='flex' flexDirection='column' flexGrow={1} height='full'>
			<CallPanelHeader title={title} onClose={onClose}>
				{presentWithoutAccess > 0 && chatAccess && (
					<IconButton
						icon='balloon-exclamation'
						small
						aria-label={t('__count__participants_cannot_see_the_chat', { count: presentWithoutAccess })}
						title={t('__count__participants_cannot_see_the_chat', { count: presentWithoutAccess })}
						danger
						onClick={() => setModal(<ChatAccessModal callId={callId} access={chatAccess} onClose={() => setModal(null)} />)}
					/>
				)}
			</CallPanelHeader>

			{!shared && <ConferenceChatNotShared />}

			{shared && (
				<ConferenceStoresReady>
					<ConferenceRoomPanel rid={rid} tmid={tmid} onEscape={onClose} />
				</ConferenceStoresReady>
			)}
		</Box>
	);
};

export default ConferenceChat;
