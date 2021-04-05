import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoom } from '../../../views/room/providers/RoomProvider';
import { ContactInfo } from './ContactInfo';
import { ContactEditWithData } from './ContactForm';

const PATH = 'live';
const ContactsContextualBar = ({ id }) => {
	const t = useTranslation();

	const directoryRoute = useRoute(PATH);

	const context = useRouteParameter('context');

	const closeContextualBar = () => {
		directoryRoute.push({ id });
	};

	const handleContactEditBarCloseButtonClick = () => {
		directoryRoute.push({ id, tab: 'contact-profile' });
	};

	const room = useRoom();

	const { v: { _id } } = room;

	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='user' />
			<VerticalBar.Text>{t('Contact_Info')}</VerticalBar.Text>
			<VerticalBar.Close onClick={closeContextualBar} />
		</VerticalBar.Header>
		{context === 'edit' ? <ContactEditWithData id={_id} close={handleContactEditBarCloseButtonClick} /> : <ContactInfo id={_id} rid={id} route={PATH} />}
	</>;
};

export default ({ rid }) => <ContactsContextualBar id={rid} />;
