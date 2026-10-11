import type { IAppServerOrchestrator, IAppsRoom, IAppsLivechatRoom, IAppsRoomRaw } from '@rocket.chat/apps';
import { secureFieldsMapper } from '@rocket.chat/apps/dist/lib/SecureFields';
import type { IRoom } from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatDepartment, Users, LivechatContacts } from '@rocket.chat/models';
import * as z from 'zod';

import { RoomTypeCodec } from './enums';
import { mappedDecodeAsync } from './mappedData';

// The stored room documents carry many optional/livechat-only fields that are not part of the base
// `IRoom` union, so the transform inputs are treated as loose records (as the legacy converter did).
type RoomData = Record<string, any>;

const mapUserLookup = (user: any) =>
	user && {
		_id: user._id ?? user.id,
		...(user.username && { username: user.username }),
		...(user.name && { name: user.name }),
	};

/**
 * Rocket.Chat -> Apps-Engine "raw" room transform (no cross-converter resolution). Mirrors the
 * legacy `convertRoomRaw`.
 */
export async function decodeRoomRaw(room: IRoom): Promise<IAppsRoomRaw> {
	const map = {
		id: '_id',
		displayName: 'fname',
		slugifiedName: 'name',
		members: 'members',
		userIds: 'uids',
		usernames: 'usernames',
		messageCount: 'msgs',
		createdAt: 'ts',
		updatedAt: '_updatedAt',
		closedAt: 'closedAt',
		lastModifiedAt: 'lm',
		customFields: 'customFields',
		livechatData: 'livechatData',
		isWaitingResponse: 'waitingResponse',
		isOpen: 'open',
		description: 'description',
		source: 'source',
		closer: 'closer',
		teamId: 'teamId',
		isTeamMain: 'teamMain',
		isDefault: 'default',
		isReadOnly: 'ro',
		contactId: 'contactId',
		departmentId: 'departmentId',
		parentRoomId: 'prid',
		isFederated: 'federated',
		federation: 'federation',
		visitor: (data: RoomData) => {
			const { v } = data;
			if (!v) {
				return undefined;
			}

			delete data.v;

			const { _id: id, ...rest } = v;

			return {
				id,
				...rest,
			};
		},
		displaySystemMessages: (data: RoomData) => {
			const { sysMes } = data;
			delete data.sysMes;
			return typeof sysMes === 'undefined' ? true : sysMes;
		},
		type: (data: RoomData) => {
			const result = z.decode(RoomTypeCodec, data.t);
			delete data.t;
			return result;
		},
		creator: (data: RoomData) => {
			if (!data.u) {
				return undefined;
			}
			const creator = mapUserLookup(data.u);
			delete data.u;
			return creator;
		},
		closedBy: (data: RoomData) => {
			if (!data.closedBy) {
				return undefined;
			}
			const { closedBy } = data;
			delete data.closedBy;
			return mapUserLookup(closedBy);
		},
		servedBy: (data: RoomData) => {
			if (!data.servedBy) {
				return undefined;
			}
			const { servedBy } = data;
			delete data.servedBy;
			return mapUserLookup(servedBy);
		},
		responseBy: (data: RoomData) => {
			if (!data.responseBy) {
				return undefined;
			}
			const { responseBy } = data;
			delete data.responseBy;
			return mapUserLookup(responseBy);
		},
	};

	return mappedDecodeAsync<IAppsRoomRaw>(room, map);
}

async function getCreator(user: string | undefined) {
	if (!user) {
		return;
	}

	const creator = await Users.findOneById(user, { projection: { _id: 1, username: 1, name: 1 } });
	if (!creator) {
		return;
	}

	return {
		_id: creator._id,
		username: creator.username,
		name: creator.name,
	};
}

async function getVisitor({ visitor: roomVisitor, visitorChannelInfo }: any) {
	if (!roomVisitor) {
		return;
	}

	const visitor = await LivechatVisitors.findOneEnabledById(roomVisitor.id);
	if (!visitor) {
		return;
	}

	const { lastMessageTs, phone } = visitorChannelInfo || {};

	return {
		_id: visitor._id,
		username: visitor.username,
		token: visitor.token,
		status: visitor.status || 'online',
		...(visitor.activity?.length && { activity: visitor.activity }),
		...(lastMessageTs && { lastMessageTs }),
		...(phone && { phone }),
	};
}

async function getUserIdAndUsername(userObj: any) {
	if (!userObj?.id) {
		return;
	}

	const user = await Users.findOneById(userObj.id, { projection: { _id: 1, username: 1 } });
	if (!user) {
		return;
	}

	return {
		_id: user._id,
		username: user.username,
	};
}

async function getRoomCloser(room: any, v: any) {
	if (!room.closedBy) {
		return;
	}

	if (room.closer === 'user') {
		const user = await Users.findOneById(room.closedBy.id, { projection: { _id: 1, username: 1 } });
		if (!user) {
			return;
		}

		return {
			_id: user._id,
			username: user.username,
		};
	}

	if (room.closer === 'visitor' && v) {
		return {
			_id: v._id,
			username: v.username,
		};
	}
}

// TODO do we really need this?
async function getContactId({ contact }: any) {
	if (!contact?._id) {
		return;
	}
	const contactFromDb = await LivechatContacts.findOneEnabledById(contact._id, { projection: { _id: 1 } });
	return contactFromDb?._id;
}

// TODO do we really need this?
async function getDepartment({ department }: any) {
	if (!department) {
		return;
	}
	const dept = await LivechatDepartment.findOneById(department.id, { projection: { _id: 1 } });
	return dept?._id;
}

/**
 * Apps-Engine -> Rocket.Chat room transform. Mirrors the legacy `convertAppRoom`, including the
 * `isPartial` behaviour (skip `_unmappedProperties_` merge). Cross-converter independent — it reads
 * the models directly.
 */
export async function appRoomToRocketChat(room: any, isPartial = false): Promise<Partial<IRoom>> {
	const u = await getCreator(room.creator?.id);

	const v = await getVisitor(room);

	const departmentId = await getDepartment(room);

	const servedBy = await getUserIdAndUsername(room.servedBy);

	const closedBy = await getRoomCloser(room, v);

	const contactId = await getContactId(room);

	const newRoom = {
		...(room.id && { _id: room.id }),
		...(typeof room.type !== 'undefined' && { t: room.type }),
		...(typeof room.createdAt !== 'undefined' && { ts: room.createdAt }),
		...(typeof room.messageCount !== 'undefined' && { msgs: room.messageCount || 0 }),
		...(typeof room.updatedAt !== 'undefined' && { _updatedAt: room.updatedAt }),
		...(room.displayName && { fname: room.displayName }),
		...(room.type !== 'd' && room.slugifiedName && { name: room.slugifiedName }),
		...(room.members && { members: room.members }),
		...(typeof room.isDefault !== 'undefined' && { default: room.isDefault }),
		...(typeof room.isReadOnly !== 'undefined' && { ro: room.isReadOnly }),
		...(typeof room.displaySystemMessages !== 'undefined' && { sysMes: room.displaySystemMessages }),
		...(u && { u }),
		...(v && { v }),
		...(departmentId && { departmentId }),
		...(servedBy && { servedBy }),
		...(closedBy && { closedBy }),
		...(room.userIds && { uids: room.userIds }),
		...(typeof room.isWaitingResponse !== 'undefined' && { waitingResponse: !!room.isWaitingResponse }),
		...(typeof room.isOpen !== 'undefined' && { open: !!room.isOpen }),
		...(room.closedAt && { closedAt: room.closedAt }),
		...(room.lastModifiedAt && { lm: room.lastModifiedAt }),
		...(room.customFields && { customFields: room.customFields }),
		...(room.livechatData && { livechatData: room.livechatData }),
		...(typeof room.isFederated !== 'undefined' && { federated: room.isFederated }),
		...(typeof room.federation !== 'undefined' && { federation: room.federation }),
		...(typeof room.parentRoom !== 'undefined' && { prid: room.parentRoom.id }),
		...(contactId && { contactId }),
		...(room._USERNAMES && { _USERNAMES: room._USERNAMES }),
		...(room.source && {
			source: {
				...room.source,
			},
		}),
	};

	if (!isPartial) {
		Object.assign(newRoom, room._unmappedProperties_);
	}

	return newRoom as unknown as Partial<IRoom>;
}

/**
 * Rocket.Chat `IRoom` <-> Apps-Engine room. Cross-converter dependent, so built via a factory closing
 * over the orchestrator. `decode` mirrors `convertRoom` (resolves creator/visitor/contact/department/
 * closedBy/servedBy/responseBy/parentRoom through their converters, plus secure fields). `encode`
 * mirrors the non-partial `convertAppRoom`; the class handles the `isPartial` variant.
 */
export function createRoomCodec(orch: IAppServerOrchestrator) {
	return z.codec(z.custom<IRoom>(), z.custom<IAppsRoom | IAppsLivechatRoom>(), {
		decode: async (originalRoom): Promise<IAppsRoom | IAppsLivechatRoom> => {
			const map = {
				id: '_id',
				displayName: 'fname',
				slugifiedName: 'name',
				members: 'members',
				userIds: 'uids',
				messageCount: 'msgs',
				createdAt: 'ts',
				updatedAt: '_updatedAt',
				closedAt: 'closedAt',
				lastModifiedAt: 'lm',
				customFields: 'customFields',
				livechatData: 'livechatData',
				isWaitingResponse: 'waitingResponse',
				isOpen: 'open',
				_USERNAMES: '_USERNAMES',
				description: 'description',
				source: 'source',
				closer: 'closer',
				teamId: 'teamId',
				isTeamMain: 'teamMain',
				isFederated: 'federated',
				federation: 'federation',
				isDefault: (room: RoomData) => {
					const result = !!room.default;
					delete room.default;
					return result;
				},
				isReadOnly: (room: RoomData) => {
					const result = !!room.ro;
					delete room.ro;
					return result;
				},
				displaySystemMessages: (room: RoomData) => {
					const { sysMes } = room;

					if (typeof sysMes === 'undefined') {
						return true;
					}

					delete room.sysMes;
					return sysMes;
				},
				type: (room: RoomData) => {
					const result = z.decode(RoomTypeCodec, room.t);
					delete room.t;
					return result;
				},
				creator: async (room: RoomData) => {
					const { u } = room;

					if (!u) {
						return undefined;
					}

					delete room.u;

					return orch.getConverters().get('users').convertById(u._id);
				},
				visitor: (room: RoomData) => {
					const { v } = room;

					if (!v) {
						return undefined;
					}

					return orch.getConverters().get('visitors').convertById(v._id);
				},
				contact: (room: RoomData) => {
					const { contactId } = room;

					if (!contactId) {
						return undefined;
					}

					return orch.getConverters().get('contacts').convertById(contactId);
				},
				// Note: room.v is not just visitor, it also contains channel related visitor data
				// so we need to pass this data to the converter
				// So suppose you have a contact whom we're contacting using SMS via 2 phone no's,
				// let's call X and Y. Then if the contact sends a message using X phone number,
				// then room.v.phoneNo would be X and correspondingly we'll store the timestamp of
				// the last message from this visitor from X phone no on room.v.lastMessageTs
				visitorChannelInfo: (room: RoomData) => {
					const { v } = room;

					if (!v) {
						return undefined;
					}

					const { lastMessageTs, phone } = v;

					return {
						...(phone && { phone }),
						...(lastMessageTs && { lastMessageTs }),
					};
				},
				department: async (room: RoomData) => {
					const { departmentId } = room;

					if (!departmentId) {
						return undefined;
					}

					delete room.departmentId;

					return orch.getConverters().get('departments').convertById(departmentId);
				},
				closedBy: async (room: RoomData) => {
					const { closedBy } = room;

					if (!closedBy) {
						return undefined;
					}

					delete room.closedBy;
					if ((originalRoom as RoomData).closer === 'user') {
						return orch.getConverters().get('users').convertById(closedBy._id);
					}

					return orch.getConverters().get('visitors').convertById(closedBy._id);
				},
				servedBy: async (room: RoomData) => {
					const { servedBy } = room;

					if (!servedBy) {
						return undefined;
					}

					delete room.servedBy;

					return orch.getConverters().get('users').convertById(servedBy._id);
				},
				responseBy: async (room: RoomData) => {
					const { responseBy } = room;

					if (!responseBy) {
						return undefined;
					}

					delete room.responseBy;

					return orch.getConverters().get('users').convertById(responseBy._id);
				},
				parentRoom: async (room: RoomData) => {
					const { prid } = room;

					if (!prid) {
						return undefined;
					}

					delete room.prid;

					return orch.getConverters().get('rooms').convertById(prid);
				},
				...secureFieldsMapper((room: RoomData) => {
					if (!room.abacAttributes) {
						return undefined;
					}

					const value = [
						{
							permission: 'abac.read',
							name: 'abacAttributes',
							value: room.abacAttributes,
						},
					];

					delete room.abacAttributes;
					return value;
				}),
			};

			return mappedDecodeAsync<IAppsRoom | IAppsLivechatRoom>(originalRoom, map);
		},
		encode: (room): Promise<IRoom> => appRoomToRocketChat(room, false) as unknown as Promise<IRoom>,
	});
}
