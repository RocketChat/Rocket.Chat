import type { IRoom } from '@rocket.chat/core-typings';
import { LivechatVisitors as VisitorsRaw, LivechatRooms } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';
import { API } from '../../../../api/server';
import { settings } from '../../../../settings/server';
import { setMultipleVisitorCustomFields } from '../../lib/custom-fields';
import { registerGuest, notifyGuestStatusChanged, removeContactsByVisitorId } from '../../lib/guests';
import { saveRoomInfo } from '../../lib/rooms';
import { updateCallStatus } from '../../lib/utils';
import { findGuest, normalizeHttpHeaderData } from '../lib/livechat';
import { livechatLogger } from '../../lib/logger';

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

			const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {}, { userId: this.userId });
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

			if (!Array.isArray(customFields) || !customFields.length) {
				return API.v1.success({ visitor });
			}

			const result = await setMultipleVisitorCustomFields(visitor, customFields);

			if (!result) {
				return API.v1.success({ visitor });
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

		const { _id } = visitor;
		try {
			await removeContactsByVisitorId({ _id });
			return API.v1.success({
				visitor: {
					_id,
					ts: new Date().toISOString(),
				},
			});
		} catch (e) {
			livechatLogger.error(e);
			throw new Meteor.Error('error-removing-visitor', 'An error ocurred while deleting visitor');
		}
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
