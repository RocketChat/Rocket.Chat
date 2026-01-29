import type { IAppRoomsConverter, IAppServerOrchestrator, IAppsLivechatRoom, IAppsRoom, IAppsRoomRaw } from '@rocket.chat/apps';
import type { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import type { IOmnichannelRoom, IRoom, IUser } from '@rocket.chat/core-typings';
import { LivechatVisitors, Rooms, LivechatDepartment, Users, LivechatContacts } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

export class AppRoomsConverter implements IAppRoomsConverter {
	constructor(public orch: IAppServerOrchestrator) {}

	async convertById(roomId: IRoom['_id']): Promise<IAppsRoom | undefined> {
		const room = await Rooms.findOneById(roomId);

		return this.convertRoom(room);
	}

	async convertByName(roomName: IRoom['name']): Promise<IAppsRoom | undefined> {
		const room = await Rooms.findOneByName(roomName!);

		return this.convertRoom(room);
	}

	convertRoomRaw(room: IRoom): Promise<IAppsRoomRaw>;

	convertRoomRaw(room: IRoom | undefined | null): Promise<IAppsRoomRaw | undefined>;

	async convertRoomRaw(room: IRoom | undefined | null): Promise<IAppsRoomRaw | undefined> {
		if (!room) {
			return undefined;
		}

		const mapUserLookup = (user: IRoom['u'] & { id?: IUser['_id'] }) =>
			user && {
				_id: user._id ?? user.id,
				username: user.username!,
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
			visitor: (data: IRoom) => {
				const { v } = data as IOmnichannelRoom;
				if (!v) {
					return undefined;
				}

				delete (data as Partial<IOmnichannelRoom>).v;

				const { _id: id, name, ...rest } = v;

				return {
					id,
					name: name!,
					...rest,
				};
			},
			displaySystemMessages: (data: IRoom) => {
				const { sysMes } = data;
				delete data.sysMes;
				return typeof sysMes === 'undefined' ? true : (sysMes as unknown as boolean); // FIXME this conversion is incorrect
			},
			type: (data: IRoom) => {
				const result = this._convertTypeToApp(data.t);
				delete (data as Partial<IRoom>).t;
				return result;
			},
			creator: (data: IRoom) => {
				if (!data.u) {
					return undefined;
				}
				const creator = mapUserLookup(data.u);
				delete (data as Partial<IRoom>).u;
				return creator;
			},
			closedBy: (data: IRoom) => {
				if (!(data as IOmnichannelRoom).closedBy) {
					return undefined;
				}
				const { closedBy } = data as IOmnichannelRoom;
				delete (data as Partial<IOmnichannelRoom>).closedBy;
				return mapUserLookup(closedBy!);
			},
			servedBy: (data: IRoom) => {
				if (!(data as IOmnichannelRoom).servedBy) {
					return undefined;
				}
				const { servedBy } = data as IOmnichannelRoom;
				delete (data as Partial<IOmnichannelRoom>).servedBy;
				return mapUserLookup(servedBy!);
			},
			responseBy: (data: IRoom) => {
				if (!(data as IOmnichannelRoom).responseBy) {
					return undefined;
				}
				const { responseBy } = data as IOmnichannelRoom;
				delete (data as Partial<IOmnichannelRoom>).responseBy;
				return mapUserLookup(responseBy!);
			},
		};

		return transformMappedData(room, map);
	}

	private async __getCreator(user: IUser['_id'] | undefined) {
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

	private async __getVisitor({ visitor: roomVisitor, visitorChannelInfo }: ILivechatRoom) {
		if (!roomVisitor) {
			return;
		}

		const visitor = await LivechatVisitors.findOneEnabledById(roomVisitor.id!);
		if (!visitor) {
			return;
		}

		const { lastMessageTs, phone } = visitorChannelInfo!;

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

	private async __getUserIdAndUsername(userObj: ILivechatRoom['servedBy']) {
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

	private async __getRoomCloser(room: ILivechatRoom, v: Awaited<ReturnType<AppRoomsConverter['__getVisitor']>>) {
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
	private async __getContactId({ contact }: ILivechatRoom) {
		if (!contact?._id) {
			return;
		}
		const contactFromDb = await LivechatContacts.findOneEnabledById(contact._id, { projection: { _id: 1 } });
		return contactFromDb?._id;
	}

	// TODO do we really need this?
	private async __getDepartment({ department }: ILivechatRoom) {
		if (!department) {
			return;
		}
		const dept = await LivechatDepartment.findOneById(department.id, { projection: { _id: 1 } });
		return dept?._id;
	}

	convertAppRoom(room: undefined | null): Promise<undefined>;

	convertAppRoom(room: IAppsRoom): Promise<IRoom>;

	convertAppRoom(room: IAppsRoom, isPartial: boolean): Promise<Partial<IRoom>>;

	convertAppRoom(room: IAppsRoom | undefined | null, isPartial?: boolean): Promise<Partial<IRoom> | undefined>;

	async convertAppRoom(room: IAppsRoom | undefined | null, isPartial = false): Promise<Partial<IRoom> | undefined> {
		if (!room) {
			return undefined;
		}

		const u = await this.__getCreator(room.creator?.id);

		const v = await this.__getVisitor(room as ILivechatRoom);

		const departmentId = await this.__getDepartment(room as ILivechatRoom);

		const servedBy = await this.__getUserIdAndUsername((room as ILivechatRoom).servedBy);

		const closedBy = await this.__getRoomCloser(room as ILivechatRoom, v);

		const contactId = await this.__getContactId(room as ILivechatRoom);

		const newRoom = {
			...(room.id && { _id: room.id }),
			...(typeof room.type !== 'undefined' && { t: room.type }),
			...(typeof room.createdAt !== 'undefined' && { ts: room.createdAt }),
			...(typeof room.messageCount !== 'undefined' && { msgs: room.messageCount || 0 }),
			...(typeof room.updatedAt !== 'undefined' && { _updatedAt: room.updatedAt }),
			...(room.displayName && { fname: room.displayName }),
			...(room.type !== 'd' && room.slugifiedName && { name: room.slugifiedName }),
			...((room as any).members && { members: (room as any).members }),
			...(typeof room.isDefault !== 'undefined' && { default: room.isDefault }),
			...(typeof room.isReadOnly !== 'undefined' && { ro: room.isReadOnly }),
			...(typeof room.displaySystemMessages !== 'undefined' && { sysMes: room.displaySystemMessages }),
			...(u && { u }),
			...(v && { v }),
			...(departmentId && { departmentId }),
			...(servedBy && { servedBy }),
			...(closedBy && { closedBy }),
			...(room.userIds && { uids: room.userIds }),
			...(typeof (room as ILivechatRoom).isWaitingResponse !== 'undefined' && {
				waitingResponse: !!(room as ILivechatRoom).isWaitingResponse,
			}),
			...(typeof (room as ILivechatRoom).isOpen !== 'undefined' && { open: !!(room as ILivechatRoom).isOpen }),
			...((room as ILivechatRoom).closedAt && { closedAt: (room as ILivechatRoom).closedAt }),
			...(room.lastModifiedAt && { lm: room.lastModifiedAt }),
			...(room.customFields && { customFields: room.customFields }),
			...(room.livechatData && { livechatData: room.livechatData }),
			...(typeof room.parentRoom !== 'undefined' && { prid: room.parentRoom.id }),
			...(contactId && { contactId }),
			...((room as { _USERNAMES?: string[] })._USERNAMES && { _USERNAMES: (room as { _USERNAMES?: string[] })._USERNAMES }),
			...((room as ILivechatRoom).source && {
				source: {
					...(room as ILivechatRoom).source,
				},
			}),
		};

		if (!isPartial) {
			Object.assign(newRoom, (room as { _unmappedProperties_?: Record<string, unknown> })._unmappedProperties_);
		}

		return newRoom;
	}

	convertRoom(room: undefined | null): Promise<undefined>;

	convertRoom(room: IRoom): Promise<IAppsRoom | IAppsLivechatRoom>;

	convertRoom(room: IRoom | undefined | null): Promise<IAppsRoom | IAppsLivechatRoom | undefined>;

	async convertRoom(originalRoom: IRoom | undefined | null): Promise<IAppsRoom | IAppsLivechatRoom | undefined> {
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
			isDefault: (room: IRoom) => {
				const result = !!room.default;
				delete room.default;
				return result;
			},
			isReadOnly: (room: IRoom) => {
				const result = !!room.ro;
				delete room.ro;
				return result;
			},
			displaySystemMessages: (room: IRoom) => {
				const { sysMes } = room;

				if (typeof sysMes === 'undefined') {
					return true;
				}

				delete room.sysMes;
				return sysMes;
			},
			type: (room: IRoom) => {
				const result = this._convertTypeToApp(room.t);
				delete (room as Partial<IRoom>).t;
				return result;
			},
			creator: async (room: IRoom) => {
				const { u } = room;

				if (!u) {
					return undefined;
				}

				delete (room as Partial<IRoom>).u;

				return this.orch.getConverters().get('users').convertById(u._id);
			},
			visitor: (room: IRoom) => {
				const { v } = room as IOmnichannelRoom;

				if (!v) {
					return undefined;
				}

				return this.orch.getConverters().get('visitors').convertById(v._id);
			},
			contact: (room: IRoom) => {
				const { contactId } = room as IOmnichannelRoom;

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
			visitorChannelInfo: (room: IRoom) => {
				const { v } = room as IOmnichannelRoom;

				if (!v) {
					return undefined;
				}

				const { lastMessageTs, phone } = v;

				return {
					...(phone && { phone }),
					...(lastMessageTs && { lastMessageTs }),
				};
			},
			department: async (room: IRoom) => {
				const { departmentId } = room as IOmnichannelRoom;

				if (!departmentId) {
					return undefined;
				}

				delete (room as Partial<IOmnichannelRoom>).departmentId;

				return this.orch.getConverters().get('departments').convertById(departmentId);
			},
			closedBy: async (room: IRoom) => {
				const { closedBy } = room as IOmnichannelRoom;

				if (!closedBy) {
					return undefined;
				}

				delete (room as Partial<IOmnichannelRoom>).closedBy;
				if ((originalRoom as IOmnichannelRoom).closer === 'user') {
					return this.orch.getConverters().get('users').convertById(closedBy._id);
				}

				return this.orch.getConverters().get('visitors').convertById(closedBy._id);
			},
			servedBy: async (room: IRoom) => {
				const { servedBy } = room;

				if (!servedBy) {
					return undefined;
				}

				delete room.servedBy;

				return this.orch.getConverters().get('users').convertById(servedBy._id);
			},
			responseBy: async (room: IRoom) => {
				const { responseBy } = room as IOmnichannelRoom;

				if (!responseBy) {
					return undefined;
				}

				delete (room as Partial<IOmnichannelRoom>).responseBy;

				return this.orch.getConverters().get('users').convertById(responseBy._id);
			},
			parentRoom: async (room: IRoom) => {
				const { prid } = room;

				if (!prid) {
					return undefined;
				}

				delete room.prid;

				return this.orch.getConverters().get('rooms').convertById(prid);
			},
		};

		return transformMappedData(originalRoom, map) as unknown as Promise<IAppsRoom | IAppsLivechatRoom>; // FIXME
	}

	private _convertTypeToApp(typeChar: IRoom['t']) {
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
