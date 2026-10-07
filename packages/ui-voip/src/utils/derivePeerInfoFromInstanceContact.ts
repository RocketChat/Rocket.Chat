import type { CallContact } from '@rocket.chat/media-signaling';

import type { ExternalPeerInfo, InternalPeerInfo, UnknownPeerInfo } from '../context/definitions';

const deriveExternalPeerInfoFromInstanceContact = (contact: CallContact): ExternalPeerInfo => {
	if (contact.type !== 'sip') {
		throw new Error('deriveExternalPeerInfoFromInstanceContact: Contact is not a SIP contact');
	}

	return {
		type: 'sip',
		number: contact.id || 'unknown',
		...(contact.displayName && { displayName: contact.displayName }),
	};
};

const deriveUserIdFromInstanceContact = (contact: CallContact): string | null => {
	if (contact.uid) {
		return contact.uid;
	}

	if (contact.type === 'user' && contact.id) {
		return contact.id;
	}

	return null;
};

const deriveInternalPeerInfoFromInstanceContact = (contact: CallContact, userId: string): Omit<InternalPeerInfo, 'avatarUrl'> => {
	if (!userId) {
		throw new Error('deriveInternalPeerInfoFromInstanceContact: Contact is not a user contact');
	}

	return {
		type: contact.type || 'user',
		displayName: contact.displayName || 'unknown',
		userId,
		username: contact.username,
		callerId: contact.sipExtension,
	};
};

export const derivePeerInfoFromInstanceContact = (contact: CallContact) => {
	const userId = deriveUserIdFromInstanceContact(contact);

	if (userId) {
		return deriveInternalPeerInfoFromInstanceContact(contact, userId);
	}

	if (contact.type === 'sip') {
		return deriveExternalPeerInfoFromInstanceContact(contact);
	}

	return {
		type: 'unknown',
		displayName: 'unknown',
	} as UnknownPeerInfo;
};
