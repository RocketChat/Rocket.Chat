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

const deriveInternalPeerInfoFromInstanceContact = (contact: CallContact): Omit<InternalPeerInfo, 'avatarUrl'> | UnknownPeerInfo => {
	if (!contact.id) {
		return {
			type: 'unknown',
		};
	}

	return {
		type: 'user',
		displayName: contact.displayName || 'unknown',
		userId: contact.id,
		username: contact.username,
		callerId: contact.sipExtension,
	};
};

export const derivePeerInfoFromInstanceContact = (contact: CallContact) => {
	if (contact.type === 'user') {
		return deriveInternalPeerInfoFromInstanceContact(contact);
	}

	if (contact.type === 'sip') {
		return deriveExternalPeerInfoFromInstanceContact(contact);
	}

	return {
		type: 'unknown',
	} as UnknownPeerInfo;
};
