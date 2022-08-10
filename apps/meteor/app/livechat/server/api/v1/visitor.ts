import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { ILivechatVisitorDTO, IRoom } from '@rocket.chat/core-typings';
import { LivechatVisitors as VisitorsRaw, LivechatCustomField } from '@rocket.chat/models';

import { LivechatRooms } from '../../../../models/server';
import { API } from '../../../../api/server';
import { findGuest, normalizeHttpHeaderData } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';
import { settings } from '../../../../settings/server';

API.v1.addRoute('livechat/visitor', {
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

		const { token, customFields } = this.bodyParams.visitor;
		const guest: ILivechatVisitorDTO = { ...this.bodyParams.visitor };

		if (this.bodyParams.visitor.phone) {
			guest.phone = { number: this.bodyParams.visitor.phone as string };
		}

		guest.connectionData = normalizeHttpHeaderData(this.request.headers);
		const visitorId = await Livechat.registerGuest(guest as any); // TODO: Rewrite Livechat to TS

		let visitor = await VisitorsRaw.findOneById(visitorId, {});
		if (visitor) {
			// If it's updating an existing visitor, it must also update the roomInfo
			const rooms = LivechatRooms.findOpenByVisitorToken(visitor?.token).fetch();
			await Promise.all(rooms.map((room: IRoom) => Livechat.saveRoomInfo(room, visitor)));
		}

		if (customFields && customFields instanceof Array) {
			customFields.forEach((field) => {
				const customField = Promise.await(LivechatCustomField.findOneById(field.key));
				if (!customField) {
					return;
				}
				const { key, value, overwrite } = field;
				// TODO: refactor this to use normal await
				if (customField.scope === 'visitor' && !Promise.await(VisitorsRaw.updateLivechatDataByToken(token, key, value, overwrite))) {
					return API.v1.failure();
				}
			});

			visitor = await VisitorsRaw.findOneById(visitorId, {});
		}

		if (!visitor) {
			throw new Meteor.Error('error-saving-visitor', 'An error ocurred while saving visitor');
		}

		return API.v1.success({ visitor });
	},
});

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

		const rooms = LivechatRooms.findOpenByVisitorToken(this.urlParams.token, {
			fields: {
				name: 1,
				t: 1,
				cl: 1,
				u: 1,
				usernames: 1,
				servedBy: 1,
			},
		}).fetch();

		// if gdpr is enabled, bypass rooms check
		if (rooms?.length && !settings.get('Livechat_Allow_collect_and_store_HTTP_header_informations')) {
			throw new Meteor.Error('visitor-has-open-rooms', 'Cannot remove visitors with opened rooms');
		}

		const { _id } = visitor;
		const result = await Livechat.removeGuest(_id);
		if (!result) {
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
			const rooms = LivechatRooms.findOpenByVisitorToken(this.urlParams.token, {
				fields: {
					name: 1,
					t: 1,
					cl: 1,
					u: 1,
					usernames: 1,
					servedBy: 1,
				},
			}).fetch();
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
		Livechat.updateCallStatus(callId, rid, callStatus, guest);
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

		Livechat.notifyGuestStatusChanged(token, status);

		return API.v1.success({ token, status });
	},
});
