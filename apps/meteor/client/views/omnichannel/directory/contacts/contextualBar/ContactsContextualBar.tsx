import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { ContextualbarHeader, ContextualbarIcon, ContextualbarTitle, ContextualbarClose } from '../../../../../components/Contextualbar';
import { useOmnichannelRoom } from '../../../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../../../room/contexts/RoomToolboxContext';
import ContactEditWithData from './ContactEditWithData';
import ContactInfo from './ContactInfo';

const PATH = 'live';

const ContactsContextualBar = () => {
	const t = useTranslation();

	const room = useOmnichannelRoom();
	const { closeTab } = useRoomToolbox();

	const directoryRoute = useRoute(PATH);

	const context = useRouteParameter('context');

	const handleContactEditBarCloseButtonClick = (): void => {
		directoryRoute.push({ id: room._id, tab: 'contact-profile' });
	};

	const {
		v: { _id },
	} = room;

	return (
		<>
			<ContextualbarHeader>
				{(context === 'info' || !context) && (
					<>
						<ContextualbarIcon name='info-circled' />
						<ContextualbarTitle>{t('Contact_Info')}</ContextualbarTitle>
					</>
				)}
				{context === 'edit' && (
					<>
						<ContextualbarIcon name='pencil' />
						<ContextualbarTitle>{t('Edit_Contact_Profile')}</ContextualbarTitle>
					</>
				)}
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			{context === 'edit' ? (
				<ContactEditWithData id={_id} close={handleContactEditBarCloseButtonClick} />
			) : (
				<ContactInfo id={_id} rid={room._id} route={PATH} />
			)}
		</>
	);
};

export default ContactsContextualBar;
