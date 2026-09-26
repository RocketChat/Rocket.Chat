import type { ILivechatVisitor, IRoom, UserStatus } from '@rocket.chat/core-typings';
import { LivechatRooms, LivechatVisitors as VisitorsRaw } from '@rocket.chat/models';
import { registerGuest } from '@rocket.chat/omni-core';
import {
	ajv,
	isLivechatVisitorRegisterProps,
	isLivechatVisitorStatusProps,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
// eslint-disable-next-line import-x/named
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { setMultipleVisitorCustomFields } from '../../../lib/omnichannel/custom-fields';
import { notifyGuestStatusChanged, removeContactsByVisitorId } from '../../../lib/omnichannel/guests';
import { livechatLogger } from '../../../lib/omnichannel/logger';
import { saveRoomInfo } from '../../../lib/omnichannel/rooms';
import { settings } from '../../../settings';
import type { ExtractRoutesFromAPI } from '../../ApiClass';
import { API } from '../../api';
import { findGuest, normalizeHttpHeaderData } from './lib/livechat';

const visitorResponseSchema = ajv.compile<{ visitor: ILivechatVisitor; success: true }>({
	type: 'object',
	properties: {
		visitor: { $ref: '#/components/schemas/ILivechatVisitor' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['visitor', 'success'],
	additionalProperties: false,
});

const visitorDeleteResponseSchema = ajv.compile<{ visitor: { _id: string; ts: string }; success: true }>({
	type: 'object',
	properties: {
		visitor: {
			type: 'object',
			properties: {
				_id: { type: 'string' },
				ts: { type: 'string' },
			},
			required: ['_id', 'ts'],
			additionalProperties: false,
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['visitor', 'success'],
	additionalProperties: false,
});

type ProjectedRoom = Pick<IRoom, '_id' | 't'> & Partial<Pick<IRoom, 'name' | 'cl' | 'u' | 'usernames' | 'servedBy'>>;

const visitorRoomsResponseSchema = ajv.compile<{ rooms: ProjectedRoom[]; success: true }>({
	type: 'object',
	properties: {
		rooms: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					name: { type: 'string' },
					t: { type: 'string' },
					cl: { type: 'boolean' },
					u: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							username: { type: 'string' },
						},
						required: ['_id', 'username'],
						additionalProperties: true,
					},
					usernames: {
						type: 'array',
						items: { type: 'string' },
					},
					servedBy: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							username: { type: 'string' },
						},
						required: ['_id'],
						additionalProperties: true,
					},
				},
				required: ['_id', 't'],
				additionalProperties: false,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['rooms', 'success'],
	additionalProperties: false,
});

const visitorStatusResponseSchema = ajv.compile<{ token: string; status: string; success: true }>({
	type: 'object',
	properties: {
		token: { type: 'string' },
		status: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['token', 'status', 'success'],
	additionalProperties: false,
});

const livechatVisitorEndpoints = API.v1
	.post(
		'livechat/visitor',
		{
			authRequired: false,
			rateLimiterOptions: {
				numRequestsAllowed: 5,
				intervalTimeInMS: 60000,
			},
			body: isLivechatVisitorRegisterProps,
			response: {
				200: visitorResponseSchema,
				400: validateBadRequestErrorResponse,
			},
		},
		async function action() {
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
				...(phone && typeof phone === 'string' && { phone: { number: phone } }),
				connectionData: normalizeHttpHeaderData(this.request.headers),
			};

			const visitor = await registerGuest(guest, {
				shouldConsiderIdleAgent: settings.get<boolean>('Livechat_enabled_when_agent_idle'),
				shouldConsiderOfflineAgent: settings.get<boolean>('Livechat_accept_chats_with_no_agents'),
			});
			if (!visitor) {
				throw new Meteor.Error('error-livechat-visitor-registration', 'Error registering visitor', {
					method: 'livechat/visitor',
				});
			}

			const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {}, { userId: this.userId });
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

			const customFieldsToUpdate = customFields.map((field) => ({
				...field,
				overwrite: field.overwrite ?? false,
			}));

			const result = await setMultipleVisitorCustomFields(visitor, customFieldsToUpdate);

			if (!result) {
				return API.v1.success({ visitor });
			}

			const updatedVisitor = await VisitorsRaw.findOneEnabledById(visitor._id);
			if (!updatedVisitor) {
				return API.v1.success({ visitor });
			}

			return API.v1.success({ visitor: updatedVisitor });
		},
	)
	.get(
		'livechat/visitor/:token',
		{
			authRequired: false,
			rateLimiterOptions: {
				numRequestsAllowed: 10,
				intervalTimeInMS: 60000,
			},
			response: {
				200: visitorResponseSchema,
				400: validateBadRequestErrorResponse,
			},
		},
		async function action() {
			const visitor = await VisitorsRaw.getVisitorByToken(this.urlParams.token, {});

			if (!visitor) {
				throw new Meteor.Error('invalid-token', 'Invalid token');
			}

			return API.v1.success({ visitor });
		},
	)
	.delete(
		'livechat/visitor/:token',
		{
			authRequired: false,
			rateLimiterOptions: {
				numRequestsAllowed: 5,
				intervalTimeInMS: 60000,
			},
			response: {
				200: visitorDeleteResponseSchema,
				400: validateBadRequestErrorResponse,
			},
		},
		async function action() {
			const visitor = await VisitorsRaw.getVisitorByToken(this.urlParams.token, {});
			if (!visitor) {
				throw new Meteor.Error('invalid-token', 'Invalid token');
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
				livechatLogger.error({ msg: 'Error removing visitor', err: e });
				throw new Meteor.Error('error-removing-visitor', 'An error occurred while deleting visitor');
			}
		},
	)
	.get(
		'livechat/visitor/:token/room',
		{
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'],
			response: {
				200: visitorRoomsResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
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
	)
	.post(
		'livechat/visitor.status',
		{
			authRequired: false,
			body: isLivechatVisitorStatusProps,
			response: {
				200: visitorStatusResponseSchema,
				400: validateBadRequestErrorResponse,
			},
		},
		async function action() {
			const { token, status } = this.bodyParams;

			const guest = await findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token', 'Invalid token');
			}

			await notifyGuestStatusChanged(token, status as UserStatus);

			return API.v1.success({ token, status });
		},
	);

type LivechatVisitorEndpoints = ExtractRoutesFromAPI<typeof livechatVisitorEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
	interface Endpoints extends LivechatVisitorEndpoints {}
}
