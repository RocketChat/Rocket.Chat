import { Box, Button, IconButton } from '@rocket.chat/fuselage';
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
	onClose?: () => void;
};

const ConferenceChat = ({ callId, rid, loading, onClose }: ConferenceChatProps) => {
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
					paddingInline={12}
					paddingBlock={8}
					borderBlockEndWidth={1}
					borderBlockEndColor='stroke-extra-light'
				>
					<Box is='h5' fontScale='h5' color='default'>
						{t('Chat')}
					</Box>
					{/* The panel is docked to the inline end of the call, so dismissal sits at the far end — the
					    same place every other closable surface in the product puts it. */}
					<Box display='flex' alignItems='center'>
						<Button
							small
							icon='user-plus'
							onClick={() => setModal(<AddParticipantsModal callId={callId} rid={rid} onClose={() => setModal(null)} />)}
						>
							{t('Add_people')}
						</Button>
						{onClose && <IconButton marginInlineStart={8} small icon='cross' title={t('Close')} onClick={onClose} />}
					</Box>
				</Box>

				<ConferenceRoom rid={rid} />
			</ConferenceRoomPreload>
		</Box>
	);
};

export default ConferenceChat;
