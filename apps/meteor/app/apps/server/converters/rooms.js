import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { LivechatVisitors } from '@rocket.chat/models';

import { Rooms, Users, LivechatDepartment } from '../../../models/server';
import { transformMappedData } from '../../lib/misc/transformMappedData';

export class AppRoomsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertById(roomId) {
		const room = Rooms.findOneById(roomId);

		return this.convertRoom(room);
	}

	convertByName(roomName) {
		const room = Rooms.findOneByName(roomName);

		return this.convertRoom(room);
	}

	convertAppRoom(room) {
		if (!room) {
			return undefined;
		}

		let u;
		if (room.creator) {
			const creator = Users.findOneById(room.creator.id);
			u = {
				_id: creator._id,
				username: creator.username,
			};
		}

		let v;
		if (room.visitor) {
			const visitor = Promise.await(LivechatVisitors.findOneById(room.visitor.id));
			v = {
				_id: visitor._id,
				username: visitor.username,
				token: visitor.token,
				status: visitor.status || 'online',
			};
		}

		let departmentId;
		if (room.department) {
			const department = LivechatDepartment.findOneById(room.department.id);
			departmentId = department._id;
		}

		let servedBy;
		if (room.servedBy) {
			const user = Users.findOneById(room.servedBy.id);
			servedBy = {
				_id: user._id,
				username: user.username,
			};
		}

		let closedBy;
		if (room.closedBy) {
			const user = Users.findOneById(room.closedBy.id);
			closedBy = {
				_id: user._id,
				username: user.username,
			};
		}

		const newRoom = {
			...(room.id && { _id: room.id }),
			fname: room.displayName,
			name: room.slugifiedName,
			t: room.type,
			u,
			v,
			departmentId,
			servedBy,
			closedBy,
			members: room.members,
			uids: room.userIds,
			default: typeof room.isDefault === 'undefined' ? false : room.isDefault,
			ro: typeof room.isReadOnly === 'undefined' ? false : room.isReadOnly,
			sysMes: typeof room.displaySystemMessages === 'undefined' ? true : room.displaySystemMessages,
			waitingResponse: typeof room.isWaitingResponse === 'undefined' ? undefined : !!room.isWaitingResponse,
			open: typeof room.isOpen === 'undefined' ? undefined : !!room.isOpen,
			msgs: room.messageCount || 0,
			ts: room.createdAt,
			_updatedAt: room.updatedAt,
			closedAt: room.closedAt,
			lm: room.lastModifiedAt,
			customFields: room.customFields,
			livechatData: room.livechatData,
			prid: typeof room.parentRoom === 'undefined' ? undefined : room.parentRoom.id,
			...(room._USERNAMES && { _USERNAMES: room._USERNAMES }),
			...(room.source && {
				source: {
					...room.source,
				},
			}),
		};

		return Object.assign(newRoom, room._unmappedProperties_);
	}

	convertRoom(room) {
		if (!room) {
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
			creator: (room) => {
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

				delete room.v;

				return this.orch.getConverters().get('visitors').convertById(v._id);
			},
			department: (room) => {
				const { departmentId } = room;

				if (!departmentId) {
					return undefined;
				}

				delete room.departmentId;

				return this.orch.getConverters().get('departments').convertById(departmentId);
			},
			servedBy: (room) => {
				const { servedBy } = room;

				if (!servedBy) {
					return undefined;
				}

				delete room.servedBy;

				return this.orch.getConverters().get('users').convertById(servedBy._id);
			},
			responseBy: (room) => {
				const { responseBy } = room;

				if (!responseBy) {
					return undefined;
				}

				delete room.responseBy;

				return this.orch.getConverters().get('users').convertById(responseBy._id);
			},
			parentRoom: (room) => {
				const { prid } = room;

				if (!prid) {
					return undefined;
				}

				delete room.prid;

				return this.orch.getConverters().get('rooms').convertById(prid);
			},
		};

		return transformMappedData(room, map);
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
