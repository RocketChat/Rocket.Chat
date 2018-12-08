/* globals SyncedCron */

import { Meteor } from 'meteor/meteor';
const service = require('./service.js');
const provider = new service.Provider();

function refreshContactsHashMap() {
	let phoneFieldName = '';
	RocketChat.settings.get('Contacts_Phone_Custom_Field_Name', function(name, fieldName) {
		phoneFieldName = fieldName;
	});

	const contacts = [];
	const cursor = Meteor.users.find({ active:true });

	if (phoneFieldName) {
		cursor.forEach((user) => {
			const phoneFieldArray = phoneFieldName.split(',');
			let dict = user;

			for (let i = 0;i < phoneFieldArray.length - 1;i++) {
				if (phoneFieldArray[i] in dict) {
					dict = dict[phoneFieldArray[i]];
				}
			}

			const phone = dict[phoneFieldArray[phoneFieldArray.length - 1]];

			if (phone) {
				contacts.push(phone);
			}

			if ('emails' in user) {
				user.emails.forEach((email) => {
					if (email.verified) {
						contacts.push(email.address);
					}
				});
			}
		});
	} else {
		cursor.forEach((user) => {
			if ('emails' in user) {
				user.emails.forEach((email) => {
					if (email.verified) {
						contacts.push(email.address);
					}
				});
			}
		});
	}
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
