import type { CallContact } from '../../definition';

export function mergeContacts(oldContact: CallContact | null, newContact: CallContact | null): CallContact | null {
	if (!oldContact || !newContact) {
		return newContact || oldContact;
	}

	if (!Object.keys(newContact).length) {
		return oldContact;
	}
	if (!Object.keys(oldContact).length) {
		return newContact;
	}

	const keys: (keyof CallContact)[] = ['type', 'id', 'username', 'sipExtension'];

	for (const key of keys) {
		if (oldContact[key] && newContact[key] && oldContact[key] !== newContact[key]) {
			return newContact;
		}
	}

	return {
		...oldContact,
		...newContact,
	};
}
