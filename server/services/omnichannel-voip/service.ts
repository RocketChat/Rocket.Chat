import { Db, FindOneOptions } from 'mongodb';
import _ from 'underscore';

import { IOmnichannelVoipService } from '../../sdk/types/IOmnichannelVoipService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IVoipExtensionBase } from '../../../definition/IVoipExtension';
import { Logger } from '../../lib/logger/Logger';
import { Voip } from '../../sdk';
import { IAgentExtensionMap, IRoomCreationResponse } from '../../../definition/IOmnichannelVoipServiceResult';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { VoipRoomsRaw } from '../../../app/models/server/raw/VoipRooms';
import { IUser } from '../../../definition/IUser';
import { ILivechatVisitor } from '../../../definition/ILivechatVisitor';
import { IVoipRoom, IRoomClosingInfo, OmnichannelSourceType } from '../../../definition/IRoom';

export class OmnichannelVoipService extends ServiceClass implements IOmnichannelVoipService {
	protected name = 'omnichannel-voip';

	private logger: Logger;

	private users: UsersRaw;

	private voipRoom: VoipRoomsRaw;

	constructor(db: Db) {
		super();
		this.users = new UsersRaw(db.collection('users'));
		this.voipRoom = new VoipRoomsRaw(db.collection('rocketchat_room'));
		this.logger = new Logger('OmnichannelVoipService');
	}

	private async createVoipRoom(
		rid: string,
		name: string,
		agent: { agentId: string; username: string },
		guest: ILivechatVisitor,
	): Promise<string> {
		const status = 'online';
		const { _id, department: departmentId } = guest;
		const newRoomAt = new Date();

		this.logger.debug(`Creating Voip room for visitor ${_id}`);

		const room: IVoipRoom = {
			_id: rid,
			msgs: 0,
			usersCount: 1,
			lm: newRoomAt,
			fname: name,
			t: 'v',
			ts: newRoomAt,
			departmentId,
			v: {
				_id,
				token: guest.token,
				status,
			},
			servedBy: {
				_id: agent.agentId,
				ts: newRoomAt,
				username: agent.username,
			},
			open: true,
			waitingResponse: true,
			// this should be overriden by extraRoomInfo when provided
			// in case it's not provided, we'll use this "default" type
			source: {
				type: OmnichannelSourceType.API,
			},
			queuedAt: newRoomAt,
			// We assume room is created when call is started (there could be small delay)
			callStarted: newRoomAt,
			callDuration: 0,
			uids: [],
			autoTranslateLanguage: '',
			metrics: [],
			responseBy: '',
			livechatData: '',
			priorityId: '',
			u: {
				_id: agent.agentId,
				username: agent.username,
			},
			_updatedAt: newRoomAt,
			topic: '',
			tags: '',
			closedAt: '',
		};
		return (await this.voipRoom.insertOne(room)).insertedId;
	}

	private async getAllocatedExtesionAllocationData(projection: Partial<{ [P in keyof IUser]: number }>): Promise<IUser[]> {
		const roles: string[] = ['livechat-agent', 'livechat-manager', 'admin'];
		const options = {
			sort: {
				username: 1,
			},
			projection,
		};

		const query = {
			extension: { $exists: true },
		};
		return this.users.findUsersInRolesWithQuery(roles, query, options).toArray();
	}

	getConfiguration(): any {
		return {};
	}

	async getFreeExtensions(): Promise<string[]> {
		const allExtensions = await Voip.getExtensionList();
		const allocatedExtensions = await this.getAllocatedExtesionAllocationData({
			extension: 1,
		});
		const filtered = _.difference(
			_.pluck(allExtensions.result as IVoipExtensionBase[], 'extension'),
			_.pluck(allocatedExtensions, 'extension'),
		) as string[];
		this.logger.debug({ msg: 'getAvailableExtensions()', found: filtered.length });
		return filtered;
	}

	async getExtensionAllocationDetails(): Promise<IAgentExtensionMap[]> {
		const allocatedExtensions = await this.getAllocatedExtesionAllocationData({
			username: 1,
			roles: 1,
			extension: 1,
		});
		this.logger.debug({ msg: 'getExtensionAllocationDetails() all extension length ', length: allocatedExtensions.length });
		return allocatedExtensions.map((user: any) => ({
			_id: user._id,
			agentName: user.username,
			extension: user.extension,
		}));
	}

	/* Voip calls */
	async getNewRoom(
		guest: ILivechatVisitor,
		agent: { agentId: string; username: string },
		rid: string,
		options: FindOneOptions<IVoipRoom> = {},
	): Promise<IRoomCreationResponse> {
		this.logger.debug(`Attempting to find or create a room for visitor ${guest._id}`);
		let room = await this.voipRoom.findOneById(rid, options);
		let newRoom = false;
		if (room && !room.open) {
			this.logger.debug(`Last room for visitor ${guest._id} closed. Creating new one`);
			room = null;
		}
		if (room == null) {
			const name = guest.name || guest.username;
			const roomId = await this.createVoipRoom(rid, name, agent, guest);
			room = await this.voipRoom.findOneVoipRoomById(roomId);
			newRoom = true;
			this.logger.debug(`Room obtained for visitor ${guest._id} -> ${room?._id}`);
		}
		if (!room) {
			this.logger.debug(`Visitor ${guest._id} trying to access another visitor's room`);
			throw new Error('cannot-access-room');
		}
		return {
			room,
			newRoom,
		};
	}

	async findRoom(token: string, rid: string): Promise<IVoipRoom | null> {
		const projection = {
			t: 1,
			departmentId: 1,
			servedBy: 1,
			open: 1,
			v: 1,
			ts: 1,
		};
		if (!rid) {
			return this.voipRoom.findOneByVisitorToken(token, { projection });
		}
		return this.voipRoom.findOneByIdAndVisitorToken(rid, token, { projection });
	}

	async closeRoom(visitor: ILivechatVisitor, room: IVoipRoom): Promise<boolean> {
		this.logger.debug(`Attempting to close room ${room._id}`);
		if (!room || room.t !== 'v' || !room.open) {
			return false;
		}

		const now = new Date();
		const { _id: rid } = room;
		const closer = visitor ? 'visitor' : 'user';
		const closeData: IRoomClosingInfo = {
			closedAt: now,
			callDuration: now.getTime() / 1000,
			closer,
		};
		this.logger.debug(`Room ${room._id} was closed at ${closeData.closedAt} (duration ${closeData.callDuration})`);
		if (visitor) {
			this.logger.debug(`Closing by visitor ${visitor._id}`);
			closeData.closedBy = {
				_id: visitor._id,
				username: visitor.username,
			};
		}

		this.voipRoom.closeByRoomId(rid, closeData);
		return true;
	}
}
