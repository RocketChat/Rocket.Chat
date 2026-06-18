import CallHistoryExternalUser from './CallHistoryExternalUser';
import CallHistoryInternalUser from './CallHistoryInternalUser';
import CallHistoryUnknownUser from './CallHistoryUnknownUser';
import { isCallHistoryExternalContact, isCallHistoryInternalContact, type CallHistoryContact } from '../definitions';

type CallHistoryUserProps = {
	contact: CallHistoryContact;
};

const CallHistoryUser = ({ contact }: CallHistoryUserProps) => {
	if (isCallHistoryInternalContact(contact)) {
		return <CallHistoryInternalUser contact={contact} />;
	}

	if (isCallHistoryExternalContact(contact)) {
		return <CallHistoryExternalUser showIcon={false} contact={contact} />;
	}

	return <CallHistoryUnknownUser />;
};

export default CallHistoryUser;
