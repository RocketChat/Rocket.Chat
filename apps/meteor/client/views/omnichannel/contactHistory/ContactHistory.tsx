import type { ReactElement } from 'react';
import React, { useState } from 'react';

import ContactHistoryVerticalBar from './ContactHistoryVerticalBar';
import ContactHistoryMessagesVerticalBar from './MessageList/ContactHistoryMessagesVerticalBar';

const ContactHistory = ({ tabBar: { close } }: any): ReactElement => {
	const [chatId, setChatId] = useState<string>('');
	return (
		<>
			{chatId && chatId !== '' ? (
				<ContactHistoryMessagesVerticalBar chatId={chatId} setChatId={setChatId} close={close} />
			) : (
				<ContactHistoryVerticalBar setChatId={setChatId} close={close} />
			)}
		</>
	);
};

export default ContactHistory;
