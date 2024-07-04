import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
} from '../../../components/Contextualbar';
import ContactInfo from './contacts/contactInfo/ContactInfo';
import EditContactInfo from './contacts/contactInfo/EditContactInfo';
import EditContactInfoWithData from './contacts/contactInfo/EditContactInfoWithData';

const HEADER_OPTIONS = {
	new: { icon: 'user', title: 'New_contact' },
	info: { icon: 'user', title: 'Contact_Info' },
	edit: { icon: 'pencil', title: 'Edit_Contact_Profile' },
} as const;

type BarOptions = keyof typeof HEADER_OPTIONS;

const ContactContextualBar = () => {
	const t = useTranslation();

	const directoryRoute = useRoute('omnichannel-directory');
	const bar = (useRouteParameter('bar') || 'info') as BarOptions;
	const contactId = useRouteParameter('id') || '';
	const context = useRouteParameter('context');

	const handleClose = () => {
		directoryRoute.push({ tab: 'contacts' });
	};

	const handleCancel = () => {
		directoryRoute.push({ tab: 'contacts', context: 'info', id: contactId });
	};

	const header = useMemo(() => HEADER_OPTIONS[bar] || HEADER_OPTIONS.info, [bar]);

	return (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarIcon name={header.icon} />
				<ContextualbarTitle>{t(header.title)}</ContextualbarTitle>
				<ContextualbarClose onClick={handleClose} />
			</ContextualbarHeader>
			{context === 'new' && <EditContactInfo id={contactId} onCancel={handleClose} />}
			{context === 'edit' && <EditContactInfoWithData id={contactId} onCancel={handleCancel} />}
			{context !== 'new' && context !== 'edit' && <ContactInfo id={contactId} />}
		</Contextualbar>
	);
};

export default ContactContextualBar;
