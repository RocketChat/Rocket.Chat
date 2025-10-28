import type { ReactElement } from 'react';

import MessageNotification from './MessageNotification';

const AllMentionNotification = function All(): ReactElement {
	return <MessageNotification label='mention-all' bg='badge-background-level-3' />;
};

export default AllMentionNotification;
