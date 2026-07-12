import { Box, IconButton } from '@rocket.chat/fuselage';
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
						{onClose && <IconButton mie={8} small icon='cross' title={t('Close')} onClick={onClose} />}
						<Box is='h1' fontScale='h2' color='default'>
							{t('Chat')}
						</Box>
					</Box>
				</Box>

				<ConferenceRoom rid={rid} />
			</ConferenceRoomPreload>
		</Box>
	);
};

export default ConferenceChat;
