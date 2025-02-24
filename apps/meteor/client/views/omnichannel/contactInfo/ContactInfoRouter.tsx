import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';

import ContactInfo from './ContactInfo';
import ContactInfoError from './ContactInfoError';
import EditContactInfoWithData from './EditContactInfoWithData';
import { useOmnichannelRoom } from '../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../room/contexts/RoomToolboxContext';

const ContactInfoRouter = () => {
	const room = useOmnichannelRoom();
	const { closeTab } = useRoomToolbox();

	const liveRoute = useRoute('live');
	const context = useRouteParameter('context');

	const handleCloseEdit = (): void => liveRoute.push({ id: room._id, tab: 'contact-profile' });

	if (!room.contactId) {
		return <ContactInfoError onClose={closeTab} />;
	}

	if (context === 'edit' && room.contactId) {
		return <EditContactInfoWithData id={room.contactId} onClose={closeTab} onCancel={handleCloseEdit} />;
	}

	return <ContactInfo id={room.contactId} onClose={closeTab} />;
};

export default ContactInfoRouter;
