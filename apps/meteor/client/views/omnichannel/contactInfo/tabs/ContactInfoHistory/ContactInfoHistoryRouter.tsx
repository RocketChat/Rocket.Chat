import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import ContactInfoHistory from './ContactInfoHistory';
import ContactInfoHistoryMessages from './ContactInfoHistoryMessages';

const ContactInfoHistoryRouter = ({ contact }: { contact: Serialized<ILivechatContact> }) => {
	const [chatId, setChatId] = useState<string | undefined>();
	const { navigate } = useRouter();

	if (chatId) {
		return (
			<ContactInfoHistoryMessages chatId={chatId} onBack={() => setChatId(undefined)} onOpenRoom={() => navigate(`/live/${chatId}`)} />
		);
	}

	return <ContactInfoHistory contact={contact} setChatId={setChatId} />;
};

export default ContactInfoHistoryRouter;
