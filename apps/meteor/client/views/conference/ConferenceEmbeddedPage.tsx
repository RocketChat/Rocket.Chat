import { isInVideoConference } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Badge, Box, Icon } from '@rocket.chat/fuselage';
import { useBreakpoints, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useCustomSound, useSetModal, useUser, useUserAvatarPath, useUserSubscription } from '@rocket.chat/ui-contexts';
import { MediaCallRoomSection, useMediaCallView } from '@rocket.chat/ui-voip';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceChat from './ConferenceChat';
import ConferencePageError from './ConferencePageError';
import ConferencePreflight from './ConferencePreflight';
import ConferenceStatePage from './ConferenceStatePage';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import CallDiagnosticsPanel from './components/CallDiagnosticsPanel';
import CallPanel from './components/CallPanel';
import CallPresenting from './components/CallPresenting';
import { PREFLIGHT_FACES_SHOWN } from '../../../lib/videoConference/constants';
import PageLoading from '../root/PageLoading';
import CallBar from './components/CallBar/CallBar';
import CallMembersPanel from './components/CallMembersPanel/CallMembersPanel';
import type { Presenter } from './components/CallPresenting';
import CallRaisedHands from './components/CallRaisedHands';
import CallTimer from './components/CallTimer/CallTimer';
import CallTopBar from './components/CallTopBar';
import ChatAccessNotice from './components/ChatAccessNotice/ChatAccessNotice';
import ConferenceIframe from './components/ConferenceIframe';
import { useCallPreferences } from './hooks/useCallPreferences';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import { useConferencePresenceLease } from './hooks/useConferencePresenceLease';
import { useConferenceSubscription } from './hooks/useConferenceSubscription';
import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import { useEmbeddedConferenceCall } from './hooks/useEmbeddedConferenceCall';
import { useLeaveConferenceOnClose } from './hooks/useLeaveConferenceOnClose';
import { useRinging } from '../../hooks/useRinging';
import { isRefusal } from '../../lib/utils/isRefusal';
import { useUnreadDisplay } from '../../sidebar/hooks/useUnreadDisplay';
import { useCallDiagnosticsContext } from '../videoConference/livekit/CallDiagnosticsContext';

type ConferenceEmbeddedPageProps = {
	callId: string;
};

/** The things that can share the space beside the call. One at a time — two would leave the call a sliver. */
type ConferencePanel = 'members' | 'chat' | 'diagnostics';

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
const emptyUnreadData = { alert: false, userMentions: 0, unread: 0, groupMentions: 0 } as const;

const membersIndicatorStyles = css`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 8px 4px 4px;
	border: none;
	border-radius: 20px;
	background: transparent;
	color: rgba(255, 255, 255, 0.85);
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 80ms ease;
	line-height: 1;

	&:hover {
		background-color: rgba(255, 255, 255, 0.12);
	}

	&[aria-pressed='true'] {
		background-color: rgba(255, 255, 255, 0.2);
	}
`;

const memberAvatarStyles = css`
	width: 24px;
	height: 24px;
	border-radius: 50%;
	border: 2px solid rgba(30, 30, 35, 1);
	object-fit: cover;
	flex-shrink: 0;
`;

const topBarActionStyles = css`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 8px;
	background: transparent;
	color: rgba(255, 255, 255, 0.85);
	cursor: pointer;
	transition: background-color 80ms ease;

	&:hover {
		background-color: rgba(255, 255, 255, 0.12);
	}

	&[aria-pressed='true'] {
		background-color: rgba(255, 255, 255, 0.2);
	}
`;

/**
 * Renders a conference as the call plus a bottom control bar, with the conference's persistent chat in a
 * panel that opens beside the call — above the bar, so toggling it never reflows the controls.
 */
const ConferenceEmbeddedPage = ({ callId }: ConferenceEmbeddedPageProps) => {
	const { room, conference, call } = useConferenceEmbedded(callId);
	const { t } = useTranslation();

	// Which thread is open, rather than the thread itself: it is shown through the chat panel's own modal region,
	// inside the room's provider, so that it can read the room from context instead of opening it a second time.
	// Here it is only an answer to "which one", which the panel turns into a modal.
	const [openThread, setOpenThread] = useState<string>();
	const closeThread = useCallback(() => setOpenThread(undefined), []);

	useConfinedNavigation({ onOpenThread: room.tmid ? undefined : setOpenThread });

	// Closing this window is the only end-of-call signal a provider that doesn't report one leaves us, and the
	// call has to end for its history to be written — as whatever this user's departure actually is.
	const { leaveNow } = useLeaveConferenceOnClose(callId, conference.departure);

	// What covers the times that signal can't get through — the workspace being down while the call carries on in
	// the provider, or this window dying without a word. Leaving is inferred from these renewals stopping.
	useConferencePresenceLease(callId, conference.joined);

	// How the user chose to arrive. Read from where the preflight put it rather than from this window's own
	// join, because starting a call joins on the *start* screen — this window then finds the result in the
	// cache, having never asked, and would otherwise hand the provider nothing and get its defaults.
	const { preferences, devices } = useCallPreferences(call.capabilities);

	// A provider that runs the call in here is connected by a tree above this route, so joining has to tell it
	// which call this window is showing.
	useEmbeddedConferenceCall({
		callId,
		rid: room.rid,
		embedded: conference.embedded,
		preferences,
		devices,
		// Hanging up ends what this window is for, so it reports leaving and closes — the same thing Cancel on
		// the preflight does, and what closing the window would have done anyway.
		onEnded: leaveNow,
	});

	// How the embedded call should name and picture the viewer — it has no room membership to read that from.
	const user = useUser();
	const getUserAvatarPath = useUserAvatarPath();
	const selfDisplayName = useUserDisplayName({ name: user?.name, username: user?.username });
	const self = useMemo(
		() => ({
			id: user?._id || 'local',
			displayName: selfDisplayName || '',
			avatarUrl: getUserAvatarPath({ userId: user?._id || '' }),
		}),
		[user?._id, selfDisplayName, getUserAvatarPath],
	);

	// Who is waiting to speak, in the order they asked. The transport reports the queue by user id — that is what
	// a participant is to it — so the call's own membership is what turns those into names. Anyone the membership
	// cannot name is still counted and still holds their place; they are just described by what is known.
	const { raisedHands, remoteParticipants, streams, sessionState, onMuteParticipant, onToggleScreenSharing } = useMediaCallView();
	const diagnostics = useCallDiagnosticsContext();
	const handQueue = useMemo(
		() =>
			(raisedHands ?? []).map(({ id }) => {
				const member = call.members.find(({ _id }) => _id === id);
				return { id, name: member?.name || member?.username || t('User') };
			}),
		[raisedHands, call.members, t],
	);
	const raisedHandIds = useMemo(() => new Set(handQueue.map(({ id }) => id)), [handQueue]);

	// Whose microphone is already off, so nobody is asked for silence they are already keeping. The call is what
	// knows this — a member entry records who is in the call, not what their microphone is doing. The reader's own
	// mic comes from the session, since they are not one of the *remote* participants.
	const mutedMembers = useMemo(() => {
		const ids = new Set((remoteParticipants ?? []).filter(({ muted }) => muted).map(({ id }) => id));
		if (sessionState?.muted && user?._id) {
			ids.add(user._id);
		}
		return ids;
	}, [remoteParticipants, sessionState?.muted, user?._id]);

	// The same list, as microphones, so a row can show one moving. Again the reader's own comes from the session.
	const audioStreams = useMemo(() => {
		const streamsById = new Map((remoteParticipants ?? []).map(({ id, audioStream }) => [id, audioStream]));
		if (user?._id) {
			streamsById.set(user._id, streams?.localMicrophone?.stream);
		}
		return streamsById;
	}, [remoteParticipants, streams?.localMicrophone, user?._id]);

	const presenters = useMemo((): Presenter[] => {
		const list: Presenter[] = [];
		if (streams?.localScreen?.active) {
			list.push({ name: selfDisplayName || '', avatarUrl: self.avatarUrl, isLocal: true });
		}
		for (const p of remoteParticipants ?? []) {
			if (p.screenStream) {
				list.push({ name: p.displayName, avatarUrl: p.avatarUrl });
			}
		}
		return list;
	}, [streams?.localScreen?.active, remoteParticipants, selfDisplayName, self.avatarUrl]);

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

	// On narrow viewports the panel floats over the call instead of squeezing it.
	const breakpoints = useBreakpoints();
	const tooShortToSplit = useMediaQuery('(max-height: 520px)');

	// Too small to split, in either direction: below `md` there is no width for a panel beside the call, and a
	// phone in landscape has the width but not the height — docking there left the call a third of a short screen
	// and the chat a message list two lines tall above its own composer. Both get the sheet instead.
	//
	// Width alone was the first answer and the wrong one: a phone in landscape is 852pt wide, which is `md`.
	const sheetPanel = !breakpoints.includes('md') || tooShortToSplit;

	// Owned by the page rather than the chat panel: the badge below needs it while that panel is closed, and the
	// panel isn't mounted then.
	useConferenceSubscription(room.rid);

	// The same rules the sidebar's room item uses, so a mention reads as urgent in both places and a room the
	// user muted stays quiet in both. Nothing to show while the chat is the panel they are looking at.
	const subscription = useUserSubscription(room.rid ?? '');
	const { showUnread, unreadCount, unreadVariant, unreadTitle } = useUnreadDisplay(subscription ?? emptyUnreadData);
	const unread = !chatVisible && showUnread ? unreadCount.total : 0;
	// In channels and groups `unread` only counts mentions — an ordinary message just sets `alert` — so the dot is
	// how the chat button says there is something new while the panel is shut.
	//
	// `hideUnreadStatus` is the reader saying they do not want to be told about this room, and the sidebar honours
	// it for exactly this kind of mark, so the dot honours it too.
	const hasUnseenActivity = !chatVisible && !unread && Boolean(subscription?.alert) && !subscription?.hideUnreadStatus;

	// Who is actually in the call — the faces worth glancing at, and how many there are altogether.
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

	// A DM caller should hear a ringback tone while the other side's phone is still ringing.
	const { callSounds } = useCustomSound();
	const otherMembers = call.canRing && conference.joined ? call.members.filter((m) => m._id !== user?._id && !isInVideoConference(m)) : [];
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

	// Where the call puts its own controls — see `actionsContainer`. Created up front rather than captured from
	// a ref, so it is non-null on the very first render: a ref would still be empty then, and the call would
	// build a whole strip of its own before being told not to.
	const controlsHost = useMemo(() => document.createElement('div'), []);
	const mountControlsHost = useCallback(
		(node: HTMLElement | null) => {
			node?.appendChild(controlsHost);
		},
		[controlsHost],
	);

	// The same arrangement for the call's header, which goes in this window's top bar.
	const headerHost = useMemo(() => {
		const node = document.createElement('div');
		// Ends apart, filling the bar: the call's header is a timer on one side and its own actions on the other.
		node.style.cssText = 'display:flex;flex:1;min-width:0;align-items:center;justify-content:space-between';
		return node;
	}, []);
	const mountHeaderHost = useCallback(
		(node: HTMLElement | null) => {
			node?.appendChild(headerHost);
		},
		[headerHost],
	);

	const participantAvatars = useMemo(() => {
		const all = [
			{ id: self.id, avatarUrl: self.avatarUrl },
			...(remoteParticipants ?? []).map(({ id, avatarUrl }) => ({ id, avatarUrl: avatarUrl || '' })),
		].filter((p) => p.avatarUrl);
		return all.slice(0, 4);
	}, [self.id, self.avatarUrl, remoteParticipants]);

	const membersAction = (
		<Box
			is='button'
			className={membersIndicatorStyles}
			// The same words in the label and the tooltip, because they disagreed: the tooltip said "People" while
			// the accessible name said how many, so anything looking for the button by the name it appeared to
			// have never found it.
			aria-label={t('__count__people_in_the_call', { count: presentCount })}
			title={t('__count__people_in_the_call', { count: presentCount })}
			aria-pressed={activePanel === 'members'}
			onClick={() => togglePanel('members')}
		>
			<Box display='flex' alignItems='center'>
				{participantAvatars.map((p, i) => (
					<Box
						key={p.id}
						is='img'
						src={p.avatarUrl}
						alt=''
						className={memberAvatarStyles}
						style={{ zIndex: participantAvatars.length - i, marginInlineStart: i > 0 ? -6 : 0 }}
					/>
				))}
			</Box>
			<span>{presentCount}</span>
		</Box>
	);

	const chatAction = (
		<Box
			is='button'
			className={topBarActionStyles}
			// The count reaches the button's own name: the badge is `aria-hidden`, so a reader who cannot see it
			// would otherwise be told nothing about it.
			aria-label={withBadgeCount(t('Chat'), unread, unreadTitle, hasUnseenActivity)}
			title={t('Chat')}
			aria-pressed={chatVisible}
			onClick={() => togglePanel('chat')}
		>
			<Icon name='balloon' size='x20' />
			{unread > 0 && (
				<Box position='absolute' insetBlockStart={-4} insetInlineEnd={-4}>
					<Badge variant={unreadVariant} title={unreadTitle}>
						{unread}
					</Badge>
				</Box>
			)}
			{unread === 0 && hasUnseenActivity && (
				<Box position='absolute' insetBlockStart={-2} insetInlineEnd={-2}>
					<Badge variant={unreadVariant} title={unreadTitle} />
				</Box>
			)}
		</Box>
	);

	const extraMenuItems: GenericMenuItemProps[] = [
		{ id: 'diagnostics', icon: 'info-circled', content: t('Connection_info'), onClick: () => togglePanel('diagnostics') },
	];

	// An iframe provider has no header of ours to put anything in, so both stay on the bar.
	const embedded = !conference.url;

	// No access to the conference's room — the unauthorized screen for the whole page rather than a broken split
	// with a "not found" chat panel. But only for a refusal, which is an answer about this call: it is gone, or
	// was never this reader's. Anything else is the server not having been reached, which says nothing about the
	// call — telling someone their call does not exist because a request dropped sends them away from one that is
	// still running.
	if (room.error) {
		return isRefusal(room.error) ? (
			<ConferenceUnauthorizedPage />
		) : (
			<ConferenceStatePage
				icon='warning'
				title={t('Something_went_wrong')}
				action={{ label: t('Retry'), onClick: () => void room.retry() }}
			/>
		);
	}

	if (conference.error) {
		return isRefusal(conference.error) ? (
			<ConferencePageError />
		) : (
			// Back to the preflight rather than straight into another attempt: the devices they chose are still
			// there, and a join that failed is a thing to decide about rather than to repeat behind their back.
			<ConferenceStatePage icon='warning' title={t('Something_went_wrong')} action={{ label: t('Retry'), onClick: conference.retry }} />
		);
	}

	if (conference.loading) {
		return <PageLoading />;
	}

	// The conference existed when the info query ran, but it may have ended since — or before the user opened
	// this window. Show a clear "call ended" page instead of a preflight that would fail on join.
	if (call.ended && !conference.joined) {
		return <ConferenceStatePage icon='phone-off' title={t('Call_ended')} action={{ label: t('Close'), onClick: leaveNow }} />;
	}

	// Not in the call yet: the user says how they want to arrive, and joining is what turns that into the
	// provider's URL. Waiting for the conference to load first means the name and the devices on offer are the
	// real ones.
	//
	// An embedded provider never produces a url — the join itself is what puts the user in the call — so for
	// those it is having joined, not having a url, that says the preflight is done.
	if (!conference.joined) {
		if (room.loading) {
			return <PageLoading />;
		}

		return (
			// No `confirming`: joining takes this screen down with it — `conference.loading` is that very mutation,
			// and it returns `PageLoading` above — so there is no button left to report it on.
			<ConferencePreflight
				name={call.name}
				// Placing a call means nobody has been asked to answer it yet — confirming is what starts it.
				action={call.placing ? 'start' : 'join'}
				isDirect={call.canRing}
				canName={call.canRename}
				// The same faces the sidebar showed on the way here, from this window's own copy of the members —
				// a screen has room for more of them than a row does.
				participants={{ people: present.slice(0, PREFLIGHT_FACES_SHOWN), total: presentCount }}
				capabilities={call.capabilities}
				onConfirm={(preferences, name) => conference.join({ state: preferences, name })}
				onCancel={leaveNow}
			/>
		);
	}

	// An embedded provider joins with no URL — it renders inside Rocket.Chat rather than at an address of its own —
	// so having none is its documented answer, not a failed join. Everything else the window offers works either
	// way; only the frame below has nothing to show.
	if (!conference.url && !conference.embedded) {
		return <ConferenceStatePage icon='warning' title={t('error-videoconf-unexpected')} action={{ label: t('Close'), onClick: leaveNow }} />;
	}

	return (
		<Box display='flex' flexDirection='column' flexGrow={1} minHeight={0} style={{ backgroundColor: 'black' }}>
			{/* Above the call and both panels: the situation is about the call, not about whichever panel happens
			    to be open, and a banner that moved as panels changed would read as a different message each time.
			    Dismissing hides the banner, but the chat header keeps a persistent button for the same action. */}
			{room.chatAccess && !bannerDismissed && (
				<ChatAccessNotice callId={callId} access={room.chatAccess} onDismiss={() => setBannerDismissed(true)} />
			)}

			{/* Only a provider that renders in here has a header to give; an iframe keeps its chrome inside the
			    frame. Above the row below, so it spans the side panels the way the bottom bar does. */}
			{/* A provider with a page of its own gives us no header, so the bar carries the one thing this window
			    knows about the call: how long it has been running, and what it is called. */}
			{!embedded && (
				<CallTopBar startAt={call.createdAt} name={call.name}>
					{membersAction}
					{chatAction}
				</CallTopBar>
			)}

			{embedded && (
				<CallTopBar host={<Box ref={mountHeaderHost} display='flex' flexGrow={1} minWidth={0} alignItems='center' />}>
					{/* Before the button rather than after it, so the queue reads as something about the people it
					    opens — and so it grows leftwards into the bar's own space instead of pushing the button. */}
					<CallPresenting presenters={presenters} onStopPresenting={onToggleScreenSharing} />
					<CallRaisedHands hands={handQueue} />
					{membersAction}
					{chatAction}
				</CallTopBar>
			)}

			<Box display='flex' flexGrow={1} minHeight={0} position='relative'>
				<Box flexGrow={1} minWidth={0} display='flex' flexDirection='column' position='relative'>
					{/* A provider with a page of its own gets an iframe; one that runs the call in here renders it
					    directly, reading the connection from the bridge above this route. That one brings its own
					    control strip -- mic, camera, screen, hang up -- so the panel toggles join it there rather
					    than sitting in a second bar beneath it. */}
					{conference.url ? (
						<ConferenceIframe url={conference.url} />
					) : (
						<MediaCallRoomSection
							showChat={chatVisible}
							onToggleChat={() => togglePanel('chat')}
							user={self}
							hideChatToggle
							actionsContainer={controlsHost}
							headerContainer={headerHost}
							callName={call.name}
							extraMenuItems={extraMenuItems}
						/>
					)}
				</Box>

				{/* One panel at a time: they share the same space, and two side panels would leave the call a
				    sliver. Which one is open is the single source of truth, so the bar can't disagree with it. */}
				<CallPanel visible={!!activePanel} sheet={sheetPanel}>
					{activePanel === 'members' && (
						<CallMembersPanel
							callId={callId}
							rid={room.rid}
							members={call.members}
							chatAccess={room.chatAccess}
							raisedHands={raisedHandIds}
							mutedMembers={mutedMembers}
							audioStreams={audioStreams}
							onMute={onMuteParticipant}
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
					{activePanel === 'diagnostics' && <CallDiagnosticsPanel diagnostics={diagnostics} onClose={() => togglePanel('diagnostics')} />}
				</CallPanel>
			</Box>

			{/* The bottom bar is where a provider running the call in here puts its own controls — mic, camera,
			    screen, hang up — so it exists only for those. An iframe provider keeps its controls inside the
			    frame, and a second, empty strip beneath the frame would say there is something down there to use.
			    The panel toggles are not repeated here: they are in the top bar for both kinds of provider. */}
			{embedded && <CallBar centre={<Box ref={mountControlsHost} display='flex' alignItems='center' />} />}
		</Box>
	);
};

export default ConferenceEmbeddedPage;
