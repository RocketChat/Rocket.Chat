export type CallHistoryExternalContact = {
	number: string;
};

export type CallHistoryInternalContact = {
	_id: string;
	name?: string;
	username: string;
	displayName?: string;
	voiceCallExtension?: string;
	avatarUrl?: string;
};

export type CallHistoryUnknownContact = {
	unknown: true;
};

export type CallHistoryContact = CallHistoryInternalContact | CallHistoryExternalContact | CallHistoryUnknownContact;

export const isCallHistoryUnknownContact = (contact: CallHistoryContact): contact is CallHistoryUnknownContact => {
	return 'unknown' in contact && contact.unknown;
};

export const isCallHistoryInternalContact = (contact: CallHistoryContact): contact is CallHistoryInternalContact => {
	return '_id' in contact && Boolean(contact._id);
};

export const isCallHistoryExternalContact = (contact: CallHistoryContact): contact is CallHistoryExternalContact => {
	return !isCallHistoryUnknownContact(contact) && !isCallHistoryInternalContact(contact);
};
