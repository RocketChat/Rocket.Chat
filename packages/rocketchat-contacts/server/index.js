/* globals SyncedCron */

import { Meteor } from 'meteor/meteor';
const service = require('./service.js');
const provider = new service.Provider();

function refreshContactsHashMap() {
	let phoneFieldName = '';
	RocketChat.settings.get('Contacts_Phone_Custom_Field_Name', function(name, fieldName) {
		phoneFieldName = fieldName;
	});

	let emailFieldName = '';
	RocketChat.settings.get('Contacts_Email_Custom_Field_Name', function(name, fieldName) {
		emailFieldName = fieldName;
	});

	let useDefaultEmails = false;
	RocketChat.settings.get('Contacts_Use_Default_Emails', function(name, fieldName) {
		useDefaultEmails = fieldName;
	});

	const contacts = [];
	const cursor = Meteor.users.find({ active:true });

	let phoneFieldArray = [];
	if (phoneFieldName) {
		phoneFieldArray = phoneFieldName.split(',');
	}

	let emailFieldArray = [];
	if (emailFieldName) {
		emailFieldArray = emailFieldName.split(',');
	}

	let dict;
	cursor.forEach((user) => {
		const discoverable = RocketChat.getUserPreference(user, 'isPublicAccount');
		if (discoverable !== false) {
			if (phoneFieldArray.length > 0) {
				dict = user;
				for (let i = 0;i < phoneFieldArray.length - 1;i++) {
					if (phoneFieldArray[i] in dict) {
						dict = dict[phoneFieldArray[i]];
					}
				}
				const phone = dict[phoneFieldArray[phoneFieldArray.length - 1]];
				if (phone) {
					contacts.push({ d:phone, u:user.username });
				}

			}

			if (emailFieldArray.length > 0) {
				dict = user;
				for (let i = 0;i < emailFieldArray.length - 1;i++) {
					if (emailFieldArray[i] in dict) {
						dict = dict[emailFieldArray[i]];
					}
				}
				const email = dict[emailFieldArray[emailFieldArray.length - 1]];
				if (email) {
					contacts.push({ d:email, u:user.username });
				}
			}

			if (useDefaultEmails && 'emails' in user) {
				user.emails.forEach((email) => {
					if (email.verified) {
						contacts.push({ d:email.address, u:user.username });
					}
				});
			}
		}
	});
	provider.setHashedMap(provider.generateHashedMap(contacts));
}

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

const jobName = 'Refresh_Contacts_Hashes';

Meteor.startup(() => {
	Meteor.defer(() => {
		refreshContactsHashMap();

		RocketChat.settings.get('Contacts_Background_Sync_Interval', function(name, processingFrequency) {
			SyncedCron.remove(jobName);
			SyncedCron.add({
				name: jobName,
				schedule: (parser) => parser.cron(`*/${ processingFrequency } * * * *`),
				job: refreshContactsHashMap,
			});
		});
	});
});
