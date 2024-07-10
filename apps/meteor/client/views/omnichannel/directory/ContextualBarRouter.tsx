import { useRouteParameter } from '@rocket.chat/ui-contexts';
import React from 'react';

import CallsContextualBarDirectory from './CallsContextualBarDirectory';
import ChatsContextualBar from './ChatsContextualBar';
import ContactContextualBar from './ContactContextualBar';
import ContactGroupsContextualBar from './groups/contextualBar/ContactGroupsContextualBar';

const ContextualBarRouter = ({ chatReload }: { chatReload?: () => void }) => {
	const tab = useRouteParameter('tab');

	switch (tab) {
		case 'contacts':
			return <ContactContextualBar />;
		case 'chats':
			return <ChatsContextualBar chatReload={chatReload} />;
		case 'calls':
			return <CallsContextualBarDirectory />;
		case 'groups':
			return <ContactGroupsContextualBar />;
		default:
			return null;
	}
};

export default ContextualBarRouter;
