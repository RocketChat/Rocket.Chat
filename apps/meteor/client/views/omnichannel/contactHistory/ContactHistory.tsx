import React, { useState } from 'react';

import { useRoomToolbox } from '../../room/contexts/RoomToolboxContext';
import ContactHistoryList from './ContactHistoryList';
import ContactHistoryMessagesList from './MessageList/ContactHistoryMessagesList';

const ContactHistory = () => {
	const [chatId, setChatId] = useState<string>('');
	const { closeTab } = useRoomToolbox();

	return (
		<>
			{chatId && chatId !== '' ? (
				<ContactHistoryMessagesList chatId={chatId} setChatId={setChatId} close={closeTab} />
			) : (
				<ContactHistoryList setChatId={setChatId} close={closeTab} />
			)}
		</>
	);
};

export default ContactHistory;
