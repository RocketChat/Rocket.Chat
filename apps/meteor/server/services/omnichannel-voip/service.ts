import { Db, FindOneOptions } from 'mongodb';
import _ from 'underscore';
import type {
	IVoipExtensionBase,
	IVoipExtensionWithAgentInfo,
	IAgentExtensionMap,
	IRoomCreationResponse,
	IUser,
	ILivechatAgent,
} from '@rocket.chat/core-typings';
import {
	ILivechatVisitor,
	isILivechatVisitor,
	IVoipRoom,
	IRoomClosingInfo,
	OmnichannelSourceType,
	isVoipRoom,
	VoipClientEvents,
} from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

import { IOmnichannelVoipService } from '../../sdk/types/IOmnichannelVoipService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { Logger } from '../../lib/logger/Logger';
import { Voip } from '../../sdk';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { VoipRoomsRaw } from '../../../app/models/server/raw/VoipRooms';
import { PbxEventsRaw } from '../../../app/models/server/raw/PbxEvents';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { FindVoipRoomsParams } from './internalTypes';
import { api } from '../../sdk/api';

export class OmnichannelVoipService extends ServiceClassInternal implements IOmnichannelVoipService {
	protected name = 'omnichannel-voip';

	private logger: Logger;

	private users: UsersRaw;

	private voipRoom: VoipRoomsRaw;

	private pbxEvents: PbxEventsRaw;

	constructor(db: Db) {
		super();
		this.users = new UsersRaw(db.collection('users'));
		this.voipRoom = new VoipRoomsRaw(db.collection('rocketchat_room'));
		this.logger = new Logger('OmnichannelVoipService');
		this.pbxEvents = new PbxEventsRaw(db.collection('pbx_events'));

		// handle agent disconnections
		this.onEvent('watch.pbxevents', async ({ data }) => {
			this.logger.debug(`Get event watch.pbxevents on service`);
			const extension = data.agentExtension;
			if (!extension) {
				this.logger.debug(`No agent extension associated with the event. Skipping`);
				return;
			}
			switch (data.event) {
				case 'ContactStatus': {
					return this.processAgentDisconnect(extension);
				}
				case 'Hangup': {
					return this.processCallerHangup(extension);
				}
			}
		});
	}

	private async processCallerHangup(extension: string): Promise<void> {
		this.logger.info(`Processing hangup event for call with agent on extension ${extension}`);
		const agent = await this.users.findOneByExtension(extension);
		if (!agent) {
			this.logger.debug(`No agent found with extension ${extension}. Event won't proceed`);
			return;
		}
		const currentRoom = await this.voipRoom.findOneByAgentId(agent._id);
		if (!currentRoom) {
			this.logger.debug(`No active call found for agent ${agent._id}`);
			return;
		}
		this.logger.debug(`Notifying agent ${agent._id} of hangup on room ${currentRoom._id}`);
		api.broadcast('call.callerhangup', agent._id, { roomId: currentRoom._id });
	}

	private async processAgentDisconnect(extension: string): Promise<void> {
		this.logger.info(`Processing disconnection event for agent with extension ${extension}`);
		const agent = await this.users.findOneByExtension(extension);
		if (!agent) {
			this.logger.debug(`No agent found with extension ${extension}. Event won't proceed`);
			// this should not even be possible, but just in case
			return;
		}

		const openRooms = await this.voipRoom.findOpenByAgentId(agent._id).toArray();
		this.logger.info(`Closing ${openRooms.length} for agent with extension ${extension}`);
		// In the best scenario, an agent would only have one active voip room
		// this is to handle the "just in case" scenario of a server and agent failure multiple times
		// and multiple rooms are left opened for one single agent. Best case this will iterate once
		for await (const room of openRooms) {
			await this.handleEvent(VoipClientEvents['VOIP-CALL-ENDED'], room, agent, 'Agent disconnected abruptly');
			await this.closeRoom(agent, room, agent, 'Agent disconnected abruptly', undefined, 'voip-call-ended-unexpectedly');
		}
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

		// Use latest queue caller join event
		const callStartPbxEvent = await this.pbxEvents.findOne(
			{
				phone: guest?.phone?.[0]?.phoneNumber,
				event: 'QueueCallerJoin',
			},
			{ sort: { ts: -1 } },
		);

		if (!callStartPbxEvent) {
			this.logger.warn(`Call for visitor ${guest._id} is not associated with a pbx event`);
		}

		const { queue = 'default', callUniqueId } = callStartPbxEvent || {};

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
				phone: guest?.phone?.[0]?.phoneNumber,
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
			queue,
			callUniqueId,

			uids: [],
			autoTranslateLanguage: '',
			responseBy: '',
			livechatData: '',
			priorityId: '',
			u: {
				_id: agent.agentId,
				username: agent.username,
			},
			_updatedAt: newRoomAt,
		};

		this.logger.debug(`Room created for visitor ${_id}`);
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

	async getFreeExtensions(): Promise<string[]> {
		const allExtensions = await Voip.getExtensionList();
		const allocatedExtensions = await this.getAllocatedExtesionAllocationData({
			extension: 1,
		});
		const filtered = _.difference(
			_.pluck(allExtensions.result as IVoipExtensionBase[], 'extension'),
			_.pluck(allocatedExtensions, 'extension'),
		) as string[];
		return filtered;
	}

	async getExtensionAllocationDetails(): Promise<IAgentExtensionMap[]> {
		const allocatedExtensions = await this.getAllocatedExtesionAllocationData({
			username: 1,
			roles: 1,
			extension: 1,
		});
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
			callUniqueId: 1,
		};
		if (!rid) {
			return this.voipRoom.findOneByVisitorToken(token, { projection });
		}
		return this.voipRoom.findOneByIdAndVisitorToken(rid, token, { projection });
	}

	private async calculateOnHoldTimeForRoom(room: IVoipRoom, closedAt: Date): Promise<number> {
		if (!room || !room.callUniqueId) {
			return 0;
		}

		const events = await this.pbxEvents.findByEvents(room.callUniqueId, ['Hold', 'Unhold']).toArray();
		if (!events.length) {
			// if there's no events, that means no hold time
			return 0;
		}

		if (events.length === 1 && events[0].event === 'Unhold') {
			// if the only event is an unhold event, something bad happened
			return 0;
		}

		if (events.length === 1 && events[0].event === 'Hold') {
			// if the only event is a hold event, the call was ended while on hold
			// hold time = room.closedAt - event.ts
			return closedAt.getTime() - events[0].ts.getTime();
		}

		let currentOnHoldTime = 0;

		for (let i = 0; i < events.length; i += 2) {
			const onHold = events[i].ts;
			const unHold = events[i + 1]?.ts || closedAt;

			currentOnHoldTime += unHold.getTime() - onHold.getTime();
		}

		return currentOnHoldTime;
	}

	// Comment can be used to store wrapup call data
	async closeRoom(
		closerParam: ILivechatVisitor | ILivechatAgent,
		room: IVoipRoom,
		user: IUser,
		comment?: string,
		tags?: string[],
		sysMessageId: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly' = 'voip-call-wrapup',
	): Promise<boolean> {
		this.logger.debug(`Attempting to close room ${room._id}`);
		if (!room || room.t !== 'v' || !room.open) {
			return false;
		}

		const now = new Date();
		const { _id: rid } = room;
		const closer = isILivechatVisitor(closerParam) ? 'visitor' : 'user';
		const callTotalHoldTime = await this.calculateOnHoldTimeForRoom(room, now);
		const closeData: IRoomClosingInfo = {
			closedAt: now,
			callDuration: now.getTime() - room.ts.getTime(),
			closer,
			callTotalHoldTime,
			tags,
		};
		this.logger.debug(`Closing room ${room._id} by ${closer} ${closerParam._id}`);
		closeData.closedBy = {
			_id: closerParam._id,
			username: closerParam.username,
		};

		const message = {
			t: sysMessageId,
			msg: comment,
			groupable: false,
		};

		await sendMessage(user, message, room);
		// There's a race condition between receiving the call and receiving the event
		// Sometimes it happens before the connection on client, sometimes it happens after
		// For now, this data will be appended as a metric on room closing
		await this.setCallWaitingQueueTimers(room);

		this.logger.debug(`Room ${room._id} closed and timers set`);
		this.logger.debug(`Room ${room._id} was closed at ${closeData.closedAt} (duration ${closeData.callDuration})`);
		this.voipRoom.closeByRoomId(rid, closeData);
		return true;
	}

	private getQueuesForExt(
		ext: string,
		queueInfo: {
			name: string;
			members: string[];
		}[],
	): string[] {
		return queueInfo.reduce((acc: string[], queue: { name: string; members: string[] }) => {
			if (queue.members.includes(ext)) {
				acc.push(queue.name);
			}
			return acc;
		}, []);
	}

	async getExtensionListWithAgentData(): Promise<IVoipExtensionWithAgentInfo[]> {
		const { result: extensions } = await Voip.getExtensionList();
		const summary = await (await Voip.cachedQueueDetails())();
		const allocatedExtensions = await this.getAllocatedExtesionAllocationData({
			extension: 1,
			_id: 1,
			username: 1,
			name: 1,
		});

		return (extensions as unknown as IVoipExtensionBase[]).map((ext) => {
			const user = allocatedExtensions.find((ex) => ex.extension === ext.extension);
			return {
				userId: user?._id,
				username: user?.username,
				name: user?.name,
				queues: this.getQueuesForExt(ext.extension, summary),
				...ext,
			};
		});
	}

	async findVoipRooms({
		agents,
		open,
		createdAt,
		closedAt,
		visitorId,
		tags,
		queue,
		options: { offset = 0, count, fields, sort } = {},
	}: FindVoipRoomsParams): Promise<PaginatedResult<{ rooms: IVoipRoom[] }>> {
		const cursor = this.voipRoom.findRoomsWithCriteria({
			agents,
			open,
			createdAt,
			closedAt,
			tags,
			queue,
			visitorId,
			options: {
				sort: sort || { ts: -1 },
				offset,
				count,
				fields,
			},
		});

		const total = await cursor.count();
		const rooms = await cursor.toArray();

		return {
			rooms,
			count: rooms.length,
			total,
			offset,
		};
	}

	private async setCallWaitingQueueTimers(room: IVoipRoom): Promise<void> {
		// Fetch agent connected event for started call
		if (!room.callUniqueId) {
			return;
		}

		const agentCalledEvent = await this.pbxEvents.findOneByEvent(room.callUniqueId, 'AgentConnect');
		// Update room with the agentconnect event information (hold time => time call was in queue)
		await this.voipRoom.updateOne(
			{ _id: room._id },
			{
				$set: {
					// holdtime is stored in seconds, so convert to millis
					callWaitingTime: Number(agentCalledEvent?.holdTime) * 1000,
				},
			},
		);
	}

	async handleEvent(event: VoipClientEvents, room: IVoipRoom, user: IUser, comment?: string): Promise<void> {
		const message = {
			t: event,
			msg: comment,
			groupable: false as const,
			voipData: {
				callDuration: Number(room.callDuration) || 0,
				callStarted: room.callStarted?.toISOString() || new Date().toISOString(),
			},
		};

		this.logger.debug(`Handling event ${event} on room ${room._id}`);

		if (
			isVoipRoom(room) &&
			room.open &&
			room.callUniqueId &&
			// Check if call exists by looking if we have pbx events of it
			(await this.pbxEvents.findOneByUniqueId(room.callUniqueId))
		) {
			this.logger.debug(`Room is valid. Sending event ${event}`);
			await sendMessage(user, message, room);
		} else {
			this.logger.warn({ msg: 'Invalid room type or event type', type: room.t, event });
		}
	}

	async getAvailableAgents(
		includeExtension?: string,
		text?: string,
		count?: number,
		offset?: number,
		sort?: Record<string, unknown>,
	): Promise<{ agents: ILivechatAgent[]; total: number }> {
		const cursor = this.users.getAvailableAgentsIncludingExt(includeExtension, text, { count, skip: offset, sort });
		const agents = await cursor.toArray();
		const total = await cursor.count();

		return {
			agents,
			total,
		};
	}
}
