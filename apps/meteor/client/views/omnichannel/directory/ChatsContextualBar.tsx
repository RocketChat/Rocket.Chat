import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';

import ChatsFiltersContextualBar from './chats/ChatsFiltersContextualBar';
import ContactHistoryMessagesList from '../contactHistory/MessageList/ContactHistoryMessagesList';

const ChatsContextualBar = () => {
	const router = useRouter();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleOpenRoom = () => id && router.navigate(`/live/${id}`);
	const handleClose = () => router.navigate('/omnichannel-directory/chats');

	if (context === 'filters') {
		return <ChatsFiltersContextualBar onClose={handleClose} />;
	}

	if (context === 'info' && id) {
		return <ContactHistoryMessagesList chatId={id} onClose={handleClose} onOpenRoom={handleOpenRoom} />;
	}

	return null;
};

export default ChatsContextualBar;
