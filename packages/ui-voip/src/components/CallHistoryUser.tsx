import CallHistoryExternalUser from './CallHistoryExternalUser.js';
import CallHistoryInternalUser from './CallHistoryInternalUser.js';
import CallHistoryUnknownUser from './CallHistoryUnknownUser.js';
import { isCallHistoryExternalContact, isCallHistoryInternalContact, type CallHistoryContact } from '../definitions/index.js';

export type CallHistoryUserProps = {
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
