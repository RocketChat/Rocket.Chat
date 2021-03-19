import React from 'react';
import { Icon, Box } from '@rocket.chat/fuselage';

// import { ContactInfo } from './ContactInfo';
import VerticalBar from '../../../../components/VerticalBar';
import { useRoute } from '../../../../contexts/RouterContext';
import { useTranslation } from '../../../../contexts/TranslationContext';

const ContactsContextualBar = ({ id }) => {
	const t = useTranslation();

	const directoryRoute = useRoute('live');

	const closeContextualBar = () => {
		directoryRoute.push({ id });
	};
	return <>
		<VerticalBar.Header>
			<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'><Icon name='user' size='x20' /> {t('Contact_Profile')}</Box>
			<VerticalBar.Close onClick={closeContextualBar} />
		</VerticalBar.Header>
		{/* <ContactInfo id={id} /> */}
	</>;
};

export default ({ rid }) => <ContactsContextualBar id={rid} />;
