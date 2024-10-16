import React, { useState } from 'react';

import ContactInfoHistory from './ContactInfoHistory';
import ContactInfoHistoryMessages from './ContactInfoHistoryMessages';

const ContactInfoHistoryRouter = ({ contactId }: { contactId: string }) => {
	const [chatId, setChatId] = useState<string>('');

	if (chatId && chatId !== '') {
		return <ContactInfoHistoryMessages chatId={chatId} onBack={() => setChatId('')} />;
	}

	return <ContactInfoHistory contactId={contactId} setChatId={setChatId} />;
};

export default ContactInfoHistoryRouter;
