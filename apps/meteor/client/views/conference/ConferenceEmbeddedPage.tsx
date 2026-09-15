import { isInVideoConference, isRingingVideoConferenceMember } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useBreakpoints, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useCustomSound, useUser, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceChat from './ConferenceChat';
import ConferencePageError from './ConferencePageError';
import ConferencePreflight from './ConferencePreflight';
import ConferenceStatePage from './ConferenceStatePage';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import PageLoading from '../root/PageLoading';
import CallMembersPanel from './components/CallMembersPanel/CallMembersPanel';
import CallPanel from './components/CallPanel';
import CallTimer from './components/CallTimer/CallTimer';
import CallTopBar from './components/CallTopBar';
import ChatAccessNotice from './components/ChatAccessNotice/ChatAccessNotice';
import ConferenceIframe from './components/ConferenceIframe';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import { useConferencePresenceLease } from './hooks/useConferencePresenceLease';
import { useConferenceSubscription } from './hooks/useConferenceSubscription';
import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import { useLeaveConferenceOnClose } from './hooks/useLeaveConferenceOnClose';
import { PREFLIGHT_FACES_SHOWN } from '../../../lib/videoConference/constants';
import IconButtonWithBadge from '../../components/IconButtonWithBadge';
import { useRingingExpiry } from '../../hooks/useRingingExpiry';
import { useUnreadDisplay } from '../../sidebar/hooks/useUnreadDisplay';

type ConferenceEmbeddedPageProps = {
	callId: string;
};

type ConferencePanel = 'members' | 'chat';

const emptyUnreadData = { alert: false, userMentions: 0, unread: 0, groupMentions: 0 } as const;

const callHeaderTimerStyles = css`
	display: inline-flex;
	align-items: center;
	min-width: 0;
	color: rgba(255, 255, 255, 0.85);
	font-variant-numeric: tabular-nums;
`;

/**
 * `aria-label` overrides a button's contents, so a badge rendered inside one is never announced. The count is
 * folded into the name instead — as the members action does — and the badge is hidden from assistive technology
 * so it is said once rather than twice.
 */
/**
 * The badges are `aria-hidden`, so whatever they say has to reach the button's own name — the dot included: it
 * is drawn for activity with no count behind it, and a reader who cannot see it would otherwise be told nothing.
 */
const withBadgeCount = (label: string, unread: number, unreadTitle: string, hasUnseenActivity = false): string =>
	(unread > 0 || hasUnseenActivity) && unreadTitle ? `${label}, ${unreadTitle}` : label;

const ConferenceEmbeddedPage = ({ callId }: ConferenceEmbeddedPageProps) => {
	const { room, conference, call } = useConferenceEmbedded(callId);
	const { t } = useTranslation();

	// Which thread is open, rather than the thread itself: it is shown through the chat panel's own modal region,
	// inside the room's provider, so that it can read the room from context instead of opening it a second time.
	// Here it is only an answer to "which one", which the panel turns into a modal.
	const [openThread, setOpenThread] = useState<string>();
	const closeThread = useCallback(() => setOpenThread(undefined), []);

	useConfinedNavigation({ onOpenThread: room.tmid ? undefined : setOpenThread });

	const { leaveNow } = useLeaveConferenceOnClose(callId, conference.departure);

	useConferencePresenceLease(callId, conference.joined);

	const user = useUser();

	const [bannerDismissed, setBannerDismissed] = useState(false);

	const [activePanel, setActivePanel] = useState<ConferencePanel | undefined>();
	const togglePanel = useCallback(
		(panel: ConferencePanel) => {
			// A thread belongs to the chat it was opened from, and that panel is where it is shown — so any click
			// that leaves the chat closed takes the thread with it, rather than leaving one waiting to reappear.
			// Asked as "does the chat survive this click", not "was this click about the chat": switching straight
			// to the members panel closes the chat just as surely as clicking the chat button again does.
			const chatStaysOpen = panel === 'chat' && activePanel !== 'chat';

			setActivePanel((current) => (current === panel ? undefined : panel));

			if (!chatStaysOpen) {
				setOpenThread(undefined);
			}
		},
		[activePanel],
	);
	const chatVisible = activePanel === 'chat';

	const breakpoints = useBreakpoints();
	const tooShortToSplit = useMediaQuery('(max-height: 520px)');

	// Too small to split, in either direction: below `md` there is no width for a panel beside the call, and a
	// phone in landscape has the width but not the height — docking there left the call a third of a short screen
	// and the chat a message list two lines tall above its own composer. Both get the sheet instead.
	//
	// Width alone was the first answer and the wrong one: a phone in landscape is 852pt wide, which is `md`.
	const sheetPanel = !breakpoints.includes('md') || tooShortToSplit;

	useConferenceSubscription(room.rid);

	const subscription = useUserSubscription(room.rid ?? '');
	const { showUnread, unreadCount, unreadVariant, unreadTitle } = useUnreadDisplay(subscription ?? emptyUnreadData);
	const unread = !chatVisible && showUnread ? unreadCount.total : 0;
	const hasUnseenActivity = !chatVisible && !unread && Boolean(subscription?.alert);

	const present = useMemo(() => call.members.filter(isInVideoConference), [call.members]);
	const presentCount = present.length;

	/**
	 * What the chat button's badge says: the unread count, or — when something happened that carries no count —
	 * an empty badge, which is the dot. `undefined` is no badge at all.
	 */
	const chatBadge = (() => {
		if (unread > 0) {
			return unread;
		}

		return hasUnseenActivity ? null : undefined;
	})();

	const { callSounds } = useCustomSound();
	const otherMembers = call.canRing && conference.joined ? call.members.filter((m) => m._id !== user?._id && !isInVideoConference(m)) : [];
	useRingingExpiry(otherMembers.map((m) => m.ringingAt));
	const someoneRinging = otherMembers.some((m) => isRingingVideoConferenceMember(m));
	useEffect(() => {
		if (someoneRinging) {
			callSounds.playDialer();
		} else {
			callSounds.stopDialer();
		}
		return () => callSounds.stopDialer();
	}, [someoneRinging, callSounds]);

	if (room.error) {
		return <ConferenceUnauthorizedPage />;
	}

	if (conference.error) {
		return <ConferencePageError />;
	}

	if (conference.loading) {
		return <PageLoading />;
	}

	if (call.ended && !conference.joined) {
		return <ConferenceStatePage icon='phone-off' title={t('Call_ended')} action={{ label: t('Close'), onClick: leaveNow }} />;
	}

	if (!conference.joined) {
		if (room.loading) {
			return <PageLoading />;
		}

		return (
			// No `confirming`: joining takes this screen down with it — `conference.loading` is that very mutation,
			// and it returns `PageLoading` above — so there is no button left to report it on.
			<ConferencePreflight
				name={call.name}
				action={call.placing ? 'start' : 'join'}
				isDirect={call.canRing}
				canName={call.canRename}
				participants={{ people: present.slice(0, PREFLIGHT_FACES_SHOWN), total: presentCount }}
				capabilities={call.capabilities}
				onConfirm={(preferences, name) => conference.join({ state: preferences, name })}
				onCancel={leaveNow}
			/>
		);
	}

	if (!conference.url) {
		return <ConferenceStatePage icon='warning' title={t('error-videoconf-unexpected')} action={{ label: t('Close'), onClick: leaveNow }} />;
	}

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0} style={{ backgroundColor: 'black' }}>
			{room.chatAccess && !bannerDismissed && (
				<ChatAccessNotice callId={callId} access={room.chatAccess} onDismiss={() => setBannerDismissed(true)} />
			)}

			<CallTopBar
				host={
					<Box className={callHeaderTimerStyles}>
						<CallTimer startAt={call.createdAt} />
						{/* The rule between the clock and the name is drawn, not typed. As a character it was content —
						    read out as "vertical line" by anything that reads the header, and styled by nudging its
						    opacity until it looked like a rule. */}
						{call.name && (
							<Box
								is='span'
								withTruncatedText
								marginInlineStart={8}
								paddingInlineStart={8}
								borderInlineStartWidth='default'
								borderInlineStartStyle='solid'
								borderInlineStartColor='stroke-extra-light'
							>
								{call.name}
							</Box>
						)}
					</Box>
				}
			>
				<IconButtonWithBadge
					small
					secondary
					// The same words in both, because they disagreed: the tooltip said "People" while the accessible
					// name said how many, so anything looking for the button by the name it appeared to have never
					// found it.
					aria-label={t('__count__people_in_the_call', { count: presentCount })}
					title={t('__count__people_in_the_call', { count: presentCount })}
					aria-pressed={activePanel === 'members'}
					onClick={() => togglePanel('members')}
					icon={<Icon name='members' size='x20' color={activePanel === 'members' ? 'info' : undefined} />}
					badge={presentCount > 0 ? presentCount : undefined}
				/>
				<IconButtonWithBadge
					small
					secondary
					aria-label={withBadgeCount(t('Chat'), unread, unreadTitle, hasUnseenActivity)}
					title={t('Chat')}
					aria-pressed={chatVisible}
					onClick={() => togglePanel('chat')}
					icon={<Icon name='balloon' size='x20' color={chatVisible ? 'info' : undefined} />}
					badge={chatBadge}
					badgeVariant={unreadVariant}
					badgeTitle={unreadTitle}
				/>
			</CallTopBar>

			<Box display='flex' flexGrow={1} minHeight={0} position='relative'>
				<Box flexGrow={1} minWidth={0} display='flex' flexDirection='column' position='relative'>
					<ConferenceIframe url={conference.url} />
				</Box>

				<CallPanel visible={!!activePanel} sheet={sheetPanel}>
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
						<ConferenceChat
							callId={callId}
							rid={room.rid}
							tmid={room.tmid}
							roomName={room.name}
							roomType={room.type}
							loading={room.loading}
							chatAccess={room.chatAccess}
							thread={openThread}
							onCloseThread={closeThread}
							onClose={() => togglePanel('chat')}
						/>
					)}
				</CallPanel>
			</Box>
		</Box>
	);
};

export default ConferenceEmbeddedPage;
