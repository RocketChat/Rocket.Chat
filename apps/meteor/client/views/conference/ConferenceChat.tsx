import { Box } from '@rocket.chat/fuselage';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import CallPanelHeader from './CallPanelHeader';
import ConferenceChatNotShared from './ConferenceChatNotShared';
import ConferenceRoom from './ConferenceRoom';
import ConferenceStoresReady from './ConferenceStoresReady';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';
import { hasConferenceChatAccess } from '../../../lib/videoConference/chatAccess';
import NotFoundPage from '../notFound/NotFoundPage';
import PageLoading from '../root/PageLoading';

type ConferenceChatProps = {
	rid?: string;
	loading: boolean;
	chatAccess?: ConferenceChatAccess;
	onClose: () => void;
};

const ConferenceChat = ({ rid, loading, chatAccess, onClose }: ConferenceChatProps) => {
	const { t } = useTranslation();
	const uid = useUserId();

	if (loading) {
		return <PageLoading />;
	}

	if (!rid) {
		return <NotFoundPage />;
	}

	// Membership grants no room access, so the chat may be a room this user can't read. The server already
	// worked out who those members are, which beats letting the room fetch fail and calling it a missing page.
	const shared = hasConferenceChatAccess(chatAccess, uid);

	return (
		<Box position='relative' display='flex' flexDirection='column' flexGrow={1} height='full'>
			<CallPanelHeader title={t('Chat')} onClose={onClose} />

			{!shared && <ConferenceChatNotShared />}

			{shared && (
				<ConferenceStoresReady>
					<ConferenceRoom rid={rid} />
				</ConferenceStoresReady>
			)}
		</Box>
	);
};

export default ConferenceChat;
