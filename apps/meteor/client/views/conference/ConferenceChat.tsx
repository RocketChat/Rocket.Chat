import type { IRoom } from '@rocket.chat/core-typings';
import { isInVideoConference } from '@rocket.chat/core-typings';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import {
	CallPanelHeader,
	ChatAccessModal,
	ConferenceContext,
	ConferenceChatNotShared,
	hasConferenceChatAccess,
	useConference,
	useConferenceChatPanel,
} from '@rocket.chat/ui-conference';
import { useSetModal, useUserId } from '@rocket.chat/ui-contexts';
import { Trans, useTranslation } from 'react-i18next';

import ConferenceRoomPanel from './ConferenceRoomPanel';
import NotFoundPage from '../notFound/NotFoundPage';
import PageLoading from '../root/PageLoading';
import { useMainReady } from '../root/hooks/useMainReady';

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

/**
 * The call's chat: the product's own room, rendered inside the conference window's panel.
 *
 * It is handed to the window as a node rather than built by it, because it is a whole room — its provider, its
 * message list, its composer — and none of that belongs in a package of call chrome. What it reads, it reads
 * from the conference it is mounted in; closing the panel it sits in is the panel's to do, and it asks.
 */
const ConferenceChat = () => {
	const { t } = useTranslation();
	const uid = useUserId();
	const setModal = useSetModal();
	const storesReady = useMainReady();
	const conference = useConference();
	const { room, thread } = conference;
	const { close } = useConferenceChatPanel();

	const { rid, tmid, name: roomName, type: roomType, loading, chatAccess } = room;

	if (loading) {
		return <PageLoading />;
	}

	if (!rid) {
		return <NotFoundPage />;
	}

	// Membership grants no room access, so the chat may be a room this user can't read. The server already
	// worked out who those members are, which beats letting the room fetch fail and calling it a missing page.
	const shared = hasConferenceChatAccess(chatAccess, uid);
	// In the call now, not merely recorded as having joined it: `joined` is never taken back, so counting on it
	// went on reporting people who had already left as unable to read a chat they are no longer in.
	const presentWithoutAccess = shared && chatAccess ? chatAccess.members.filter(isInVideoConference).length : 0;

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
			<CallPanelHeader title={title} onClose={close}>
				{presentWithoutAccess > 0 && chatAccess && (
					<IconButton
						icon='balloon-exclamation'
						small
						aria-label={t('__count__participants_cannot_see_the_chat', { count: presentWithoutAccess })}
						title={t('__count__participants_cannot_see_the_chat', { count: presentWithoutAccess })}
						danger
						// Carried across because the app's modal region is mounted above this window, outside the
						// conference's provider — the modal reads the viewer and the share action from it.
						onClick={() =>
							setModal(
								<ConferenceContext.Provider value={conference}>
									<ChatAccessModal access={chatAccess} onClose={() => setModal(null)} />
								</ConferenceContext.Provider>,
							)
						}
					/>
				)}
			</CallPanelHeader>

			{!shared && <ConferenceChatNotShared />}

			{/* The stores are marked ready by `useConferenceSubscription`, up in the provider; this waits for that to
			    have happened, because the room UI reads the flag and renders nothing useful before it is set. */}
			{shared &&
				(storesReady ? (
					<ConferenceRoomPanel rid={rid} tmid={tmid} thread={thread.tmid} onCloseThread={thread.close} onEscape={close} />
				) : (
					<PageLoading />
				))}
		</Box>
	);
};

export default ConferenceChat;
