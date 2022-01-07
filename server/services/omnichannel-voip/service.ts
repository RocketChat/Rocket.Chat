import { Db } from 'mongodb';
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import _ from 'underscore';

import { IOmnichannelVoipService } from '../../sdk/types/IOmnichannelVoipService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IVoipExtensionBase } from '../../../definition/IVoipExtension';
import { Logger } from '../../lib/logger/Logger';
import { Voip } from '../../sdk';
import { IOmnichannelVoipServiceResult } from '../../../definition/IOmnichannelVoipServiceResult';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { VoipRoomsRaw } from '../../../app/models/server/raw/VoipRooms';
import { IUser } from '../../../definition/IUser';
import { settings } from '../../../app/settings/server';
import { Users } from '../../../app/models/server';
import { ILivechatVisitor } from '../../../definition/ILivechatVisitor';
// import { VoipRoom } from '../../../app/models/server/raw';
import { IVoipRoom } from '../../../definition/IRoom';
import { callbacks } from '../../../app/callbacks/server';

export class OmnichannelVoipService extends ServiceClass implements IOmnichannelVoipService {
	protected name = 'omnichannel-voip';

	private logger: Logger;

	private users: UsersRaw;

	private voipRoom: VoipRoomsRaw;

	constructor(db: Db) {
		super();
		this.users = new UsersRaw(db.collection('users'));
		this.voipRoom = new VoipRoomsRaw(db.collection('room'));
		this.logger = new Logger('OmnichannelVoipService');
	}


	private normalizeAgent(agentId: string): any {
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

	private async createVoipRoom(rid: string, name: string, agent: any, guest: ILivechatVisitor): Promise<any> {
		check(rid, String);
		check(name, String);
		check(guest, Match.ObjectIncluding({
			_id: String,
			username: String,
			status: Match.Maybe(String),
			department: Match.Maybe(String),
		}));

		const { _id, username, department: departmentId, status = 'online' } = guest;
		const newRoomAt = new Date();

		this.logger.debug(`Creating livechat room for visitor ${ _id }`);

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
		const result = await this.voipRoom.insertOne(room);

		const roomId = await result.insertedId;
		return roomId;
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

	async getFreeExtensions(): Promise<IOmnichannelVoipServiceResult> {
		const allExtensions = await Voip.getExtensionList();
		const allocatedExtensions = await this.getAllocatedExtesionAllocationData({
			extension: 1,
		});
		const filtered = _.difference(_.pluck(allExtensions.result as IVoipExtensionBase [], 'extension'),
			_.pluck(allocatedExtensions, 'extension')) as string[];
		this.logger.debug({ msg: 'getAvailableExtensions()', found: filtered.length });
		return {
			result: filtered,
		};
	}

	async getExtensionAllocationDetails(): Promise<IOmnichannelVoipServiceResult> {
		const allocatedExtensions = await this.getAllocatedExtesionAllocationData({
			username: 1,
			roles: 1,
			extension: 1,
		});
		this.logger.debug({ msg: 'getExtensionAllocationDetails() all extension length ',
			length: allocatedExtensions.length,
		});
		return {
			result: allocatedExtensions.map((user: any) => ({
				_id: user._id,
				agentName: user.username,
				extension: user.extension,
			})),
		};
	}

	/* Voip calls */
	async findAgent(agentId: string): Promise<any> {
		return this.normalizeAgent(agentId);
	}

	async getNewRoom(guest: ILivechatVisitor, agent: any, rid: string, roomInfo: any): Promise<IOmnichannelVoipServiceResult> {
		this.logger.debug(`Attempting to find or create a room for visitor ${ guest._id }`);
		const message = {
			_id: Random.id(),
			rid,
			msg: '',
			token: guest.token,
			ts: new Date(),
		};

		let room = await this.voipRoom.findOneById(message.rid);
		let newRoom = false;
		if (room && !room.open) {
			this.logger.debug(`Last room for visitor ${ guest._id } closed. Creating new one`);
			message.rid = Random.id();
			room = null;
		}
		if (room == null) {
			// delegate room creation to QueueManager
			this.logger.debug(`Calling QueueManager to request a room for visitor ${ guest._id }`);
			// room = await QueueManager.requestRoom({ guest, message, roomInfo, agent: defaultAgent, extraData });
			const name = roomInfo?.fname || guest.name || guest.username;
			const roomId = await this.createVoipRoom(rid, name, agent, guest);
			room = await this.voipRoom.findOneVoipRoomById(roomId);
			newRoom = true;
			this.logger.debug(`Room obtained for visitor ${ guest._id } -> ${ room?._id }`);
		}
		if (!room) {
			this.logger.debug(`Visitor ${ guest._id } trying to access another visitor's room`);
			throw new Meteor.Error('cannot-access-room');
		}
		return {
			result: {
				room,
				newRoom,
			} };
	}

	async findRoom(token: string, rid: string): Promise<IOmnichannelVoipServiceResult> {
		const fields = {
			t: 1,
			departmentId: 1,
			servedBy: 1,
			open: 1,
			v: 1,
			ts: 1,
		};
		let room: IVoipRoom | null;
		if (!rid) {
			room = await this.voipRoom.findOneByVisitorToken(token, fields);
		} else {
			room = await this.voipRoom.findOneByIdAndVisitorToken(rid, token, fields);
		}
		return Promise.resolve({
			result: room,
		});
	}

	async closeRoom(visitor: ILivechatVisitor, room: IVoipRoom, /* comment: any,*/ options = {}): Promise<any> {
		this.logger.debug(`Attempting to close room ${ room._id }`);
		if (!room || room.t !== 'v' || !room.open) {
			return false;
		}

		const params = callbacks.run('livechat.beforeCloseRoom', { room, options });
		const { extraData } = params;

		const now = new Date();
		const { _id: rid } = room;

		const closeData = {
			closedAt: now,
			callDuration: now.getTime() / 1000,
			...extraData,
		};
		this.logger.debug(`Room ${ room._id } was closed at ${ closeData.closedAt } (duration ${ closeData.chatDuration })`);

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
			this.logger.debug(`Closing by visitor ${ visitor._id }`);
			closeData.closer = 'visitor';
			closeData.closedBy = {
				_id: visitor._id,
				username: visitor.username,
			};
		}

		this.voipRoom.closeByRoomId(rid, closeData);
		// Retreive the closed room
		/**
		 * Note (Amol) How do we handle the code below
		 */
		/*
		const closedRoom = await VoipRoom.findOneByIdOrName(rid, {});

		this.logger.debug(`Sending closing message to room ${ room._id }`);
		const message = {
			t: 'livechat-close',
			msg: comment,
			groupable: false,
			transcriptRequested: !!transcriptRequest,
		};
		sendMessage(visitor, message, closedRoom);


		Meteor.defer(() => {
			/**
			 * @deprecated the `AppEvents.ILivechatRoomClosedHandler` event will be removed
			 * in the next major version of the Apps-Engine

			Apps.getBridges().getListenerBridge().livechatEvent(AppEvents.ILivechatRoomClosedHandler, room);
			Apps.getBridges().getListenerBridge().livechatEvent(AppEvents.IPostLivechatRoomClosed, room);
		});
		callbacks.runAsync('livechat.closeRoom', room);
		*/
		return Promise.resolve({
			result: true,
		});
	}

	/*
	async saveRoomInfo(roomData: IRoom, guestData: ILivechatVisitor): Promise<any> {
		this.logger.debug(`Saving room information on room ${ roomData._id }`);
		if (!_.isEmpty(guestData.name)) {
			const { _id: rid } = roomData;
			const { name } = guestData;
			if (name) {
				return await VoipRoom.setFnameById(rid, name)
				// This one needs to be the last since the agent may not have the subscription
				// when the conversation is in the queue, then the result will be 0(zero)
				&& updateSubscriptionDisplayNameByRoomId(rid, name);
			}
		}
	}
	*/
}
