import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { Rooms, Users, LivechatVisitors } from '../../../models';

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
			const visitor = LivechatVisitors.findOneById(room.visitor.id);
			v = {
				_id: visitor._id,
				username: visitor.username,
				token: visitor.token,
			};
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

		return {
			_id: room.id,
			fname: room.displayName,
			name: room.slugifiedName,
			t: room.type,
			u,
			v,
			servedBy,
			closedBy,
			members: room.members,
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
		};
	}

	convertRoom(room) {
		if (!room) {
			return undefined;
		}

		let creator;
		if (room.u) {
			creator = this.orch.getConverters().get('users').convertById(room.u._id);
		}

		let visitor;
		if (room.v) {
			visitor = this.orch.getConverters().get('visitors').convertById(room.v._id);
		}

		let servedBy;
		if (room.servedBy) {
			servedBy = this.orch.getConverters().get('users').convertById(room.servedBy._id);
		}

		let responseBy;
		if (room.responseBy) {
			responseBy = this.orch.getConverters().get('users').convertById(room.responseBy._id);
		}

		return {
			id: room._id,
			displayName: room.fname,
			slugifiedName: room.name,
			type: this._convertTypeToApp(room.t),
			creator,
			visitor,
			servedBy,
			responseBy,
			members: room.members,
			isDefault: typeof room.default === 'undefined' ? false : room.default,
			isReadOnly: typeof room.ro === 'undefined' ? false : room.ro,
			displaySystemMessages: typeof room.sysMes === 'undefined' ? true : room.sysMes,
			isWaitingResponse: typeof room.waitingResponse === 'undefined' ? undefined : !!room.waitingResponse,
			isOpen: typeof room.open === 'undefined' ? undefined : !!room.open,
			messageCount: room.msgs,
			createdAt: room.ts,
			updatedAt: room._updatedAt,
			closedAt: room.closedAt,
			lastModifiedAt: room.lm,
			customFields: room.customFields,
		};
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
