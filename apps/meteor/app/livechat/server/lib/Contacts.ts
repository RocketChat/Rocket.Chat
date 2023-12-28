import type { ILivechatCustomField, ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatVisitors, Users, LivechatRooms, LivechatCustomField, LivechatInquiry, Rooms, Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { MatchKeysAndValues, OnlyFieldsOfType } from 'mongodb';

import { callbacks } from '../../../../lib/callbacks';
import { trim } from '../../../../lib/utils/stringUtils';
import { i18n } from '../../../utils/lib/i18n';

type RegisterContactProps = {
	_id?: string;
	token: string;
	name: string;
	username?: string;
	email?: string;
	phone?: string;
	customFields?: Record<string, unknown | string>;
	contactManager?: {
		username: string;
	};
};

export const Contacts = {
	async registerContact({
		token,
		name,
		email = '',
		phone,
		username,
		customFields = {},
		contactManager,
	}: RegisterContactProps): Promise<string> {
		check(token, String);

		const visitorEmail = email.trim().toLowerCase();

		if (contactManager?.username) {
			// verify if the user exists with this username and has a livechat-agent role
			const user = await Users.findOneByUsername(contactManager.username, { projection: { roles: 1 } });
			if (!user) {
				throw new Meteor.Error('error-contact-manager-not-found', `No user found with username ${contactManager.username}`);
			}
			if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('livechat-agent')) {
				throw new Meteor.Error('error-invalid-contact-manager', 'The contact manager must have the role "livechat-agent"');
			}
		}

		let contactId;

		const user = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (user) {
			contactId = user._id;
		} else {
			if (!username) {
				username = await LivechatVisitors.getNextVisitorUsername();
			}

			let existingUser = null;

			if (visitorEmail !== '' && (existingUser = await LivechatVisitors.findOneGuestByEmailAddress(visitorEmail))) {
				contactId = existingUser._id;
			} else {
				const userData = {
					username,
					ts: new Date(),
					token,
				};

				contactId = (await LivechatVisitors.insertOne(userData)).insertedId;
			}
		}

		const allowedCF = LivechatCustomField.findByScope<Pick<ILivechatCustomField, '_id' | 'label' | 'regexp' | 'required' | 'visibility'>>(
			'visitor',
			{
				projection: { _id: 1, label: 1, regexp: 1, required: 1 },
			},
			false,
		);

		const livechatData: Record<string, string> = {};

		for await (const cf of allowedCF) {
			if (!customFields.hasOwnProperty(cf._id)) {
				if (cf.required) {
					throw new Error(i18n.t('error-invalid-custom-field-value', { field: cf.label }));
				}
				continue;
			}
			const cfValue: string = trim(customFields[cf._id]);

			if (!cfValue || typeof cfValue !== 'string') {
				if (cf.required) {
					throw new Error(i18n.t('error-invalid-custom-field-value', { field: cf.label }));
				}
				continue;
			}

			if (cf.regexp) {
				const regex = new RegExp(cf.regexp);
				if (!regex.test(cfValue)) {
					throw new Error(i18n.t('error-invalid-custom-field-value', { field: cf.label }));
				}
			}

			livechatData[cf._id] = cfValue;
		}

		const fieldsToRemove = {
			// if field is explicitely set to empty string, remove
			...(phone === '' && { phone: 1 }),
			...(visitorEmail === '' && { visitorEmails: 1 }),
			...(!contactManager?.username && { contactManager: 1 }),
		};

		const updateUser: { $set: MatchKeysAndValues<ILivechatVisitor>; $unset?: OnlyFieldsOfType<ILivechatVisitor> } = {
			$set: {
				token,
				name,
				livechatData,
				// if phone has some value, set
				...(phone && { phone: [{ phoneNumber: phone }] }),
				...(visitorEmail && { visitorEmails: [{ address: visitorEmail }] }),
				...(contactManager?.username && { contactManager: { username: contactManager.username } }),
			},
			...(Object.keys(fieldsToRemove).length && { $unset: fieldsToRemove }),
		};

		await LivechatVisitors.updateOne({ _id: contactId }, updateUser);

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		const rooms: IOmnichannelRoom[] = await LivechatRooms.findByVisitorId(contactId, {}, extraQuery).toArray();

		if (rooms?.length) {
			for await (const room of rooms) {
				const { _id: rid } = room;
				(await Rooms.setFnameById(rid, name)) &&
					(await LivechatInquiry.setNameByRoomId(rid, name)) &&
					(await Subscriptions.updateDisplayNameByRoomId(rid, name));
			}
		}

		return contactId;
	},
};
