import React from 'react';

import { useRouteParameter } from '../../../contexts/RouterContext';
import ChatsContextualBar from './ChatsContextualBar';
import ContactContextualBar from './ContactContextualBar';

const ContextualBar = ({ contactReload, chatReload }) => {
	const context = useRouteParameter('context');
	const tab = useRouteParameter('tab');

	if (!context) {
		return null;
	}

	switch (tab) {
		case 'contacts':
			return <ContactContextualBar contactReload={contactReload} />;
		case 'chats':
			return <ChatsContextualBar chatReload={chatReload} />;
		default:
			return null;
	}
};

export default ContextualBar;
