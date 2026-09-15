import type { IRoom } from '@rocket.chat/core-typings';
import { hasJoinedVideoConference } from '@rocket.chat/core-typings';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useSetModal, useUserId } from '@rocket.chat/ui-contexts';
import { Trans, useTranslation } from 'react-i18next';

import ConferenceRoomPanel from './ConferenceRoomPanel';
import ConferenceStoresReady from './ConferenceStoresReady';
import CallPanelHeader from './components/CallPanelHeader';
import NotFoundPage from '../notFound/NotFoundPage';
import ChatAccessModal from './components/ChatAccessModal/ChatAccessModal';
import ConferenceChatNotShared from './components/ConferenceChatNotShared';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';
import { hasConferenceChatAccess } from '../../../lib/videoConference/chatAccess';
import PageLoading from '../root/PageLoading';

const roomTypeIcon = (t?: IRoom['t']) => {
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
	/** A thread of this room to show over it, if one is open. */
	thread?: string;
	onCloseThread?: () => void;
	onClose: () => void;
};

const ConferenceChat = ({
	callId,
	rid,
	tmid,
	roomName,
	roomType,
	loading,
	chatAccess,
	thread,
	onCloseThread,
	onClose,
}: ConferenceChatProps) => {
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

	// One sentence, with the room's icon interpolated into it, rather than three pieces concatenated in this
	// file: a language that puts the room before the word — or drops the preposition — has nowhere to say so
	// when the order is decided here.
	const title = roomName ? (
		<Trans
			i18nKey={tmid ? 'Thread_in__roomName__' : 'Chat_in__roomName__'}
			values={{ roomName }}
			components={{ icon: <Icon name={roomTypeIcon(roomType)} size='x16' /> }}
		/>
	) : (
		t(tmid ? 'Thread' : 'Chat')
	);

	return (
		<Box position='relative' display='flex' flexDirection='column' flexGrow={1} height='full'>
			{/* The icon sits between the words, so the heading's name is given rather than assembled from them. */}
			{/* No `titleLabel` any more: the heading names itself from its own contents, and `Icon` renders
			    `aria-hidden`, so the icon in the middle of the sentence contributes nothing to that name. The
			    label existed to work around an icon that was never in the name to begin with. */}
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
					<ConferenceRoomPanel rid={rid} tmid={tmid} thread={thread} onCloseThread={onCloseThread} onEscape={onClose} />
				</ConferenceStoresReady>
			)}
		</Box>
	);
};

export default ConferenceChat;
