import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import ContactEditWithData from './contacts/contextualBar/ContactEditWithData';
import ContactInfo from './contacts/contextualBar/ContactInfo';
import ContactNewEdit from './contacts/contextualBar/ContactNewEdit';

const ContactContextualBar = ({ contactReload }) => {
	const directoryRoute = useRoute('omnichannel-directory');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const t = useTranslation();

	const handleContactsVerticalBarCloseButtonClick = () => {
		directoryRoute.push({});
	};

	return (
		<VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{context === 'new' && (
					<>
						<VerticalBar.Icon name='user' />
						<VerticalBar.Text>{t('New_Contact')}</VerticalBar.Text>
					</>
				)}
				{context === 'info' && (
					<>
						<VerticalBar.Icon name='user' />
						<VerticalBar.Text>{t('Contact_Info')}</VerticalBar.Text>
					</>
				)}
				{context === 'edit' && (
					<>
						<VerticalBar.Icon name='pencil' />
						<VerticalBar.Text>{t('Edit_Contact_Profile')}</VerticalBar.Text>
					</>
				)}
				<VerticalBar.Close onClick={handleContactsVerticalBarCloseButtonClick} />
			</VerticalBar.Header>
			{context === 'new' && (
				<ContactNewEdit reload={contactReload} close={handleContactsVerticalBarCloseButtonClick} />
			)}
			{context === 'info' && <ContactInfo reload={contactReload} id={id} />}
			{context === 'edit' && (
				<ContactEditWithData
					id={id}
					reload={contactReload}
					close={handleContactsVerticalBarCloseButtonClick}
				/>
			)}
		</VerticalBar>
	);
};

export default ContactContextualBar;
