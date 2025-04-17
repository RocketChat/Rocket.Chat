import type { IRoom, ILivechatCustomField } from '@rocket.chat/core-typings';
import { LivechatVisitors as VisitorsRaw, LivechatCustomField, LivechatRooms, LivechatContacts } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';
import { API } from '../../../../api/server';
import { settings } from '../../../../settings/server';
import { updateContactsCustomFields, validateRequiredCustomFields } from '../../lib/custom-fields';
import { registerGuest, removeGuest, notifyGuestStatusChanged } from '../../lib/guests';
import { livechatLogger } from '../../lib/logger';
import { saveRoomInfo } from '../../lib/rooms';
import { updateCallStatus } from '../../lib/utils';
import { findGuest, normalizeHttpHeaderData } from '../lib/livechat';

API.v1.addRoute(
	'livechat/visitor',
	{
		rateLimiterOptions: {
			numRequestsAllowed: 5,
			intervalTimeInMS: 60000,
		},
	},
	{
		async post() {
			check(this.bodyParams, {
				visitor: Match.ObjectIncluding({
					token: String,
					name: Match.Maybe(String),
					email: Match.Maybe(String),
					department: Match.Maybe(String),
					phone: Match.Maybe(String),
					username: Match.Maybe(String),
					customFields: Match.Maybe([
						Match.ObjectIncluding({
							key: String,
							value: String,
							overwrite: Boolean,
						}),
					]),
				}),
			});

			const { customFields, id, token, name, email, department, phone, username, connectionData } = this.bodyParams.visitor;

			if (!token?.trim()) {
				throw new Meteor.Error('error-invalid-token', 'Token cannot be empty', { method: 'livechat/visitor' });
			}

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

			const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
			// If it's updating an existing visitor, it must also update the roomInfo
			const rooms = await LivechatRooms.findOpenByVisitorToken(visitor?.token, {}, extraQuery).toArray();
			await Promise.all(
				rooms.map(
					(room: IRoom) =>
						visitor &&
						saveRoomInfo(room, {
							_id: visitor._id,
							name: visitor.name,
							phone: visitor.phone?.[0]?.phoneNumber,
							livechatData: visitor.livechatData as { [k: string]: string },
						}),
				),
			);

			if (customFields && Array.isArray(customFields) && customFields.length > 0) {
				const errors: string[] = [];
				const keys = customFields.map((field) => field.key);

				const livechatCustomFields = await LivechatCustomField.findByScope(
					'visitor',
					{ projection: { _id: 1, required: 1 } },
					false,
				).toArray();
				validateRequiredCustomFields(keys, livechatCustomFields);

				const matchingCustomFields = livechatCustomFields.filter((field: ILivechatCustomField) => keys.includes(field._id));
				const processedKeys = await Promise.all(
					matchingCustomFields.map(async (field: ILivechatCustomField) => {
						const customField = customFields.find((f) => f.key === field._id);
						if (!customField) {
							return;
						}

						const { key, value, overwrite } = customField;
						// TODO: Change this to Bulk update
						if (!(await VisitorsRaw.updateLivechatDataByToken(token, key, value, overwrite))) {
							errors.push(key);
						}

						// TODO deduplicate this code and the one at the function setCustomFields (apps/meteor/app/livechat/server/lib/custom-fields.ts)
						const contacts = await LivechatContacts.findAllByVisitorId(visitor._id).toArray();
						if (contacts.length > 0) {
							await Promise.all(contacts.map((contact) => updateContactsCustomFields(contact, key, value, overwrite)));
						}

						return key;
					}),
				);

				if (processedKeys.length !== keys.length) {
					livechatLogger.warn({
						msg: 'Some custom fields were not processed',
						visitorId: visitor._id,
						missingKeys: keys.filter((key) => !processedKeys.includes(key)),
					});
				}

				if (errors.length > 0) {
					livechatLogger.error({
						msg: 'Error updating custom fields',
						visitorId: visitor._id,
						errors,
					});
					throw new Error('error-updating-custom-fields');
				}

				return API.v1.success({ visitor: await VisitorsRaw.findOneEnabledById(visitor._id) });
			}

			if (!visitor) {
				throw new Meteor.Error('error-saving-visitor', 'An error ocurred while saving visitor');
			}

			return API.v1.success({ visitor });
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
		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
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

		const { _id } = visitor;
		const result = await removeGuest(_id);
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
			const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
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
