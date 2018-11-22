const crypto = require('crypto');

class ContactsProvider {

	constructor() {
		this.contactsWeakHashMap = {};
	}

	addContact(contact) {
		const weakHash = this.getWeakHash(contact);
		const strongHash = this.getStrongHash(contact);

		if (weakHash in this.contactsWeakHashMap) {
			if (this.contactsWeakHashMap[weakHash].indexOf(strongHash) === -1) {
				this.contactsWeakHashMap[weakHash].push(strongHash);
			}
		} else {
			this.contactsWeakHashMap[weakHash] = [strongHash];
		}
	}

	generateHashedMap(contacts) {
		const contactsWeakHashMap = {};
		contacts.forEach((contact) => {

			const weakHash = this.getWeakHash(contact);
			const strongHash = this.getStrongHash(contact);

			if (weakHash in contactsWeakHashMap) {
				if (contactsWeakHashMap[weakHash].indexOf(strongHash) === -1) {
					contactsWeakHashMap[weakHash].push(strongHash);
				}
			} else {
				contactsWeakHashMap[weakHash] = [strongHash];
			}
		});
		return contactsWeakHashMap;

	}

	setHashedMap(contactsWeakHashMap) {
		this.contactsWeakHashMap = contactsWeakHashMap;
	}

	getStrongHash(contact) {
		return crypto.createHash('sha1').update(contact).digest('hex');
	}

	getWeakHash(contact) {
		return crypto.createHash('sha1').update(contact).digest('hex').substr(3, 6);
	}

	queryContacts(contactWeakHashList) {
		let result = [];
		contactWeakHashList.forEach((weakHash) => {
			if (weakHash in this.contactsWeakHashMap) {
				result = result.concat(this.contactsWeakHashMap[weakHash]);
			}
		});
		return result;
	}

	removeContact(contact) {
		const weakHash = this.getWeakHash(contact);
		const strongHash = this.getStrongHash(contact);

		if (weakHash in this.contactsWeakHashMap && this.contactsWeakHashMap[weakHash].indexOf(strongHash) >= 0) {
			this.contactsWeakHashMap[weakHash].splice(this.contactsWeakHashMap[weakHash].indexOf(strongHash), 1);

			if (!this.contactsWeakHashMap[weakHash].length) { delete this.contactsWeakHashMap[weakHash]; }
		}
	}

	reset() {
		this.contactsWeakHashMap = {};
	}
}

module.exports = {
	Provider: ContactsProvider,
};
