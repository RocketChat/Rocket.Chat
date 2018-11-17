const service = require('./service.js');
const provider = new service.Provider();

const cursor = Meteor.users.find({ active:true });
cursor.forEach((user) => {
	if ('emails' in user) {
		user.emails.forEach((email) => {
			if (email.verified) {
				provider.addContact(email.address);
			}
		});
	}
});
console.log(provider);

Meteor.methods({
	queryContacts(weakHashes) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'queryContactse',
			});
		}
		return provider.queryContacts(weakHashes);
	},
});
