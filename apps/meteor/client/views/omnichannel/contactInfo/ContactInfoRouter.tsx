import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React from 'react';

import { useOmnichannelRoom } from '../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../room/contexts/RoomToolboxContext';
import ContactInfo from './ContactInfo';
import ContactEditWithData from './EditContactInfoWithData';
import ContactHistoryMessagesList from './contactHistory/MessageList/ContactHistoryMessagesList';

const ContactInfoRouter = () => {
	const room = useOmnichannelRoom();
	const directoryRoute = useRoute('live');
	const context = useRouteParameter('context');
	const contextId = useRouteParameter('contextId');
	const { closeTab } = useRoomToolbox();

	const {
		v: { _id },
	} = room;

	const handleCancel = () => directoryRoute.push({ id: room._id, tab: 'contact-profile' });

	if (context === 'chat-history' && contextId) {
		return <ContactHistoryMessagesList chatId={contextId} onClose={closeTab} />;
	}

	if (context === 'edit') {
		return <ContactEditWithData id={_id} onClose={closeTab} onCancel={handleCancel} />;
	}

	return <ContactInfo id={_id} onClose={closeTab} />;
};

export default ContactInfoRouter;
