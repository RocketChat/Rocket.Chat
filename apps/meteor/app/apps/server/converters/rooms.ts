import { IDepartment } from '@rocket.chat/apps-engine/definition/livechat';
import { isLivechatRoom } from '@rocket.chat/apps-engine/definition/livechat/ILivechatRoom';
import { RoomType, IRoom as IRoomFromAppsEngine } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import type { IOmnichannelRoom, IRoom } from '@rocket.chat/core-typings';

import { Rooms, Users, LivechatVisitors, LivechatDepartment } from '../../../models/server';
import { transformMappedData } from '../../lib/misc/transformMappedData';
import { AppServerOrchestrator } from '../orchestrator';

type ConverterType<T> = T & {
	_unmappedProperties_: unknown;
};

export class AppRoomsConverter {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	convertById(roomId: string):
		| {
				_unmappedProperties_: unknown;
		  }
		| undefined {
		const room = Rooms.findOneById(roomId);

		return this.convertRoom(room);
	}

	convertByName(roomName: string):
		| {
				_unmappedProperties_: unknown;
		  }
		| undefined {
		const room = Rooms.findOneByName(roomName);

		return this.convertRoom(room);
	}

	convertAppRoom(room: IRoomFromAppsEngine): IRoom | undefined {
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
		let departmentId;

		let servedBy;

		let closedBy;

		// TODO: APPS ENGINE fix typing definitions

		if (isLivechatRoom(room)) {
			if (room.visitor) {
				const visitor = LivechatVisitors.findOneById(room.visitor.id);
				v = {
					_id: visitor._id,
					username: visitor.username,
					token: visitor.token,
					status: visitor.status || 'online',
				};
			}
			if (room.department) {
				const department = LivechatDepartment.findOneById(room.department.id);
				departmentId = department._id;
			}

			if (room.servedBy) {
				const user = Users.findOneById(room.servedBy.id);
				servedBy = {
					_id: user._id,
					username: user.username,
				};
			}
			if ('closedBy' in room) {
				const user = Users.findOneById((room as any).closedBy.id);
				closedBy = {
					_id: user._id,
					username: user.username,
				};
			}
		}

		return {
			...(room.id && { _id: room.id }),
			fname: room.displayName,
			name: room.slugifiedName,
			t: room.type,
			u,
			...('members' in room && { members: (room as any).members }),
			uids: room.userIds,
			default: typeof room.isDefault === 'undefined' ? false : room.isDefault,
			ro: typeof room.isReadOnly === 'undefined' ? false : room.isReadOnly,
			sysMes: typeof room.displaySystemMessages === 'undefined' ? true : room.displaySystemMessages,
			msgs: room.messageCount || 0,
			ts: room.createdAt,
			_updatedAt: room.updatedAt,
			lm: room.lastModifiedAt,
			customFields: room.customFields,
			livechatData: room.livechatData,
			prid: typeof room.parentRoom === 'undefined' ? undefined : room.parentRoom.id,
			...('_USERNAMES' in room && { _USERNAMES: (room as any)._USERNAMES }),
			...('source' in room && {
				source: {
					...(room as any).source,
				},
			}),

			...(isLivechatRoom(room) && {
				waitingResponse: Boolean(room.isWaitingResponse),
				v,
				departmentId,
				servedBy,
				closedBy,
				closedAt: room.closedAt,
				open: typeof room.isOpen === 'undefined' ? undefined : !!room.isOpen,
			}),

			...(room as any)._unmappedProperties_,
		};
	}

	convertRoom(room: IRoom): ConverterType<IRoomFromAppsEngine> | undefined {
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
			isDefault: (room: IRoom): boolean => {
				const result = !!room.default;
				delete room.default;
				return result;
			},
			isReadOnly: (room: IRoom): boolean => {
				const result = !!room.ro;
				delete room.ro;
				return result;
			},
			displaySystemMessages: (room: IRoom): unknown => {
				const { sysMes } = room;

				if (typeof sysMes === 'undefined') {
					return true;
				}

				delete room.sysMes;
				return sysMes;
			},
			type: (room: IRoom): string => {
				const result = this._convertTypeToApp(room.t);
				delete (room as any).t;
				return result;
			},
			creator: (room: IRoom): unknown => {
				const { u } = room;

				if (!u) {
					return undefined;
				}

				delete (room as any).u;

				return this.orch.getConverters()?.get('users').convertById(u._id);
			},
			visitor: (room: IOmnichannelRoom): unknown => {
				const { v } = room;

				if (!v) {
					return undefined;
				}

				delete (room as any).v;

				return this.orch.getConverters()?.get('visitors').convertById(v._id);
			},
			department: (room: IOmnichannelRoom): IDepartment | undefined => {
				const { departmentId } = room;

				if (!departmentId) {
					return undefined;
				}

				delete (room as any).departmentId;

				return this.orch.getConverters()?.get('departments').convertById(departmentId);
			},
			servedBy: (room: IOmnichannelRoom): IUser | undefined => {
				const { servedBy } = room;

				if (!servedBy) {
					return undefined;
				}

				delete (room as any).servedBy;

				return this.orch.getConverters()?.get('users').convertById(servedBy._id);
			},
			responseBy: (room: IOmnichannelRoom): IUser | undefined => {
				const { responseBy } = room;

				if (!responseBy) {
					return undefined;
				}

				delete (room as any).responseBy;

				return this.orch.getConverters()?.get('users').convertById(responseBy._id);
			},
			parentRoom: (room: IRoom): IRoomFromAppsEngine | undefined => {
				const { prid } = room;

				if (!prid) {
					return undefined;
				}

				delete (room as any).prid;

				return this.orch.getConverters()?.get('rooms').convertById(prid);
			},
		};

		return transformMappedData(room, map) as ConverterType<IRoomFromAppsEngine>;
	}

	_convertTypeToApp(typeChar: string): string {
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
