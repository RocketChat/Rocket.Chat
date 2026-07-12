import { Box } from '@rocket.chat/fuselage';
import { Contextualbar, ContextualbarHeader, ContextualbarIcon, ContextualbarTitle, ContextualbarClose } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import ConferenceRoom from './ConferenceRoom';
import ConferenceRoomPreload from './ConferenceRoomPreload';
import NotFoundPage from '../notFound/NotFoundPage';
import PageLoading from '../root/PageLoading';

type ConferenceChatProps = {
	rid?: string;
	loading?: boolean;
	onClose?: () => void;
};

const ConferenceChat = ({ rid, loading, onClose }: ConferenceChatProps) => {
	const { t } = useTranslation();

	if (loading) {
		return <PageLoading />;
	}

	if (!rid) {
		return <NotFoundPage />;
	}

	return (
		<Box position='relative' display='flex' flexDirection='column' flexGrow={1} height='full'>
			<ConferenceRoomPreload rid={rid}>
				<Contextualbar width='100%' height='full' position='relative'>
					<ContextualbarHeader>
						<ContextualbarIcon name='chat' />
						<ContextualbarTitle>{t('Chat')}</ContextualbarTitle>
						{onClose && <ContextualbarClose onClick={onClose} />}
					</ContextualbarHeader>

					<ConferenceRoom rid={rid} />
				</Contextualbar>
			</ConferenceRoomPreload>
		</Box>
	);
};

export default ConferenceChat;
