import { Box, Button } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import AddParticipantsModal from './AddParticipantsModal';
import ConferenceRoom from './ConferenceRoom';
import ConferenceRoomPreload from './ConferenceRoomPreload';
import NotFoundPage from '../notFound/NotFoundPage';
import PageLoading from '../root/PageLoading';

type ConferenceChatProps = {
	callId: string;
	rid?: string;
	loading: boolean;
	onDialOut?: (destination: string) => void;
};

const ConferenceChat = ({ callId, rid, loading, onDialOut }: ConferenceChatProps) => {
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
			<ConferenceRoomPreload rid={rid}>
				<Box
					is='header'
					display='flex'
					alignItems='center'
					justifyContent='space-between'
					pi={24}
					pb={16}
					borderBlockEndWidth={1}
					borderBlockEndColor='stroke-extra-light'
				>
					<Box display='flex' alignItems='center'>
						<Box is='h1' fontScale='h2' color='default'>
							{t('Chat')}
						</Box>
					</Box>
					<Button
						icon='user-plus'
						onClick={() =>
							setModal(<AddParticipantsModal callId={callId} rid={rid} onClose={() => setModal(null)} onDialOut={onDialOut} />)
						}
					>
						{t('Add_people')}
					</Button>
				</Box>

				<ConferenceRoom rid={rid} />
			</ConferenceRoomPreload>
		</Box>
	);
};

export default ConferenceChat;
