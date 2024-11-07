import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useOmnichannelRoom } from '../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../room/contexts/RoomToolboxContext';
import ContactInfo from './ContactInfo';
import ContactInfoError from './ContactInfoError';
import EditContactInfoWithData from './EditContactInfoWithData';

const ContactInfoRouter = () => {
	const room = useOmnichannelRoom();
	const { closeTab } = useRoomToolbox();

	const liveRoute = useRoute('live');
	const context = useRouteParameter('context');

	const handleCloseEdit = (): void => {
		liveRoute.push({ id: room._id, tab: 'contact-profile' });
	};

	if (!room.v.contactId) {
		return <ContactInfoError onClose={closeTab} />;
	}

	if (context === 'edit' && room.v.contactId) {
		return <EditContactInfoWithData id={room.v.contactId} onClose={closeTab} onCancel={handleCloseEdit} />;
	}

	return <ContactInfo id={room.v.contactId} onClose={closeTab} />;
};

export default ContactInfoRouter;
