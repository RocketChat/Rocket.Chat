import type { CallContact } from '@rocket.chat/media-signaling';

import type { ExternalPeerInfo, InternalPeerInfo } from '../context/definitions';

const deriveExternalPeerInfoFromInstanceContact = (contact: CallContact): ExternalPeerInfo => {
	if (contact.type !== 'sip') {
		throw new Error('deriveExternalPeerInfoFromInstanceContact: Contact is not a SIP contact');
	}

	return {
		number: contact.id || 'unknown',
	};
};

const deriveInternalPeerInfoFromInstanceContact = (contact: CallContact): Omit<InternalPeerInfo, 'avatarUrl'> => {
	if (contact.type !== 'user') {
		throw new Error('deriveInternalPeerInfoFromInstanceContact: Contact is not a user contact');
	}

	return {
		displayName: contact.displayName || 'unknown',
		userId: contact.id || 'unknown',
		username: contact.username,
		callerId: contact.sipExtension,
	};
};

export const derivePeerInfoFromInstanceContact = (contact: CallContact) => {
	if (contact.type === 'sip') {
		return deriveExternalPeerInfoFromInstanceContact(contact);
	}

	return deriveInternalPeerInfoFromInstanceContact(contact);
};
