import type { RoomType } from '@rocket.chat/core-typings';
import { Box, Button } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AddParticipantsModal from './AddParticipantsModal';
import RoomOpenerEmbedded from '../room/RoomOpenerEmbedded';
import EmbeddedPreload from '../root/MainLayout/EmbeddedPreload';
import PageLoading from '../root/PageLoading';

type ConferenceChatProps = {
	type: RoomType;
	reference: string;
	loading: boolean;
};

const ConferenceChat = ({ type, reference, loading }: ConferenceChatProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const [ref, setReference] = useState(reference);

	if (loading) {
		return <PageLoading />;
	}

	return (
		<Box position='relative' display='flex' flexDirection='column' flexGrow={1} height='full'>
			<div>
				{/* Temporary buttons to test room change */}
				<Button onClick={() => setReference('general')}>general</Button>
				<Button onClick={() => setReference('important')}>important</Button>
			</div>
			<EmbeddedPreload type={type} reference={ref}>
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
					<Button
						icon='user-plus'
						onClick={() => setModal(<AddParticipantsModal type={type} reference={ref} onClose={() => setModal(null)} />)}
					>
						{t('Add_participants')}
					</Button>
				</Box>

				<RoomOpenerEmbedded type={type} reference={ref} />
			</EmbeddedPreload>
		</Box>
	);
};

export default ConferenceChat;
