import { isInVideoConference } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CallMembersPanel from './CallMembersPanel';
import ChatAccessNotice from './ChatAccessNotice';
import ConferenceChat from './ConferenceChat';
import ConferenceIframe from './ConferenceIframe';
import ConferencePageError from './ConferencePageError';
import ConferencePreflight from './ConferencePreflight';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import CallBar from './components/CallBar/CallBar';
import CallBarAction from './components/CallBar/CallBarAction';
import CallPanel from './components/CallPanel/CallPanel';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import { useConferenceSubscription } from './hooks/useConferenceSubscription';
import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import { useLeaveConferenceOnClose } from './hooks/useLeaveConferenceOnClose';
import { useUnreadDisplay } from '../../sidebar/hooks/useUnreadDisplay';
import PageLoading from '../root/PageLoading';

type ConferenceEmbeddedPageProps = {
	callId: string;
};

/** The two things that can share the space beside the call. One at a time — two would leave the call a sliver. */
type ConferencePanel = 'members' | 'chat';

/** Stands in until the subscription loads, or for a member who has none because they can't read the chat. */
const emptyUnreadData = { alert: false, userMentions: 0, unread: 0, groupMentions: 0 } as const;

/**
 * Renders a conference as the call plus a bottom control bar, with the conference's persistent chat in a
 * panel that opens beside the call — above the bar, so toggling it never reflows the controls.
 */
const ConferenceEmbeddedPage = ({ callId }: ConferenceEmbeddedPageProps) => {
	const { room, conference, call } = useConferenceEmbedded(callId);
	const { t } = useTranslation();

	// The chat panel is a full room UI, so a link/mention click would navigate this window away and tear
	// down the call. Keep this window pinned to the conference — those go to the opener or a new tab.
	useConfinedNavigation();

	// Closing this window is the only end-of-call signal a provider that doesn't report one leaves us, and the
	// call has to end for its history to be written.
	const { leaveNow } = useLeaveConferenceOnClose(callId);

	// Members is the one open on arrival: the useful question then is who else is here, and for the caller of a
	// call still ringing it is the only place that answers it. Toggling the open one closes it.
	const [activePanel, setActivePanel] = useState<ConferencePanel | undefined>('members');
	const togglePanel = useCallback((panel: ConferencePanel) => setActivePanel((current) => (current === panel ? undefined : panel)), []);
	const chatVisible = activePanel === 'chat';

	// On narrow viewports the panel floats over the call instead of squeezing it.
	const breakpoints = useBreakpoints();
	const overlayPanel = !breakpoints.includes('md');

	// Owned by the page rather than the chat panel: the badge below needs it while that panel is closed, and the
	// panel isn't mounted then.
	useConferenceSubscription(room.rid);

	// The same rules the sidebar's room item uses, so a mention reads as urgent in both places and a room the
	// user muted stays quiet in both. Nothing to show while the chat is the panel they are looking at.
	const subscription = useUserSubscription(room.rid ?? '');
	const { showUnread, unreadCount, unreadVariant, unreadTitle } = useUnreadDisplay(subscription ?? emptyUnreadData);
	const unread = !chatVisible && showUnread ? unreadCount.total : 0;

	// How many people are actually in the call, which is the number worth glancing at.
	const presentCount = call.members.filter(isInVideoConference).length;

	// No access to the conference's room — show the unauthorized screen for the whole page rather than a
	// broken split with a "not found" chat panel.
	if (room.error) {
		return <ConferenceUnauthorizedPage />;
	}

	if (conference.error) {
		return <ConferencePageError />;
	}

	if (conference.loading) {
		return <PageLoading />;
	}

	// Not in the call yet: the user says how they want to arrive, and joining is what turns that into the
	// provider's URL. Waiting for the conference to load first means the name and the devices on offer are the
	// real ones.
	if (!conference.url) {
		if (room.loading) {
			return <PageLoading />;
		}

		return (
			<ConferencePreflight
				name={call.name}
				// Placing a call means nobody has been asked to answer it yet — confirming is what starts it.
				action={call.placing ? 'start' : 'join'}
				isDirect={call.canRing}
				canName={call.canRename}
				capabilities={call.capabilities}
				onConfirm={(preferences, name) => conference.join({ state: preferences, name })}
				onCancel={leaveNow}
			/>
		);
	}

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0}>
			{/* Above the call and both panels: the situation is about the call, not about whichever panel happens
			    to be open, and a banner that moved as panels changed would read as a different message each time. */}
			{room.chatAccess && <ChatAccessNotice callId={callId} access={room.chatAccess} />}

			<Box display='flex' flexGrow={1} minHeight={0} position='relative'>
				<Box flexGrow={1} display='flex' flexDirection='column' position='relative'>
					<ConferenceIframe url={conference.url} />
				</Box>

				{/* One panel at a time: they share the same space, and two side panels would leave the call a
				    sliver. Which one is open is the single source of truth, so the bar can't disagree with it. */}
				<CallPanel visible={!!activePanel} overlay={overlayPanel}>
					{activePanel === 'members' && (
						<CallMembersPanel
							callId={callId}
							rid={room.rid}
							members={call.members}
							chatAccess={room.chatAccess}
							onClose={() => togglePanel('members')}
						/>
					)}
					{activePanel === 'chat' && (
						<ConferenceChat rid={room.rid} loading={room.loading} chatAccess={room.chatAccess} onClose={() => togglePanel('chat')} />
					)}
				</CallPanel>
			</Box>

			<CallBar>
				<CallBarAction
					icon='team'
					label={t('Members')}
					pressed={activePanel === 'members'}
					badgeCount={presentCount}
					badgeTitle={t('__count__people_in_the_call', { count: presentCount })}
					onClick={() => togglePanel('members')}
				/>
				<CallBarAction
					icon='balloon'
					label={t('Chat')}
					pressed={chatVisible}
					badgeCount={unread}
					badgeVariant={unreadVariant}
					badgeTitle={unreadTitle}
					onClick={() => togglePanel('chat')}
				/>
			</CallBar>
		</Box>
	);
};

export default ConferenceEmbeddedPage;
