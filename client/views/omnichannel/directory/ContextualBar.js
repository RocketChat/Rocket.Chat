import React from 'react';

import { useRouteParameter } from '../../../contexts/RouterContext';
import ChatsContextualBar from './ChatsContextualBar';
import ContactContextualBar from './ContactContextualBar';

const ContextualBar = ({ contactReload, chatReload }) => {
	const page = useRouteParameter('page');
	const bar = useRouteParameter('bar');

	if (!bar) {
		return null;
	}

	switch (page) {
		case 'contacts':
			return <ContactContextualBar contactReload={contactReload} />;
		case 'chats':
			return <ChatsContextualBar chatReload={chatReload} />;
		default:
			return null;
	}
};

export default ContextualBar;
