import { Icon, Box } from '@rocket.chat/fuselage';
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
					<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>
						<Icon name='user' size='x20' /> {t('New_Contact')}
					</Box>
				)}
				{context === 'info' && (
					<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>
						<Icon name='user' size='x20' /> {t('Contact_Profile')}
					</Box>
				)}
				{context === 'edit' && (
					<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>
						<Icon name='pencil' size='x20' /> {t('Edit_Contact_Profile')}
					</Box>
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
