import { isInVideoConference, isRingingVideoConferenceMember } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Badge, Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useCustomSound, useUser, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceChat from './ConferenceChat';
import ConferencePageError from './ConferencePageError';
import ConferencePreflight from './ConferencePreflight';
import ConferenceStatePage from './ConferenceStatePage';
import ConferenceThreadModal from './ConferenceThreadModal';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import PageLoading from '../root/PageLoading';
import CallTopBar from './components/CallBar/CallTopBar';
import CallMembersPanel from './components/CallMembersPanel/CallMembersPanel';
import CallPanel from './components/CallPanel/CallPanel';
import CallTimer from './components/CallTimer/CallTimer';
import ChatAccessNotice from './components/ChatAccessNotice/ChatAccessNotice';
import ConferenceIframe from './components/ConferenceIframe/ConferenceIframe';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import { useConferencePresenceLease } from './hooks/useConferencePresenceLease';
import { useConferenceSubscription } from './hooks/useConferenceSubscription';
import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import { useLeaveConferenceOnClose } from './hooks/useLeaveConferenceOnClose';
import { PREFLIGHT_FACES_SHOWN } from '../../../lib/videoConference/constants';
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
const withBadgeCount = (label: string, unread: number, unreadTitle: string): string =>
	unread > 0 && unreadTitle ? `${label}, ${unreadTitle}` : label;

const ConferenceEmbeddedPage = ({ callId }: ConferenceEmbeddedPageProps) => {
	const { room, conference, call } = useConferenceEmbedded(callId);
	const { t } = useTranslation();
	const [threadTmid, setThreadTmid] = useState<string | null>(null);

	const handleOpenThread = useCallback(
		(tmid: string) => {
			if (!room.rid) {
				return;
			}
			setThreadTmid(tmid);
		},
		[room.rid],
	);

	useConfinedNavigation({ onOpenThread: room.tmid ? undefined : handleOpenThread });

	const { leaveNow } = useLeaveConferenceOnClose(callId);

	useConferencePresenceLease(callId, conference.joined);

	const user = useUser();

	const [bannerDismissed, setBannerDismissed] = useState(false);

	const [activePanel, setActivePanel] = useState<ConferencePanel | undefined>();
	const togglePanel = useCallback((panel: ConferencePanel) => setActivePanel((current) => (current === panel ? undefined : panel)), []);
	const chatVisible = activePanel === 'chat';

	const breakpoints = useBreakpoints();
	const overlayPanel = !breakpoints.includes('md');

	useConferenceSubscription(room.rid);

	const subscription = useUserSubscription(room.rid ?? '');
	const { showUnread, unreadCount, unreadVariant, unreadTitle } = useUnreadDisplay(subscription ?? emptyUnreadData);
	const unread = !chatVisible && showUnread ? unreadCount.total : 0;
	const hasUnseenActivity = !chatVisible && !unread && Boolean(subscription?.alert);

	const present = useMemo(() => call.members.filter(isInVideoConference), [call.members]);
	const presentCount = present.length;

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

	const membersAction = (
		<IconButton
			small
			secondary
			position='relative'
			overflow='visible'
			aria-label={t('__count__people_in_the_call', { count: presentCount })}
			title={t('People')}
			aria-pressed={activePanel === 'members'}
			onClick={() => togglePanel('members')}
			icon={<Icon name='members' size='x20' color={activePanel === 'members' ? 'info' : undefined} />}
		>
			{presentCount > 0 && (
				<Box position='absolute' insetBlockStart={-6} insetInlineEnd={-6} pointerEvents='none' aria-hidden='true'>
					<Badge>{presentCount}</Badge>
				</Box>
			)}
		</IconButton>
	);

	const chatAction = (
		<IconButton
			small
			secondary
			position='relative'
			overflow='visible'
			aria-label={withBadgeCount(t('Chat'), unread, unreadTitle)}
			title={t('Chat')}
			aria-pressed={chatVisible}
			onClick={() => togglePanel('chat')}
			icon={<Icon name='balloon' size='x20' color={chatVisible ? 'info' : undefined} />}
		>
			{unread > 0 && (
				<Box position='absolute' insetBlockStart={-6} insetInlineEnd={-6} pointerEvents='none' aria-hidden='true'>
					<Badge variant={unreadVariant} title={unreadTitle}>
						{unread}
					</Badge>
				</Box>
			)}
			{unread === 0 && hasUnseenActivity && (
				<Box position='absolute' insetBlockStart={-6} insetInlineEnd={-6} pointerEvents='none' aria-hidden='true'>
					<Badge variant={unreadVariant} title={unreadTitle} />
				</Box>
			)}
		</IconButton>
		// <Box
		// 	is='button'
		// 	className={topBarActionStyles}
		// 	aria-label={withBadgeCount(t('Chat'), unread, unreadTitle)}
		// 	title={t('Chat')}
		// 	aria-pressed={chatVisible}
		// 	onClick={() => togglePanel('chat')}
		// >
		// 	<Icon name='balloon' size='x20' />
		// 	{unread > 0 && (
		// 		<Box position='absolute' insetBlockStart={-4} insetInlineEnd={-4} pointerEvents='none' aria-hidden='true'>
		// 			<Badge variant={unreadVariant} title={unreadTitle}>
		// 				{unread}
		// 			</Badge>
		// 		</Box>
		// 	)}
		// 	{unread === 0 && hasUnseenActivity && (
		// 		<Box position='absolute' insetBlockStart={-2} insetInlineEnd={-2} pointerEvents='none' aria-hidden='true'>
		// 			<Badge variant={unreadVariant} title={unreadTitle} />
		// 		</Box>
		// 	)}
		// </Box>
	);

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
						{call.name && (
							<>
								<Box is='span' color='default' opacity={0.5} marginInline={8}>
									|
								</Box>
								<Box is='span' withTruncatedText>
									{call.name}
								</Box>
							</>
						)}
					</Box>
				}
			>
				{membersAction}
				{chatAction}
			</CallTopBar>

			<Box display='flex' flexGrow={1} minHeight={0} position='relative'>
				<Box flexGrow={1} minWidth={0} display='flex' flexDirection='column' position='relative'>
					<ConferenceIframe url={conference.url} />
				</Box>

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
						<ConferenceChat
							callId={callId}
							rid={room.rid}
							tmid={room.tmid}
							roomName={room.name}
							roomType={room.type}
							loading={room.loading}
							chatAccess={room.chatAccess}
							onClose={() => togglePanel('chat')}
						/>
					)}
				</CallPanel>
			</Box>

			{threadTmid && room.rid && <ConferenceThreadModal rid={room.rid} tmid={threadTmid} onClose={() => setThreadTmid(null)} />}
		</Box>
	);
};

export default ConferenceEmbeddedPage;
