import { useRouter } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

import ContactInfoHistory from './ContactInfoHistory';
import ContactInfoHistoryMessages from './ContactInfoHistoryMessages';

const ContactInfoHistoryRouter = ({ contactId }: { contactId: string }) => {
	const [chatId, setChatId] = useState<string>('');
	const { navigate } = useRouter();

	if (chatId && chatId !== '') {
		return <ContactInfoHistoryMessages chatId={chatId} onBack={() => setChatId('')} onOpenRoom={() => navigate(`/live/${chatId}`)} />;
	}

	return <ContactInfoHistory contactId={contactId} setChatId={setChatId} />;
};

export default ContactInfoHistoryRouter;
