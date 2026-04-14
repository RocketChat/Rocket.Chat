import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { LivechatVisitors, Rooms, LivechatDepartment, Users, LivechatContacts } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

export class AppRoomsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	async convertById(roomId) {
		const room = await Rooms.findOneById(roomId);

		return this.convertRoom(room);
	}

	async convertByName(roomName) {
		const room = await Rooms.findOneByName(roomName);

		return this.convertRoom(room);
	}

	convertRoomRaw(room) {
		if (!room) {
			return undefined;
		}

		const mapUserLookup = (user) =>
			user && {
				_id: user._id ?? user.id,
				...(user.username && { username: user.username }),
				...(user.name && { name: user.name }),
			};

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
			visitor: (data) => {
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
			displaySystemMessages: (data) => {
				const { sysMes } = data;
				delete data.sysMes;
				return typeof sysMes === 'undefined' ? true : sysMes;
			},
			type: (data) => {
				const result = this._convertTypeToApp(data.t);
				delete data.t;
				return result;
			},
			creator: (data) => {
				if (!data.u) {
					return undefined;
				}
				const creator = mapUserLookup(data.u);
				delete data.u;
				return creator;
			},
			closedBy: (data) => {
				if (!data.closedBy) {
					return undefined;
				}
				const { closedBy } = data;
				delete data.closedBy;
				return mapUserLookup(closedBy);
			},
			servedBy: (data) => {
				if (!data.servedBy) {
					return undefined;
				}
				const { servedBy } = data;
				delete data.servedBy;
				return mapUserLookup(servedBy);
			},
			responseBy: (data) => {
				if (!data.responseBy) {
					return undefined;
				}
				const { responseBy } = data;
				delete data.responseBy;
				return mapUserLookup(responseBy);
			},
		};

		return transformMappedData(room, map);
	}

	async __getCreator(user) {
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

	async __getVisitor({ visitor: roomVisitor, visitorChannelInfo }) {
		if (!roomVisitor) {
			return;
		}

		const visitor = await LivechatVisitors.findOneEnabledById(roomVisitor.id);
		if (!visitor) {
			return;
		}

		const { lastMessageTs, phone } = visitorChannelInfo;

		return {
			_id: visitor._id,
			username: visitor.username,
			token: visitor.token,
			status: visitor.status || 'online',
			activity: visitor.activity,
			...(lastMessageTs && { lastMessageTs }),
			...(phone && { phone }),
		};
	}

	async __getUserIdAndUsername(userObj) {
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

	async __getRoomCloser(room, v) {
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
	async __getContactId({ contact }) {
		if (!contact?._id) {
			return;
		}
		const contactFromDb = await LivechatContacts.findOneEnabledById(contact._id, { projection: { _id: 1 } });
		return contactFromDb?._id;
	}

	// TODO do we really need this?
	async __getDepartment({ department }) {
		if (!department) {
			return;
		}
		const dept = await LivechatDepartment.findOneById(department.id, { projection: { _id: 1 } });
		return dept?._id;
	}

	async convertAppRoom(room, isPartial = false) {
		if (!room) {
			return undefined;
		}

		const u = await this.__getCreator(room.creator?.id);

		const v = await this.__getVisitor(room);

		const departmentId = await this.__getDepartment(room);

		const servedBy = await this.__getUserIdAndUsername(room.servedBy);

		const closedBy = await this.__getRoomCloser(room, v);

		const contactId = await this.__getContactId(room);

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

		return newRoom;
	}

	async convertRoom(originalRoom) {
		if (!originalRoom) {
			return undefined;
		}

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
			isDefault: (room) => {
				const result = !!room.default;
				delete room.default;
				return result;
			},
			isReadOnly: (room) => {
				const result = !!room.ro;
				delete room.ro;
				return result;
			},
			displaySystemMessages: (room) => {
				const { sysMes } = room;

				if (typeof sysMes === 'undefined') {
					return true;
				}

				delete room.sysMes;
				return sysMes;
			},
			type: (room) => {
				const result = this._convertTypeToApp(room.t);
				delete room.t;
				return result;
			},
			creator: async (room) => {
				const { u } = room;

				if (!u) {
					return undefined;
				}

				delete room.u;

				return this.orch.getConverters().get('users').convertById(u._id);
			},
			visitor: (room) => {
				const { v } = room;

				if (!v) {
					return undefined;
				}

				return this.orch.getConverters().get('visitors').convertById(v._id);
			},
			contact: (room) => {
				const { contactId } = room;

				if (!contactId) {
					return undefined;
				}

				return this.orch.getConverters().get('contacts').convertById(contactId);
			},
			// Note: room.v is not just visitor, it also contains channel related visitor data
			// so we need to pass this data to the converter
			// So suppose you have a contact whom we're contacting using SMS via 2 phone no's,
			// let's call X and Y. Then if the contact sends a message using X phone number,
			// then room.v.phoneNo would be X and correspondingly we'll store the timestamp of
			// the last message from this visitor from X phone no on room.v.lastMessageTs
			visitorChannelInfo: (room) => {
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
			department: async (room) => {
				const { departmentId } = room;

				if (!departmentId) {
					return undefined;
				}

				delete room.departmentId;

				return this.orch.getConverters().get('departments').convertById(departmentId);
			},
			closedBy: async (room) => {
				const { closedBy } = room;

				if (!closedBy) {
					return undefined;
				}

				delete room.closedBy;
				if (originalRoom.closer === 'user') {
					return this.orch.getConverters().get('users').convertById(closedBy._id);
				}

				return this.orch.getConverters().get('visitors').convertById(closedBy._id);
			},
			servedBy: async (room) => {
				const { servedBy } = room;

				if (!servedBy) {
					return undefined;
				}

				delete room.servedBy;

				return this.orch.getConverters().get('users').convertById(servedBy._id);
			},
			responseBy: async (room) => {
				const { responseBy } = room;

				if (!responseBy) {
					return undefined;
				}

				delete room.responseBy;

				return this.orch.getConverters().get('users').convertById(responseBy._id);
			},
			parentRoom: async (room) => {
				const { prid } = room;

				if (!prid) {
					return undefined;
				}

				delete room.prid;

				return this.orch.getConverters().get('rooms').convertById(prid);
			},
		};

		return transformMappedData(originalRoom, map);
	}

	_convertTypeToApp(typeChar) {
		switch (typeChar) {
			case 'c':
				return RoomType.CHANNEL;
			case 'p':
				return RoomType.PRIVATE_GROUP;
			case 'd':
				return RoomType.DIRECT_MESSAGE;
			case 'l':
				return RoomType.LIVE_CHAT;
			default:
				return typeChar;
		}
	}
}
