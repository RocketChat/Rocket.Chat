import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import ContactEditWithData from './contacts/contextualBar/ContactEditWithData';
import ContactInfo from './contacts/contextualBar/ContactInfo';
import ContactNewEdit from './contacts/contextualBar/ContactNewEdit';

const ContactContextualBar = ({ contactReload }) => {
	const directoryRoute = useRoute('omnichannel-directory');
	const bar = useRouteParameter('bar');
	const id = useRouteParameter('id');

	const t = useTranslation();

	const handleContactsVerticalBarCloseButtonClick = () => {
		directoryRoute.push({ page: 'contacts' });
	};

	const handleContactsVerticalBarBackButtonClick = () => {
		directoryRoute.push({ page: 'contacts', id, bar: 'info' });
	};

	return (
		<VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{bar === 'new' && (
					<>
						<VerticalBar.Icon name='user' />
						<VerticalBar.Text>{t('New_Contact')}</VerticalBar.Text>
					</>
				)}
				{bar === 'info' && (
					<>
						<VerticalBar.Icon name='user' />
						<VerticalBar.Text>{t('Contact_Info')}</VerticalBar.Text>
					</>
				)}
				{bar === 'edit' && (
					<>
						<VerticalBar.Icon name='pencil' />
						<VerticalBar.Text>{t('Edit_Contact_Profile')}</VerticalBar.Text>
					</>
				)}
				<VerticalBar.Close onClick={handleContactsVerticalBarCloseButtonClick} />
			</VerticalBar.Header>
			{bar === 'new' && <ContactNewEdit reload={contactReload} close={handleContactsVerticalBarCloseButtonClick} />}
			{bar === 'info' && <ContactInfo reload={contactReload} id={id} />}
			{bar === 'edit' && <ContactEditWithData id={id} reload={contactReload} close={handleContactsVerticalBarBackButtonClick} />}
		</VerticalBar>
	);
};

export default ContactContextualBar;
