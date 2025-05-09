import { useRouteParameter } from '@rocket.chat/ui-contexts';

import CallsContextualBarDirectory from './CallsContextualBarDirectory';
import ChatsContextualBar from './ChatsContextualBar';
import ContactContextualBar from './ContactContextualBar';

const ContextualBarRouter = () => {
	const tab = useRouteParameter('tab');

	switch (tab) {
		case 'contacts':
			return <ContactContextualBar />;
		case 'chats':
			return <ChatsContextualBar />;
		case 'calls':
			return <CallsContextualBarDirectory />;
		default:
			return null;
	}
};

export default ContextualBarRouter;
