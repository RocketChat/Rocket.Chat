import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { LivechatVisitors as VisitorsRaw, LivechatCustomField, LivechatRooms, LivechatContacts } from '@rocket.chat/models';
import { isPOSTLivechatVisitor } from '@rocket.chat/rest-typings';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';
import { API } from '../../../../api/server';
import { settings } from '../../../../settings/server';
import { validateRequiredCustomFields } from '../../lib/custom-fields';
import { registerGuest, removeGuest, notifyGuestStatusChanged } from '../../lib/guests';
import { livechatLogger } from '../../lib/logger';
import { updateRoomsInfoFromVisitorUpdate } from '../../lib/rooms';
import { updateCallStatus } from '../../lib/utils';
import { findGuest, normalizeHttpHeaderData } from '../lib/livechat';

API.v1.addRoute(
	'livechat/visitor',
	{
		rateLimiterOptions: {
			numRequestsAllowed: 5,
			intervalTimeInMS: 60000,
		},
		validateParams: isPOSTLivechatVisitor,
	},
	{
		async post() {
			const { customFields, id, token, name, email, department, phone, username, connectionData } = this.bodyParams.visitor;

			const guest = {
				token,
				...(id && { id }),
				...(name && { name }),
				...(email && { email }),
				...(department && { department }),
				...(username && { username }),
				...(connectionData && { connectionData }),
				...(phone && typeof phone === 'string' && { phone: { number: phone as string } }),
				connectionData: normalizeHttpHeaderData(this.request.headers),
			};

			const visitor = await registerGuest(guest);
			if (!visitor) {
				throw new Meteor.Error('error-livechat-visitor-registration', 'Error registering visitor', {
					method: 'livechat/visitor',
				});
			}

			// If it's updating an existing visitor, it must also update the roomInfo
			const rooms = await LivechatRooms.findOpenByVisitorToken(visitor?.token, { projection: { _id: 1 } }).toArray();
			await updateRoomsInfoFromVisitorUpdate(
				rooms.map((room) => room._id),
				{
					_id: visitor._id,
					name: visitor.name,
				},
			);

			if (!Array.isArray(customFields) || !customFields.length) {
				return API.v1.success({ visitor });
			}

			const keys = customFields.map((field) => field.key);

			const livechatCustomFields = await LivechatCustomField.findByScope(
				'visitor',
				{ projection: { _id: 1, required: 1 } },
				false,
			).toArray();
			validateRequiredCustomFields(keys, livechatCustomFields);

			const matchingCustomFields = livechatCustomFields.filter((field: ILivechatCustomField) => keys.includes(field._id));
			const validCustomFields = customFields.filter((cf) => matchingCustomFields.find((mcf) => cf.key === mcf._id));
			if (!validCustomFields.length) {
				return API.v1.success({ visitor });
			}

			const visitorCustomFieldsToUpdate = validCustomFields.reduce(
				(prev, curr) => {
					if (curr.overwrite) {
						prev[`livechatData.${curr.key}`] = curr.value;
						return prev;
					}

					if (!visitor?.livechatData?.[curr.key]) {
						prev[`livechatData.${curr.key}`] = curr.value;
					}

					return prev;
				},
				{} as Record<string, string>,
			);

			if (Object.keys(visitorCustomFieldsToUpdate).length) {
				await VisitorsRaw.updateAllLivechatDataByToken(visitor.token, visitorCustomFieldsToUpdate);
			}

			const contacts = await LivechatContacts.findAllByVisitorId(visitor._id).toArray();
			if (contacts.length) {
				await Promise.all(
					contacts.map((contact) => {
						const contactCustomFieldsToUpdate = validCustomFields.reduce(
							(prev, curr) => {
								if (curr.overwrite || !contact?.customFields?.[curr.key]) {
									prev.customFields ??= {};
									prev.customFields[curr.key] = curr.value;
									return prev;
								}
								prev.conflictingFields ??= [];
								prev.conflictingFields.push({ field: `customFields.${curr.key}`, value: curr.value });
								return prev;
							},
							{} as {
								customFields?: Record<string, string>;
								conflictingFields?: Array<{ field: `customFields.${string}`; value: string }>;
							},
						);

						if (Object.keys(contactCustomFieldsToUpdate).length) {
							// TODO: model method
							return LivechatContacts.updateById(contact._id, { $set: contactCustomFieldsToUpdate });
						}

						return null;
					}),
				);
			}

			if (validCustomFields.length !== keys.length) {
				livechatLogger.warn({
					msg: 'Some custom fields were not processed',
					visitorId: visitor._id,
					missingKeys: keys.filter((key) => !validCustomFields.map((v) => v.key).includes(key)),
				});
			}

			return API.v1.success({ visitor: await VisitorsRaw.findOneEnabledById(visitor._id) });
		},
	},
);

API.v1.addRoute('livechat/visitor/:token', {
	async get() {
		check(this.urlParams, {
			token: String,
		});

		const visitor = await VisitorsRaw.getVisitorByToken(this.urlParams.token, {});

		if (!visitor) {
			throw new Meteor.Error('invalid-token');
		}

		return API.v1.success({ visitor });
	},
	async delete() {
		check(this.urlParams, {
			token: String,
		});

		const visitor = await VisitorsRaw.getVisitorByToken(this.urlParams.token, {});
		if (!visitor) {
			throw new Meteor.Error('invalid-token');
		}
		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {}, { userId: this.userId });
		const rooms = await LivechatRooms.findOpenByVisitorToken(
			this.urlParams.token,
			{
				projection: {
					name: 1,
					t: 1,
					cl: 1,
					u: 1,
					usernames: 1,
					servedBy: 1,
				},
			},
			extraQuery,
		).toArray();

		// if gdpr is enabled, bypass rooms check
		if (rooms?.length && !settings.get('Livechat_Allow_collect_and_store_HTTP_header_informations')) {
			throw new Meteor.Error('visitor-has-open-rooms', 'Cannot remove visitors with opened rooms');
		}

		const { _id, token } = visitor;
		const result = await removeGuest({ _id, token });
		if (!result.modifiedCount) {
			throw new Meteor.Error('error-removing-visitor', 'An error ocurred while deleting visitor');
		}

		return API.v1.success({
			visitor: {
				_id,
				ts: new Date().toISOString(),
			},
		});
	},
});

API.v1.addRoute(
	'livechat/visitor/:token/room',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {}, { userId: this.userId });
			const rooms = await LivechatRooms.findOpenByVisitorToken(
				this.urlParams.token,
				{
					projection: {
						name: 1,
						t: 1,
						cl: 1,
						u: 1,
						usernames: 1,
						servedBy: 1,
					},
				},
				extraQuery,
			).toArray();
			return API.v1.success({ rooms });
		},
	},
);

API.v1.addRoute('livechat/visitor.callStatus', {
	async post() {
		check(this.bodyParams, {
			token: String,
			callStatus: String,
			rid: String,
			callId: String,
		});

		const { token, callStatus, rid, callId } = this.bodyParams;
		const guest = await findGuest(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}
		await updateCallStatus(callId, rid, callStatus, guest);
		return API.v1.success({ token, callStatus });
	},
});

API.v1.addRoute('livechat/visitor.status', {
	async post() {
		check(this.bodyParams, {
			token: String,
			status: String,
		});

		const { token, status } = this.bodyParams;

		const guest = await findGuest(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		await notifyGuestStatusChanged(token, status);

		return API.v1.success({ token, status });
	},
});
