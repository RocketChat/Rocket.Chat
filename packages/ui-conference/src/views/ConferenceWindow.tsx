import { isInVideoConference } from '@rocket.chat/core-typings';
import { Badge, Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useBreakpoints, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useCustomSound } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConferencePreflight from './ConferencePreflight';
import ConferenceStatePage from './ConferenceStatePage';
import CallBar from '../components/CallBar';
import CallMembersPanel from '../components/CallMembersPanel/CallMembersPanel';
import CallPanel from '../components/CallPanel';
import CallPresenting from '../components/CallPresenting';
import CallRaisedHands from '../components/CallRaisedHands';
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
	const { room, session, call, actions, slots, thread, viewer, panel, media } = useConference();
	const { t } = useTranslation();

	// Which panel is open is the window's own until the application asks for it — see `panel` on the context.
	const [ownPanel, setOwnPanel] = useState<ConferencePanel | undefined>();
	const activePanel = panel ? panel.active : ownPanel;
	const setActivePanel = panel?.set ?? setOwnPanel;
	const chatVisible = activePanel === 'chat';

	const togglePanel = useCallback(
		(target: ConferencePanel) => setActivePanel(activePanel === target ? undefined : target),
		[activePanel, setActivePanel],
	);

	// A thread is shown inside the chat panel, so it goes when the chat does. Keyed on the panel rather than on
	// the click because the provider's own chat button reaches `panel.set` directly, and a thread left behind by
	// that route came back the next time the chat was opened.
	useEffect(() => {
		if (!chatVisible) {
			thread.close();
		}
	}, [chatVisible, thread]);

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

	// Where a call running in here puts its header and its controls — this window's own bars. Created up front
	// rather than captured from refs, so they exist on the very first render: an empty ref then would have the
	// call build a strip of its own before being told not to.
	const hosts = useMemo(() => {
		const header = document.createElement('div');
		header.style.cssText = 'display:flex;flex:1;min-width:0;align-items:center;justify-content:space-between';
		return { header, controls: document.createElement('div') };
	}, []);
	const mountHeader = useCallback(
		(node: HTMLElement | null) => {
			node?.appendChild(hosts.header);
		},
		[hosts],
	);
	const mountControls = useCallback(
		(node: HTMLElement | null) => {
			node?.appendChild(hosts.controls);
		},
		[hosts],
	);

	// The call reports hands by member id; the membership is what names them.
	const hands = useMemo(
		() =>
			(media?.raisedHands ?? []).map((id) => {
				const member = call.members.find(({ _id }) => _id === id);
				return { id, name: member?.name || member?.username || t('User') };
			}),
		[media?.raisedHands, call.members, t],
	);

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
				media={slots.preflightMedia}
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

	// A call that runs in here brings its own header and controls, so the window's bars carry those instead.
	const renderCall = !session.url && session.embedded ? slots.renderCall : undefined;

	const panelToggles = (
		<>
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
		</>
	);

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0} style={{ backgroundColor: 'black' }}>
			{room.chatAccess && !bannerDismissed && <ChatAccessNotice access={room.chatAccess} onDismiss={() => setBannerDismissed(true)} />}

			{renderCall ? (
				<CallTopBar host={<Box ref={mountHeader} display='flex' flexGrow={1} minWidth={0} alignItems='center' />}>
					{/* Before the toggles, so the queue grows into the bar's own space rather than pushing them. */}
					<CallPresenting presenters={media?.presenters ?? []} onStopPresenting={media?.stopPresenting} />
					<CallRaisedHands hands={hands} />
					{panelToggles}
				</CallTopBar>
			) : (
				<CallTopBar startAt={call.createdAt} name={call.name}>
					{panelToggles}
				</CallTopBar>
			)}

			<Box display='flex' flexGrow={1} minHeight={0} position='relative'>
				<Box flexGrow={1} minWidth={0} display='flex' flexDirection='column' position='relative'>
					{session.url ? <ConferenceIframe url={session.url} /> : renderCall?.(hosts)}
				</Box>

				<CallPanel visible={!!activePanel} sheet={sheetPanel}>
					{activePanel === 'members' && <CallMembersPanel onClose={() => togglePanel('members')} />}
					{/* The call's chat is the product's room — its provider, its message list, its composer — so it
					    arrives built. What this window owns is the panel it sits in, which is why closing it is
					    handed down rather than handed in. */}
					{activePanel === 'chat' && <ChatPanelContext.Provider value={closeChat}>{slots.chat}</ChatPanelContext.Provider>}
					{activePanel === 'diagnostics' && slots.diagnostics}
				</CallPanel>
			</Box>

			{/* Only a call running in here has controls of ours to hold; an iframe keeps its own inside the frame. */}
			{renderCall && <CallBar centre={<Box ref={mountControls} display='flex' alignItems='center' />} />}
		</Box>
	);
};

export default ConferenceWindow;
