import { Box, Button } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import AddParticipantsModal from './AddParticipantsModal';
import ConferenceRoom from './ConferenceRoom';
import NotFoundPage from '../notFound/NotFoundPage';
import EmbeddedPreload from '../root/MainLayout/EmbeddedPreload';
import PageLoading from '../root/PageLoading';

type ConferenceChatProps = {
	rid?: string;
	loading: boolean;
};

const ConferenceChat = ({ rid, loading }: ConferenceChatProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	if (loading) {
		return <PageLoading />;
	}

	if (!rid) {
		return <NotFoundPage />;
	}

	return (
		<Box position='relative' display='flex' flexDirection='column' flexGrow={1} height='full'>
			<EmbeddedPreload rid={rid}>
				<Box
					is='header'
					display='flex'
					alignItems='center'
					justifyContent='space-between'
					pi={24}
					pb={16}
					borderBlockEndWidth={1}
					borderBlockEndColor='divider'
				>
					<Box is='h1' fontScale='h2' color='default'>
						{t('Chat')}
					</Box>
					<Button icon='user-plus' onClick={() => setModal(<AddParticipantsModal rid={rid} onClose={() => setModal(null)} />)}>
						{t('Add_participants')}
					</Button>
				</Box>

				<ConferenceRoom rid={rid} />
			</EmbeddedPreload>
		</Box>
	);
};

export default ConferenceChat;
