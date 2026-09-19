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
import type { ConferencePanel } from '../context/ConferenceContext';
import { useConference } from '../context/ConferenceContext';
import { useRinging } from '../hooks/useRinging';
import { PREFLIGHT_FACES_SHOWN } from '../lib/constants';

/**
 * Folds a badge into its button's name. The badges are `aria-hidden` and `aria-label` overrides a button's
 * contents, so whatever a badge says has to reach the name — the dot included, which carries no count.
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
	const { room, session, call, actions, slots, thread, viewer, panel } = useConference();
	const { t } = useTranslation();

	// Which panel is open is the window's own until the application asks for it — see `panel` on the context.
	const [ownPanel, setOwnPanel] = useState<ConferencePanel | undefined>();
	const activePanel = panel ? panel.active : ownPanel;
	const setActivePanel = panel?.set ?? setOwnPanel;
	const chatVisible = activePanel === 'chat';

	const togglePanel = useCallback(
		(target: ConferencePanel) => {
			// A thread is shown in the chat panel, so any click that leaves the chat closed takes the thread with
			// it — including switching straight to the members panel.
			const chatStaysOpen = target === 'chat' && activePanel !== 'chat';

			setActivePanel(activePanel === target ? undefined : target);

			if (!chatStaysOpen) {
				thread.close();
			}
		},
		[activePanel, setActivePanel, thread],
	);

	// Stable: it is a context value the chat panel reads, and rebuilding it re-renders the product's whole room.
	const closeChat = useMemo(() => ({ close: () => togglePanel('chat') }), [togglePanel]);

	const breakpoints = useBreakpoints();
	const tooShortToSplit = useMediaQuery('(max-height: 520px)');

	// Too small to split in either direction. Height as well as width, because a phone in landscape is 852pt
	// wide — past `md` — and far too short to dock a panel beside the call.
	const sheetPanel = !breakpoints.includes('md') || tooShortToSplit;

	const { count: unreadCount, hasUnseenActivity, variant: unreadVariant, title: unreadTitle = '' } = room.unread;
	// Nothing is unread about a chat the reader is looking at.
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
	// Kept true as each ring lapses, which is what stops the dialler sounding for a call nobody is being asked about.
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

	// Only a refusal is an answer about the call. Anything else is the server not having been reached, which says
	// nothing about it — and sending someone away from a call that is still running is the worse mistake.
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
			// Back to the preflight rather than straight into another attempt, with the devices they chose intact.
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
