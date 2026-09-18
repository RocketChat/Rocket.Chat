import { isInVideoConference } from '@rocket.chat/core-typings';
import { Badge, Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useBreakpoints, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useCustomSound } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConferencePreflight from './ConferencePreflight';
import ConferenceStatePage from './ConferenceStatePage';
import CallMembersPanel from '../components/CallMembersPanel/CallMembersPanel';
import CallPanel from '../components/CallPanel';
import CallTopBar from '../components/CallTopBar';
import ChatAccessNotice from '../components/ChatAccessNotice/ChatAccessNotice';
import ConferenceIframe from '../components/ConferenceIframe';
import { ChatPanelContext } from '../context/ChatPanelContext';
import { useConference } from '../context/ConferenceContext';
import { useRinging } from '../hooks/useRinging';
import { PREFLIGHT_FACES_SHOWN } from '../lib/constants';

type ConferencePanel = 'members' | 'chat';

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

/**
 * The conference window: the call, the bar above it, and the panels beside it.
 *
 * It reads the call from context and does nothing to it directly, which is what lets the whole window be drawn
 * from a fixture — and what keeps the one part it cannot build, the call's chat, a node it is handed.
 */
const ConferenceWindow = () => {
	const { room, session, call, actions, slots, thread, viewer } = useConference();
	const { t } = useTranslation();

	const [activePanel, setActivePanel] = useState<ConferencePanel | undefined>();
	const chatVisible = activePanel === 'chat';

	const togglePanel = useCallback(
		(panel: ConferencePanel) => {
			// A thread belongs to the chat it was opened from, and that panel is where it is shown — so any click
			// that leaves the chat closed takes the thread with it, rather than leaving one waiting to reappear.
			// Asked as "does the chat survive this click", not "was this click about the chat": switching straight
			// to the members panel closes the chat just as surely as clicking the chat button again does.
			const chatStaysOpen = panel === 'chat' && activePanel !== 'chat';

			setActivePanel((current) => (current === panel ? undefined : panel));

			if (!chatStaysOpen) {
				thread.close();
			}
		},
		[activePanel, thread],
	);

	// Stable, because it is the value of a context the chat panel's contents read: rebuilt each render, it would
	// re-render the product's whole room every time anything in this window moved.
	const closeChat = useMemo(() => ({ close: () => togglePanel('chat') }), [togglePanel]);

	const breakpoints = useBreakpoints();
	const tooShortToSplit = useMediaQuery('(max-height: 520px)');

	// Too small to split, in either direction: below `md` there is no width for a panel beside the call, and a
	// phone in landscape has the width but not the height — docking there left the call a third of a short screen
	// and the chat a message list two lines tall above its own composer. Both get the sheet instead.
	//
	// Width alone was the first answer and the wrong one: a phone in landscape is 852pt wide, which is `md`.
	const sheetPanel = !breakpoints.includes('md') || tooShortToSplit;

	const { count: unreadCount, hasUnseenActivity, variant: unreadVariant, title: unreadTitle = '' } = room.unread;
	// Nothing is unread about a chat the reader is looking at, so the open panel is its own answer — and the dot
	// is for activity with no count behind it, which is why a count takes its place rather than joining it.
	const unread = chatVisible ? 0 : unreadCount;
	const unseenActivity = !chatVisible && !unread && hasUnseenActivity;

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

		return unseenActivity ? null : undefined;
	})();

	const { callSounds } = useCustomSound();
	const otherMembers = call.canRing && session.joined ? call.members.filter((m) => m._id !== viewer.uid && !isInVideoConference(m)) : [];
	// Only the ones actually ringing — a member who declined stopped ringing when they declined — and kept true
	// as each ring lapses, which is what stops the dialler sounding for a call nobody is being asked about.
	const ringingMembers = useRinging(otherMembers);
	const someoneRinging = ringingMembers.length > 0;
	useEffect(() => {
		if (someoneRinging) {
			callSounds.playDialer();
		} else {
			callSounds.stopDialer();
		}
		return () => callSounds.stopDialer();
	}, [someoneRinging, callSounds]);

	const [bannerDismissed, setBannerDismissed] = useState(false);

	// A refusal is an answer about this call — it is gone, or was never this reader's — and the screens below say
	// so, finally. Anything else is the server not having been reached, which says nothing about the call: telling
	// someone their call does not exist because a request dropped sends them away from one that is still running.
	if (room.error) {
		return room.error.kind === 'refused' ? (
			<>{slots.unauthorized}</>
		) : (
			<ConferenceStatePage
				icon='warning'
				title={t('Something_went_wrong')}
				action={{ label: t('Retry'), onClick: () => void room.retry() }}
			/>
		);
	}

	if (session.error) {
		return session.error.kind === 'refused' ? (
			<>{slots.joinRefused}</>
		) : (
			// Back to the preflight rather than straight into another attempt: the devices they chose are still
			// there, and a join that failed is a thing to decide about rather than to repeat behind their back.
			<ConferenceStatePage icon='warning' title={t('Something_went_wrong')} action={{ label: t('Retry'), onClick: session.retry }} />
		);
	}

	if (session.loading) {
		return <>{slots.loading}</>;
	}

	if (call.ended && !session.joined) {
		return <ConferenceStatePage icon='phone-off' title={t('Call_ended')} action={{ label: t('Close'), onClick: actions.leave }} />;
	}

	if (!session.joined) {
		if (room.loading) {
			return <>{slots.loading}</>;
		}

		return (
			// No `confirming`: joining takes this screen down with it — `session.loading` is that very request, and
			// it returns the loading slot above — so there is no button left to report it on.
			<ConferencePreflight
				name={call.name}
				action={call.placing ? 'start' : 'join'}
				isDirect={call.canRing}
				canName={call.canRename}
				participants={{ people: present.slice(0, PREFLIGHT_FACES_SHOWN), total: presentCount, displayAvatars: viewer.displayAvatars }}
				capabilities={call.capabilities}
				onConfirm={(preferences, name, ring) => actions.join(preferences, name, ring)}
				onCancel={actions.leave}
			/>
		);
	}

	// An embedded provider joins with no URL — it renders inside Rocket.Chat rather than at an address of its own —
	// so having none is its documented answer, not a failed join. Everything else the window offers works either
	// way; only the frame below has nothing to show.
	if (!session.url && !session.embedded) {
		return (
			<ConferenceStatePage icon='warning' title={t('error-videoconf-unexpected')} action={{ label: t('Close'), onClick: actions.leave }} />
		);
	}

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0} style={{ backgroundColor: 'black' }}>
			{room.chatAccess && !bannerDismissed && <ChatAccessNotice access={room.chatAccess} onDismiss={() => setBannerDismissed(true)} />}

			<CallTopBar startAt={call.createdAt} name={call.name}>
				<IconButton
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
					badge={presentCount > 0 ? <Badge>{presentCount}</Badge> : undefined}
				/>
				<IconButton
					small
					secondary
					aria-label={withBadgeCount(t('Chat'), unread, unreadTitle, unseenActivity)}
					title={t('Chat')}
					aria-pressed={chatVisible}
					onClick={() => togglePanel('chat')}
					icon={<Icon name='balloon' size='x20' color={chatVisible ? 'info' : undefined} />}
					// `chatBadge` is `null` for activity with no count behind it, which is the dot — a `Badge` with
					// nothing in it. Only `undefined` means no badge at all, so the test is against that rather than
					// for truth.
					badge={
						chatBadge !== undefined ? (
							<Badge variant={unreadVariant} title={unreadTitle}>
								{chatBadge}
							</Badge>
						) : undefined
					}
				/>
			</CallTopBar>

			<Box display='flex' flexGrow={1} minHeight={0} position='relative'>
				<Box flexGrow={1} minWidth={0} display='flex' flexDirection='column' position='relative'>
					{session.url && <ConferenceIframe url={session.url} />}
				</Box>

				<CallPanel visible={!!activePanel} sheet={sheetPanel}>
					{activePanel === 'members' && <CallMembersPanel onClose={() => togglePanel('members')} />}
					{/* The call's chat is the product's room — its provider, its message list, its composer — so it
					    arrives built. What this window owns is the panel it sits in, which is why closing it is
					    handed down rather than handed in. */}
					{activePanel === 'chat' && <ChatPanelContext.Provider value={closeChat}>{slots.chat}</ChatPanelContext.Provider>}
				</CallPanel>
			</Box>
		</Box>
	);
};

export default ConferenceWindow;
