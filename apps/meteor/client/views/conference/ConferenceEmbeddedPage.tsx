import { isInVideoConference } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import CallMembersPanel from './CallMembersPanel';
import CallOutcomeModal from './CallOutcomeModal';
import ChatAccessNotice from './ChatAccessNotice';
import ConferenceChat from './ConferenceChat';
import ConferenceIframe from './ConferenceIframe';
import ConferencePageError from './ConferencePageError';
import ConferencePreflight from './ConferencePreflight';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import { CallBar, CallBarActions, CallBarAction, CallPanel } from './components';
import { useCallOutcome } from './hooks/useCallOutcome';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import { useConferenceSubscription } from './hooks/useConferenceSubscription';
import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import { useLeaveConferenceOnClose } from './hooks/useLeaveConferenceOnClose';
import { useProviderCallBridge } from './hooks/useProviderCallBridge';
import { useUnreadDisplay } from '../../sidebar/hooks/useUnreadDisplay';
import PageLoading from '../root/PageLoading';

type ConferenceEmbeddedPageProps = {
	callId: string;
};

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

	// The caller now lands here while the other side is still ringing, so this window is where they find out it
	// went nowhere.
	const { outcome, others, onRang, onDismiss } = useCallOutcome(call.members);

	// Through the app's modal region rather than rendered here: that is what puts it in a portal, over a
	// backdrop, with focus trapped. Rendered inline it would sit in the page's flex column and push the call
	// and the chat panel down the screen.
	const setModal = useSetModal();

	useEffect(() => {
		// Not while the user is still on the preflight: they are deciding how to arrive, and "nobody answered —
		// stay, ring again or leave" is a question about a call they are already in.
		if (!outcome || !conference.url) {
			return;
		}

		setModal(
			<CallOutcomeModal
				callId={callId}
				outcome={outcome}
				others={others}
				canRing={call.canRing}
				onRang={onRang}
				onStay={onDismiss}
				onLeave={leaveNow}
			/>,
		);

		// Anything that resolves the wait — someone answering, a fresh ring, the user choosing — clears `outcome`,
		// and should take the modal down with it.
		return () => setModal(null);
	}, [outcome, others, call.canRing, callId, conference.url, onRang, onDismiss, leaveNow, setModal]);

	// A provider rendering its own toolbar can hide our bar and drive the chat panel from its own controls.
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const { callBarVisible, activePanel, togglePanel } = useProviderCallBridge(iframeRef);
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
					<ConferenceIframe ref={iframeRef} url={conference.url} />
				</Box>

				{/* One panel at a time: they share the same space, and two side panels would leave the call a
				    sliver. Which one is open is the single source of truth, so the bar can't disagree with it. */}
				<CallPanel visible={!!activePanel} overlay={overlayPanel}>
					{activePanel === 'members' && (
						<CallMembersPanel
							callId={callId}
							rid={room.rid}
							members={call.members}
							membersWithoutChatAccess={room.chatAccess?.membersWithoutAccess ?? []}
							onClose={() => togglePanel('members')}
						/>
					)}
					{activePanel === 'chat' && (
						<ConferenceChat rid={room.rid} loading={room.loading} chatAccess={room.chatAccess} onClose={() => togglePanel('chat')} />
					)}
				</CallPanel>
			</Box>

			{callBarVisible && (
				<CallBar>
					<CallBarActions placement='end'>
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
					</CallBarActions>
				</CallBar>
			)}
		</Box>
	);
};

export default ConferenceEmbeddedPage;
