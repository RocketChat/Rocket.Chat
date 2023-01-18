import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import ContactEditWithData from './contacts/contextualBar/ContactEditWithData';
import ContactInfo from './contacts/contextualBar/ContactInfo';
import ContactNewEdit from './contacts/contextualBar/ContactNewEdit';

const HEADER_OPTIONS = {
	new: { icon: 'user', title: 'New_Contact' },
	info: { icon: 'user', title: 'Contact_Info' },
	edit: { icon: 'pencil', title: 'Edit_Contact_Profile' },
} as const;

type BarOptions = keyof typeof HEADER_OPTIONS;

const ContactContextualBar = () => {
	const directoryRoute = useRoute('omnichannel-directory');
	const bar = (useRouteParameter('bar') || 'info') as BarOptions;
	const contactId = useRouteParameter('id') || '';

	const t = useTranslation();

	const handleContactsVerticalBarCloseButtonClick = () => {
		directoryRoute.push({ page: 'contacts' });
	};

	const handleContactsVerticalBarBackButtonClick = () => {
		directoryRoute.push({ page: 'contacts', id: contactId, bar: 'info' });
	};

	const header = useMemo(() => HEADER_OPTIONS[bar] || HEADER_OPTIONS.info, [bar]);

	return (
		<VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				<VerticalBar.Icon name={header.icon} />
				<VerticalBar.Text>{t(header.title)}</VerticalBar.Text>
				<VerticalBar.Close onClick={handleContactsVerticalBarCloseButtonClick} />
			</VerticalBar.Header>
			{bar === 'new' && <ContactNewEdit id={contactId} close={handleContactsVerticalBarCloseButtonClick} />}
			{bar === 'info' && <ContactInfo id={contactId} />}
			{bar === 'edit' && <ContactEditWithData id={contactId} close={handleContactsVerticalBarBackButtonClick} />}
		</VerticalBar>
	);
};

export default ContactContextualBar;
