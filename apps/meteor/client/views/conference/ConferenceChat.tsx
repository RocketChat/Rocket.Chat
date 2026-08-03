import { Box, IconButton } from '@rocket.chat/fuselage';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ConferenceChatNotShared from './ConferenceChatNotShared';
import ConferenceRoom from './ConferenceRoom';
import ConferenceRoomPreload from './ConferenceRoomPreload';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';
import NotFoundPage from '../notFound/NotFoundPage';
import PageLoading from '../root/PageLoading';

type ConferenceChatProps = {
	rid?: string;
	loading: boolean;
	chatAccess?: ConferenceChatAccess;
	onClose?: () => void;
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
	const shared = !uid || !chatAccess?.membersWithoutAccess.includes(uid);

	return (
		<Box position='relative' display='flex' flexDirection='column' flexGrow={1} height='full'>
			<Box
				is='header'
				display='flex'
				alignItems='center'
				justifyContent='space-between'
				paddingInline={12}
				paddingBlock={8}
				borderBlockEndWidth={1}
				borderBlockEndColor='stroke-extra-light'
			>
				<Box is='h5' fontScale='h5' color='default'>
					{t('Chat')}
				</Box>
				{/* Adding people lives in the members panel, next to the list of who is already here. The panel is
				    docked to the inline end of the call, so dismissal sits at the far end — the same place every
				    other closable surface in the product puts it. */}
				{onClose && <IconButton small icon='cross' title={t('Close')} onClick={onClose} />}
			</Box>

			{!shared && <ConferenceChatNotShared />}

			{shared && (
				<ConferenceRoomPreload rid={rid}>
					<ConferenceRoom rid={rid} />
				</ConferenceRoomPreload>
			)}
		</Box>
	);
};

export default ConferenceChat;
