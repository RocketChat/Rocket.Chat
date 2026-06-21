import { Box } from '@rocket.chat/fuselage';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import ConferenceChat from './ConferenceChat';
import ConferenceIframe from './ConferenceIframe';
import ConferencePageError from './ConferencePageError';
import ConferenceUnauthorizedPage from './ConferenceUnauthorizedPage';
import { useConferenceEmbedded } from './hooks/useConferenceEmbedded';
import { usePexipPlugin } from './hooks/usePexipPlugin';
import PageLoading from '../root/PageLoading';

type ConferenceEmbeddedPageProps = {
	callId: string;
};

const ConferenceEmbeddedPage = ({ callId }: ConferenceEmbeddedPageProps) => {
	const { room, conference } = useConferenceEmbedded(callId);

	const subscription = useUserSubscription(room.rid ?? '');
	const hasUnread = Boolean(subscription && subscription.unread > 0);

	const [chatVisible, setChatVisible] = useState(true);

	const { closeChat, dialOut } = usePexipPlugin({
		conferenceUrl: conference.url,
		hasUnread,
		chatVisible,
		onToggleChat: setChatVisible,
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
			{/* Keep the chat mounted while hidden so its room/composer state survives toggling. The outer
			box animates its width to slide the panel in/out; the inner box keeps a fixed minimum width and
			is clipped by `overflow: hidden`, so the content slides instead of reflowing as it collapses. */}
			<Box
				display='flex'
				flexDirection='column'
				flexShrink={0}
				width={chatVisible ? '30%' : '0'}
				minWidth={chatVisible ? 350 : 0}
				bg='tint'
				borderInlineEndWidth={chatVisible ? 1 : 0}
				borderColor='divider'
				style={{ overflow: 'hidden', transition: 'width 200ms ease, min-width 200ms ease' }}
			>
				<Box display='flex' flexDirection='column' width='100%' minWidth={350} height='full'>
					<ConferenceChat callId={callId} rid={room.rid} loading={room.loading} onClose={closeChat} onDialOut={dialOut} />
				</Box>
			</Box>

			<Box flexGrow={1} display='flex' flexDirection='column' position='relative'>
				<ConferenceIframe url={conference.url} loading={conference.loading} />
			</Box>
		</Box>
	);
};

export default ConferenceEmbeddedPage;
