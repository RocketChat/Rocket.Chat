import { useRouteParameter } from '@rocket.chat/ui-contexts';
import React from 'react';

import CallsContextualBarDirectory from './CallsContextualBarDirectory';
import ChatsContextualBar from './ChatsContextualBar';
import ContactContextualBar from './ContactContextualBar';

type ContextualBarProps = {
	chatReload?: () => void;
};

const ContextualBar = ({ chatReload }: ContextualBarProps) => {
	const page = useRouteParameter('page');

	switch (page) {
		case 'contacts':
			return <ContactContextualBar />;
		case 'chats':
			return <ChatsContextualBar chatReload={chatReload} />;
		case 'calls':
			return <CallsContextualBarDirectory />;
		default:
			return null;
	}
};

export default ContextualBar;
