import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';

import ContactInfo from './ContactInfo';
import ContactInfoError from './ContactInfoError';
import EditContactInfoWithData from './EditContactInfoWithData';
import { ContactInfoActivityRouter } from './tabs/ContactInfoActivity';
import { useOmnichannelRoom } from '../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../room/contexts/RoomToolboxContext';

const ContactInfoRouter = () => {
	const room = useOmnichannelRoom();
	const { closeTab } = useRoomToolbox();

	const router = useRouter();
	const context = useRouteParameter('context');
	const contextId = useRouteParameter('contextId');

	const handleCloseEdit = (): void => router.navigate(`/live/${room._id}/contact-profile`);
	const handleActivityBack = (): void => router.navigate(`/live/${room._id}/contact-profile/activity`);

	if (!room.contactId) {
		return <ContactInfoError onClose={closeTab} />;
	}

	if (context === 'edit' && room.contactId) {
		return <EditContactInfoWithData id={room.contactId} onClose={closeTab} onCancel={handleCloseEdit} />;
	}

	if (context === 'activity' && contextId !== undefined) {
		return <ContactInfoActivityRouter onClickBack={handleActivityBack} onClose={closeTab} />;
	}

	return <ContactInfo id={room.contactId} onClose={closeTab} />;
};

export default ContactInfoRouter;
