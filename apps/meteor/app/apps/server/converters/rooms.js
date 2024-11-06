import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { LivechatVisitors, Rooms, LivechatDepartment, Users, LivechatContacts, LivechatRooms } from '@rocket.chat/models';

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

	async convertVisitorToRoomV(room, visitorId, contactId) {
		const visitor = await LivechatVisitors.findOneEnabledById(room.visitor.id);

		const { lastMessageTs, phone } = room.visitorChannelInfo;

		return {
			_id: visitor._id,
			username: visitor.username,
			token: visitor.token,
			status: visitor.status || 'online',
			...(lastMessageTs && { lastMessageTs }),
			...(phone && { phone }),
			...(contactId && { contactId }),
		};
	}

	async convertAppVisitorData(room) {
		const contact = room.contact?._id && (await LivechatContacts.findOneById(room.contact._id, { projection: { _id: 1 } }));

		if (room.contact?._id && !contact) {
			throw new Error('error-invalid-contact-id');
		}

		if (room.visitor) {
			return this.convertVisitorToRoomV(room, room.visitor.id, contact?._id);
		}

		// If a livechat room has a contact but no visitor, we try to find the visitor data from elsewhere
		if (!room.contact?._id || room.type !== RoomType.LIVE_CHAT) {
			return;
		}

		// If the contact only has one channel, use the visitor from it
		if (contact.channels?.length === 1 && contact.channels[0].visitorId) {
			return this.convertVisitorToRoomV(room, contact.channels[0].visitorId, contact._id);
		}

		// if the room already exists, we just use the visitor data from it
		const existingRoom = await LivechatRooms.findOneById(room.id);
		if (existingRoom?.v) {
			return {
				...existingRoom.v,
				contactId: contact._id,
			};
		}

		// If the contact has no channels or the room has no source type, there's nothing else we can do, so drop the contactId
		if (!contact.channels?.length || !room.source?.type) {
			return undefined;
		}

		const channel = contact.channels?.find(({ visitor }) => {
			if (visitor.source.type !== room.source.type) {
				return false;
			}

			if (visitor.source.id && room.source.id !== visitor.source.id) {
				return false;
			}

			return true;
		});

		if (!channel) {
			return undefined;
		}

		return this.convertVisitorToRoomV(room, channel.visitorId, contact._id);
	}

	async convertAppRoom(room) {
		if (!room) {
			return undefined;
		}

		let u;
		if (room.creator) {
			const creator = await Users.findOneById(room.creator.id);
			u = {
				_id: creator._id,
				username: creator.username,
				name: creator.name,
			};
		}

		const v = await this.convertAppVisitorData(room);

		let departmentId;
		if (room.department) {
			const department = await LivechatDepartment.findOneById(room.department.id, { projection: { _id: 1 } });
			departmentId = department._id;
		}

		let servedBy;
		if (room.servedBy) {
			const user = await Users.findOneById(room.servedBy.id);
			servedBy = {
				_id: user._id,
				username: user.username,
			};
		}

		let closedBy;
		if (room.closedBy) {
			const user = await Users.findOneById(room.closedBy.id);
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
				const { v } = room;

				if (!v?.contactId) {
					return undefined;
				}

				return this.orch.getConverters().get('contacts').convertById(v.contactId);
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
