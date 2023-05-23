import type { ReactElement } from 'react';
import React, { useState } from 'react';

import ContactHistoryList from './ContactHistoryList';
import ContactHistoryMessagesList from './MessageList/ContactHistoryMessagesList';

const ContactHistory = ({ tabBar: { close } }: any): ReactElement => {
	const [chatId, setChatId] = useState<string>('');
	return (
		<>
			{chatId && chatId !== '' ? (
				<ContactHistoryMessagesList chatId={chatId} setChatId={setChatId} close={close} />
			) : (
				<ContactHistoryList setChatId={setChatId} close={close} />
			)}
		</>
	);
};

export default ContactHistory;
