import type { ReactElement } from 'react';

import MessageNotification from './MessageNotification';

const UnreadMessagesNotification = (): ReactElement => {
	return <MessageNotification label='Unread' bg='badge-background-level-2' />;
};

export default UnreadMessagesNotification;
