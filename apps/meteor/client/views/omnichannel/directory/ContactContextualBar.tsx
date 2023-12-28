import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
} from '../../../components/Contextualbar';
import ContactEditWithData from './contacts/contextualBar/ContactEditWithData';
import ContactInfo from './contacts/contextualBar/ContactInfo';
import ContactNewEdit from './contacts/contextualBar/ContactNewEdit';

const HEADER_OPTIONS = {
	new: { icon: 'user', title: 'New_contact' },
	info: { icon: 'user', title: 'Contact_Info' },
	edit: { icon: 'pencil', title: 'Edit_Contact_Profile' },
} as const;

type BarOptions = keyof typeof HEADER_OPTIONS;

const ContactContextualBar = () => {
	const directoryRoute = useRoute('omnichannel-directory');
	const bar = (useRouteParameter('bar') || 'info') as BarOptions;
	const contactId = useRouteParameter('id') || '';

	const t = useTranslation();

	const handleContactsContextualbarCloseButtonClick = () => {
		directoryRoute.push({ page: 'contacts' });
	};

	const handleContactsContextualbarBackButtonClick = () => {
		directoryRoute.push({ page: 'contacts', id: contactId, bar: 'info' });
	};

	const header = useMemo(() => HEADER_OPTIONS[bar] || HEADER_OPTIONS.info, [bar]);

	return (
		<Contextualbar className='contextual-bar'>
			<ContextualbarHeader>
				<ContextualbarIcon name={header.icon} />
				<ContextualbarTitle>{t(header.title)}</ContextualbarTitle>
				<ContextualbarClose onClick={handleContactsContextualbarCloseButtonClick} />
			</ContextualbarHeader>
			{bar === 'new' && <ContactNewEdit id={contactId} close={handleContactsContextualbarCloseButtonClick} />}
			{bar === 'info' && <ContactInfo id={contactId} />}
			{bar === 'edit' && <ContactEditWithData id={contactId} close={handleContactsContextualbarBackButtonClick} />}
		</Contextualbar>
	);
};

export default ContactContextualBar;
