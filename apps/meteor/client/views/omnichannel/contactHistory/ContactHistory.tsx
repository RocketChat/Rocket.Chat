import type { ReactElement } from 'react';
import React, { useState } from 'react';

import ContactHistoryContextualbar from './ContactHistoryContextualbar';
import ContactHistoryMessagesContextualbar from './MessageList/ContactHistoryMessagesContextualbar';

const ContactHistory = ({ tabBar: { close } }: any): ReactElement => {
	const [chatId, setChatId] = useState<string>('');
	return (
		<>
			{chatId && chatId !== '' ? (
				<ContactHistoryMessagesContextualbar chatId={chatId} setChatId={setChatId} close={close} />
			) : (
				<ContactHistoryContextualbar setChatId={setChatId} close={close} />
			)}
		</>
	);
};

export default ContactHistory;
