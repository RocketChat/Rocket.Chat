import { Box } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConferenceChat from './ConferenceChat';
import ConferenceDisconnectedModal from './ConferenceDisconnectedModal';
import ConferenceIframe from './ConferenceIframe';
import ConferencePageError from './ConferencePageError';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import { SideRail, SideRailActions, SideRailAction, SideRailPanel } from './components';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import { useConfinedNavigation } from './hooks/useConfinedNavigation';
import { usePexipPlugin } from './hooks/usePexipPlugin';
import PageLoading from '../root/PageLoading';

type ConferenceEmbeddedPageProps = {
	callId: string;
};

const ConferenceEmbeddedPage = ({ callId }: ConferenceEmbeddedPageProps) => {
	const { room, conference } = useConferenceEmbedded(callId);
	const { t } = useTranslation();
	const setModal = useSetModal();

	// Keep this window pinned to the conference — links/navigations go to a new tab or the opener.
	useConfinedNavigation();

	// When the user is disconnected from the call, offer a 10s countdown to keep the window open,
	// otherwise close the conference window/tab.
	const handleDisconnected = useCallback(() => {
		const closeWindow = () => {
			setModal(null);
			// On desktop the conference is a main-process Electron window that the renderer's
			// `window.close()` can't close, so prefer the desktop bridge when available.
			if (window.videoCallWindow?.close) {
				window.videoCallWindow.close();
				return;
			}
			window.close();
		};

		setModal(<ConferenceDisconnectedModal onCancel={() => setModal(null)} onClose={closeWindow} />);
	}, [setModal]);

	const subscription = useUserSubscription(room.rid ?? '');
	const hasUnread = Boolean(subscription && subscription.unread > 0);

	const breakpoints = useBreakpoints();
	const overlayPanel = !breakpoints.includes('md');

	const [activePanel, setActivePanel] = useState<string | null>('chat');

	const togglePanel = useCallback((panel: string) => {
		setActivePanel((prev) => (prev === panel ? null : panel));
	}, []);

	const {
		closeChat,
		dialOut,
		connected: pluginConnected,
	} = usePexipPlugin({
		conferenceUrl: conference.url,
		hasUnread,
		chatVisible: activePanel === 'chat',
		onToggleChat: (active) => {
			setActivePanel(active ? 'chat' : null);
		},
		onDisconnected: handleDisconnected,
	});

	// No access to the conference's room — show the unauthorized screen for the whole page rather
	// than a broken split with a "not found" chat panel.
	if (room.error) {
		return <ConferenceUnauthorizedPage />;
	}

	if (conference.loading) {
		return <PageLoading />;
	}

	if (conference.error || !conference.url) {
		return <ConferencePageError />;
	}

	return (
		<Box bg='surface-light' width='full' height='full' display='flex'>
			<SideRail>
				{/* The Pexip plugin renders its own chat toggle in the in-meeting toolbar; once the user is
				connected (`connected`), drop this rail's button to avoid a duplicate control. It stays as a
				fallback during preflight, after disconnect, and when the plugin isn't installed. */}
				{!pluginConnected && (
					<SideRailActions>
						<SideRailAction icon='message' label={t('Chat')} pressed={activePanel === 'chat'} onClick={() => togglePanel('chat')} />
					</SideRailActions>
				)}

				<SideRailPanel visible={activePanel === 'chat'} overlay={overlayPanel}>
					<ConferenceChat callId={callId} rid={room.rid} loading={room.loading} onClose={closeChat} onDialOut={dialOut} />
				</SideRailPanel>
			</SideRail>

			<Box flexGrow={1} display='flex' flexDirection='column' position='relative'>
				<ConferenceIframe url={conference.url} loading={conference.loading} />
			</Box>
		</Box>
	);
};

export default ConferenceEmbeddedPage;
