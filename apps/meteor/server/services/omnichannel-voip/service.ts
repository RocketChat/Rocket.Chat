import type { IOmnichannelVoipService, FindVoipRoomsParams } from '@rocket.chat/core-services';
import { api, ServiceClassInternal, VoipAsterisk } from '@rocket.chat/core-services';
import type {
	IVoipExtensionBase,
	IVoipExtensionWithAgentInfo,
	IAgentExtensionMap,
	IRoomCreationResponse,
	IUser,
	ILivechatAgent,
	ILivechatVisitor,
	IVoipRoom,
	IVoipRoomClosingInfo,
} from '@rocket.chat/core-typings';
import { isILivechatVisitor, OmnichannelSourceType, isVoipRoom, VoipClientEvents, UserStatus } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Users, VoipRoom, PbxEvents } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { FindOptions, SortDirection } from 'mongodb';
import _ from 'underscore';

import type { IOmniRoomClosingMessage } from './internalTypes';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';

export class OmnichannelVoipService extends ServiceClassInternal implements IOmnichannelVoipService {
	protected name = 'omnichannel-voip';

	private logger: Logger;

	constructor() {
		super();
		this.logger = new Logger('OmnichannelVoipService');

		// handle agent disconnections
		this.onEvent('watch.pbxevents', async ({ data }) => {
			const extension = data.agentExtension;
			if (!extension) {
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
		const agent = await Users.findOneByExtension(extension);
		if (!agent) {
			this.logger.error(`No agent found with extension ${extension}. Event won't proceed`);
			return;
		}
		const currentRoom = await VoipRoom.findOneByAgentId(agent._id);
		if (!currentRoom) {
			this.logger.error(`No active call found for agent ${agent._id}`);
			return;
		}
		this.logger.debug(`Notifying agent ${agent._id} of hangup on room ${currentRoom._id}`);
		void api.broadcast('call.callerhangup', agent._id, { roomId: currentRoom._id });
	}

	private async processAgentDisconnect(extension: string): Promise<void> {
		this.logger.info(`Processing disconnection event for agent with extension ${extension}`);
		const agent = await Users.findOneByExtension(extension);
		if (!agent) {
			this.logger.error(`No agent found with extension ${extension}. Event won't proceed`);
			// this should not even be possible, but just in case
			return;
		}

		const openRooms = await VoipRoom.findOpenByAgentId(agent._id).toArray();
		this.logger.info(`Closing ${openRooms.length} for agent with extension ${extension}`);
		// In the best scenario, an agent would only have one active voip room
		// this is to handle the "just in case" scenario of a server and agent failure multiple times
		// and multiple rooms are left opened for one single agent. Best case this will iterate once
		for await (const room of openRooms) {
			await this.handleEvent(VoipClientEvents['VOIP-CALL-ENDED'], room, agent, 'Agent disconnected abruptly');
			await this.closeRoom(agent, room, agent, 'voip-call-ended-unexpectedly', { comment: 'Agent disconnected abruptly' });
		}
	}

	private async createVoipRoom(
		rid: string,
		name: string,
		agent: { agentId: string; username: string },
		guest: ILivechatVisitor,
		direction: IVoipRoom['direction'],
	): Promise<string> {
		const status = UserStatus.ONLINE;
		const { _id, department: departmentId } = guest;
		const newRoomAt = new Date();

		/**
		 * This is a peculiar case for outbound. In case of outbound,
		 * the room is created as soon as the remote use accepts a call.
		 * We generate the DialEnd (dialstatus = 'ANSWERED') only when
		 * the call is picked up. But the agent receiving 200 OK and the ContinuousMonitor
		 * receiving DialEnd happens in any order. So just depending here on
		 * DialEnd would result in creating a room which does not have a correct reference of the call.
		 *
		 * This may result in missed system messages or posting messages to wrong room.
		 * So ContinuousMonitor adds a DialState (dialstatus = 'RINGING') event.
		 * When this event gets added, findone call below will find the latest of
		 * the 'QueueCallerJoin', 'DialEnd', 'DialState' event and create a correct association of the room.
		 */

		// Use latest queue caller join event
		const numericPhone = guest?.phone?.[0]?.phoneNumber.replace(/\D/g, '');
		const callStartPbxEvent = await PbxEvents.findOne(
			{
				$or: [
					{
						phone: numericPhone, // Incoming calls will have phone number (connectedlinenum) without any symbol
					},
					{ phone: `*${numericPhone}` }, // Outgoing calls will have phone number (connectedlinenum) with * prefix
					{ phone: `+${numericPhone}` }, // Just in case
				],
				event: {
					$in: ['QueueCallerJoin', 'DialEnd', 'DialState'],
				},
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
			name: `${name}-${callUniqueId}`,
			fname: name,
			t: 'v',
			ts: newRoomAt,
			departmentId,
			v: {
				_id,
				token: guest.token,
				status,
				username: guest.username,
				...(guest?.phone?.[0] && { phone: guest.phone[0].phoneNumber }),
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
			livechatData: '',
			u: {
				_id: agent.agentId,
				username: agent.username,
			},
			direction,
			_updatedAt: newRoomAt,
		};

		return (await VoipRoom.insertOne(room)).insertedId;
	}

	private async getAllocatedExtesionAllocationData(projection: Partial<{ [P in keyof IUser]: number }>): Promise<IUser[]> {
		const roles: string[] = ['livechat-agent', 'livechat-manager', 'admin'];
		const options: FindOptions<IUser> = {
			sort: {
				username: 1,
			},
			projection,
		};

		const query = {
			extension: { $exists: true },
		};
		return Users.findUsersInRolesWithQuery(roles, query, options).toArray();
	}

	async getFreeExtensions(): Promise<string[]> {
		const allExtensions = await VoipAsterisk.getExtensionList();
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
		direction: IVoipRoom['direction'],
		options: FindOptions<IVoipRoom> = {},
	): Promise<IRoomCreationResponse> {
		let room = await VoipRoom.findOneById(rid, options);
		let newRoom = false;
		if (room && !room.open) {
			room = null;
		}
		if (room == null) {
			const name = guest.name || guest.username;
			const roomId = await this.createVoipRoom(rid, name, agent, guest, direction);
			room = await VoipRoom.findOneVoipRoomById(roomId);
			newRoom = true;
		}
		if (!room) {
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
			return VoipRoom.findOneByVisitorToken(token, { projection });
		}
		return VoipRoom.findOneByIdAndVisitorToken(rid, token, { projection });
	}

	async closeRoom(
		closerParam: ILivechatVisitor | ILivechatAgent,
		room: IVoipRoom,
		user: IUser,
		sysMessageId: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly' = 'voip-call-wrapup',
		options?: { comment?: string; tags?: string[] },
	): Promise<boolean> {
		if (!room || room.t !== 'v' || !room.open) {
			return false;
		}

		let { closeInfo, closeSystemMsgData } = await this.getBaseRoomClosingData(closerParam, room, sysMessageId, options);
		const finalClosingData = await this.getRoomClosingData(closeInfo, closeSystemMsgData, room, sysMessageId, options);
		closeInfo = finalClosingData.closeInfo;
		closeSystemMsgData = finalClosingData.closeSystemMsgData;

		await sendMessage(user, closeSystemMsgData, room);

		// There's a race condition between receiving the call and receiving the event
		// Sometimes it happens before the connection on client, sometimes it happens after
		// For now, this data will be appended as a metric on room closing
		await this.setCallWaitingQueueTimers(room);

		await VoipRoom.closeByRoomId(room._id, closeInfo);

		return true;
	}

	async getRoomClosingData(
		closeInfo: IVoipRoomClosingInfo,
		closeSystemMsgData: IOmniRoomClosingMessage,
		_room: IVoipRoom,
		_sysMessageId: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly',
		_options?: { comment?: string; tags?: string[] },
	): Promise<{ closeInfo: IVoipRoomClosingInfo; closeSystemMsgData: IOmniRoomClosingMessage }> {
		return { closeInfo, closeSystemMsgData };
	}

	async getBaseRoomClosingData(
		closerParam: ILivechatVisitor | ILivechatAgent,
		room: IVoipRoom,
		sysMessageId: 'voip-call-wrapup' | 'voip-call-ended-unexpectedly',
		_options?: { comment?: string; tags?: string[] },
	): Promise<{ closeInfo: IVoipRoomClosingInfo; closeSystemMsgData: IOmniRoomClosingMessage }> {
		const now = new Date();
		const closer = isILivechatVisitor(closerParam) ? 'visitor' : 'user';

		const closeData: IVoipRoomClosingInfo = {
			closedAt: now,
			callDuration: now.getTime() - room.ts.getTime(),
			closer,
			closedBy: {
				_id: closerParam._id,
				username: closerParam.username,
			},
		};

		const message: IOmniRoomClosingMessage = {
			t: sysMessageId,
			groupable: false,
		};

		return {
			closeInfo: closeData,
			closeSystemMsgData: message,
		};
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
		const { result: extensions } = await VoipAsterisk.getExtensionList();
		const summary = await (await VoipAsterisk.cachedQueueDetails())();
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
		direction,
		roomName,
		options: { offset = 0, count, fields, sort } = {},
	}: FindVoipRoomsParams): Promise<PaginatedResult<{ rooms: IVoipRoom[] }>> {
		const { cursor, totalCount } = VoipRoom.findRoomsWithCriteria({
			agents,
			open,
			createdAt,
			closedAt,
			tags,
			queue,
			visitorId,
			direction,
			roomName,
			options: {
				sort: sort || { ts: -1 },
				offset,
				count,
				fields,
			},
		});

		const [rooms, total] = await Promise.all([cursor.toArray(), totalCount]);

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

		const agentCalledEvent = await PbxEvents.findOneByEvent(room.callUniqueId, 'AgentConnect');
		// Update room with the agentconnect event information (hold time => time call was in queue)
		await VoipRoom.updateOne(
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

		if (
			isVoipRoom(room) &&
			room.open &&
			room.callUniqueId &&
			// Check if call exists by looking if we have pbx events of it
			(await PbxEvents.findOneByUniqueId(room.callUniqueId))
		) {
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
		sort?: Record<string, SortDirection>,
	): Promise<{ agents: ILivechatAgent[]; total: number }> {
		const { cursor, totalCount } = Users.getAvailableAgentsIncludingExt(includeExtension, text, { limit: count, skip: offset, sort });

		const [agents, total] = await Promise.all([cursor.toArray(), totalCount]);

		return {
			agents,
			total,
		};
	}
}
