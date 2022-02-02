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
import { settings } from '../../../app/settings/server';
import { Users } from '../../../app/models/server';
import { ILivechatVisitor } from '../../../definition/ILivechatVisitor';
// import { VoipRoom } from '../../../app/models/server/raw';
import { IVoipRoom, IRoomClosingInfo } from '../../../definition/IRoom';

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

	private normalizeAgent(agentId: string): Record<string, string> | Record<string, boolean> | undefined {
		if (!agentId) {
			return;
		}

		if (!settings.get('Livechat_show_agent_info')) {
			return { hiddenInfo: true };
		}

		const agent = Users.getAgentInfo(agentId);
		const { customFields: agentCustomFields, ...extraData } = agent;

		return Object.assign(extraData);
	}

	private async createVoipRoom(
		rid: string,
		name: string,
		agent: { agentId: string; username: string },
		guest: ILivechatVisitor,
	): Promise<string> {
		const status = 'online';
		const { _id, username, department: departmentId } = guest;
		const newRoomAt = new Date();

		this.logger.debug(`Creating Voip room for visitor ${_id}`);

		const room = Object.assign({
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
				username,
				token: guest.token,
				status,
			},
			servedBy: {
				_id: agent.agentId,
				ts: new Date(),
				username: agent.username,
			},
			cl: false,
			open: true,
			waitingResponse: true,
			// this should be overriden by extraRoomInfo when provided
			// in case it's not provided, we'll use this "default" type
			source: {
				type: 'voip',
				alias: 'unknown',
			},
			queuedAt: newRoomAt,
		});
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
	async findAgent(agentId: string): Promise<any> {
		return this.normalizeAgent(agentId);
	}

	async getNewRoom(
		guest: ILivechatVisitor,
		agent: { agentId: string; username: string },
		rid: string,
		roomInfo: any,
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
			const name = roomInfo?.fname || guest.name || guest.username;
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

	async closeRoom(visitor: ILivechatVisitor, room: IVoipRoom /* , comment: any, options = {}*/): Promise<boolean> {
		this.logger.debug(`Attempting to close room ${room._id}`);
		if (!room || room.t !== 'v' || !room.open) {
			return false;
		}

		// const params = callbacks.run('livechat.beforeCloseRoom', { room, options });
		// const { extraData } = params;

		const now = new Date();
		const { _id: rid } = room;
		const closer = visitor ? ('visitor' as const) : ('user' as const);
		const closeData: IRoomClosingInfo = {
			closedAt: now,
			// TODO: calculate actual call duration
			callDuration: now.getTime() / 1000,
			closer,
			// ...extraData,
		};
		this.logger.debug(`Room ${room._id} was closed at ${closeData.closedAt} (duration ${closeData.callDuration})`);

		/*
		// We should be able to handle nearend and farend call end.
		if (user) {
			this.logger.debug(`Closing by user ${ user._id }`);
			closeData.closer = 'user';
			closeData.closedBy = {
				_id: user._id,
				username: user.username,
			};
		} else
		*/
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
