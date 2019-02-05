/* globals SyncedCron */

import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import _ from 'underscore';
import { getAvatarUrlFromUsername } from 'meteor/rocketchat:ui';
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

	const phonePattern = /^\+?[1-9]\d{1,14}$/;
	const rfcMailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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
				let phone = dict[phoneFieldArray[phoneFieldArray.length - 1]];
				if (phone && _.isString(phone)) {
					phone = phone.replace(/[^0-9+]|_/g, '');
					if (phonePattern.test(phone)) {
						contacts.push({ d:phone, u:user.username, _id:user._id });
					}
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
				if (email && _.isString(email)) {
					if (rfcMailPattern.test(email)) {
						contacts.push({ d:email, u:user.username, _id:user._id });
					}
				}
			}

			if (useDefaultEmails && 'emails' in user) {
				user.emails.forEach((email) => {
					if (email.verified) {
						contacts.push({ d:email.address, u:user.username, _id:user._id });
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
	getInviteLink() {
		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getInviteLink',
			});
		}

		let link = '';
		try {
			if (!RocketChat.settings.get('Contacts_Dynamic_Link_APIKey')) {
				throw new Meteor.Error('error-invalid-config', 'Contacts_Dynamic_Link_APIKey not configured', {
					method: 'getInviteLink',
				});
			}

			if (!RocketChat.settings.get('Contacts_Dynamic_Link_DomainURIPrefix')) {
				throw new Meteor.Error('error-invalid-config', 'Contacts_Dynamic_Link_DomainURIPrefix not configured', {
					method: 'getInviteLink',
				});
			}

			if (!RocketChat.settings.get('Contacts_Dynamic_Link_AndroidPackageName')) {
				throw new Meteor.Error('error-invalid-config', 'Contacts_Dynamic_Link_AndroidPackageName not configured', {
					method: 'getInviteLink',
				});
			}

			const server = RocketChat.settings.get('Site_Url');

			this.unblock();
			try {
				const result = HTTP.call('POST', `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${ RocketChat.settings.get('Contacts_Dynamic_Link_APIKey') }`, {
					data: {
						dynamicLinkInfo:{
							domainUriPrefix: RocketChat.settings.get('Contacts_Dynamic_Link_DomainURIPrefix'),
							link: `${ server }direct/${ user.username }`,
							androidInfo:{
								androidPackageName:RocketChat.settings.get('Contacts_Dynamic_Link_AndroidPackageName'),
							},
							socialMetaTagInfo: {
								socialTitle: user.username,
								socialDescription: `Chat with ${ user.username } on ${ server }`,
								socialImageLink: `${ server.slice(0, -1) }${ getAvatarUrlFromUsername(user.username) }`,
							},
						},
					},
				});
				link = result.data.shortLink;
			} catch (e) {
				throw new Meteor.Error('dynamic-link-request-failed', 'API request to generate dynamic link failed', {
					method: 'getInviteLink',
				});
			}
		} catch (e) {
			link = RocketChat.settings.get('Site_Url');
		} finally {
			return link;
		}
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
