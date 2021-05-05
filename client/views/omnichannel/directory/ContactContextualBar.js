import { Box, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import ContactEditWithData from './contacts/contextualBar/ContactEditWithData';
import ContactInfo from './contacts/contextualBar/ContactInfo';
import ContactNewEdit from './contacts/contextualBar/ContactNewEdit';

const ContactContextualBar = ({ contactReload }) => {
	const directoryRoute = useRoute('omnichannel-directory');
	const bar = useRouteParameter('bar') || 'info';
	const id = useRouteParameter('id');

	const t = useTranslation();

	const handleContactsVerticalBarCloseButtonClick = () => {
		directoryRoute.push({ tab: 'contacts' });
	};

	const handleContactsVerticalBarBackButtonClick = () => {
		directoryRoute.push({ tab: 'contacts', context: 'info', id });
	};

	return (
		<VerticalBar className={'contextual-bar'}>
			<VerticalBar.Header>
				{bar === 'new' && (
					<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>
						<Icon name='user' size='x20' /> {t('New_Contact')}
					</Box>
				)}
				{bar === 'info' && (
					<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>
						<Icon name='user' size='x20' /> {t('Contact_Info')}
					</Box>
				)}
				{bar === 'edit' && (
					<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>
						<Icon name='pencil' size='x20' /> {t('Edit_Contact_Profile')}
					</Box>
				)}
				<VerticalBar.Close onClick={handleContactsVerticalBarCloseButtonClick} />
			</VerticalBar.Header>
			{bar === 'new' && (
				<ContactNewEdit reload={contactReload} close={handleContactsVerticalBarCloseButtonClick} />
			)}
			{bar === 'info' && <ContactInfo reload={contactReload} id={id} />}
			{bar === 'edit' && (
				<ContactEditWithData
					id={id}
					reload={contactReload}
					close={handleContactsVerticalBarBackButtonClick}
				/>
			)}
		</VerticalBar>
	);
};

export default ContactContextualBar;
