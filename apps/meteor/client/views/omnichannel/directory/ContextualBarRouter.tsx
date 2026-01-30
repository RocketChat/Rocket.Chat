import { useRouteParameter } from '@rocket.chat/ui-contexts';

import ChatsContextualBar from './ChatsContextualBar';
import ContactContextualBar from './ContactContextualBar';

const ContextualBarRouter = () => {
	const tab = useRouteParameter('tab');

	switch (tab) {
		case 'contacts':
			return <ContactContextualBar />;
		case 'chats':
			return <ChatsContextualBar />;
		default:
			return null;
	}
};

export default ContextualBarRouter;
