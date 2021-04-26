import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import { useRoute, useRouteParameter } from '../../../../../contexts/RouterContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useRoom } from '../../../../room/providers/RoomProvider';
import ContactEditWithData from './ContactEditWithData';
import ContactInfo from './ContactInfo';

const PATH = 'live';

const ContactsContextualBar = ({ rid }) => {
	const t = useTranslation();

	const directoryRoute = useRoute(PATH);

	const context = useRouteParameter('context');

	const closeContextualBar = () => {
		directoryRoute.push({ id: rid });
	};

	const handleContactEditBarCloseButtonClick = () => {
		directoryRoute.push({ id: rid, tab: 'contact-profile' });
	};

	const room = useRoom();

	const {
		v: { _id },
	} = room;

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='user' />
				<VerticalBar.Text>{t('Contact_Info')}</VerticalBar.Text>
				<VerticalBar.Close onClick={closeContextualBar} />
			</VerticalBar.Header>
			{context === 'edit' ? (
				<ContactEditWithData id={_id} close={handleContactEditBarCloseButtonClick} />
			) : (
				<ContactInfo id={_id} rid={rid} route={PATH} />
			)}
		</>
	);
};

export default ContactsContextualBar;
