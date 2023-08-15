import { Message } from '@rocket.chat/core-services';
import type {
	IOmnichannelRoom,
	IOmnichannelRoomClosingInfo,
	IUser,
	MessageTypesValues,
	ILivechatVisitor,
	IOmnichannelSystemMessage,
	SelectedAgent,
	ILivechatAgent,
	IMessage,
} from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Logger, type MainLogger } from '@rocket.chat/logger';
import {
	LivechatDepartment,
	LivechatInquiry,
	LivechatRooms,
	Subscriptions,
	LivechatVisitors,
	Messages,
	Users,
	LivechatDepartmentAgents,
} from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import moment from 'moment-timezone';
import type { FindCursor, UpdateFilter } from 'mongodb';

import { Apps, AppEvents } from '../../../../ee/server/apps';
import { callbacks } from '../../../../lib/callbacks';
import { i18n } from '../../../../server/lib/i18n';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import * as Mailer from '../../../mailer/server/api';
import { metrics } from '../../../metrics/server';
import { settings } from '../../../settings/server';
import { getTimezone } from '../../../utils/server/lib/getTimezone';
import { updateDepartmentAgents, validateEmail } from './Helper';
import { QueueManager } from './QueueManager';
import { RoutingManager } from './RoutingManager';

type GenericCloseRoomParams = {
	room: IOmnichannelRoom;
	comment?: string;
	options?: {
		clientAction?: boolean;
		tags?: string[];
		emailTranscript?:
			| {
					sendToVisitor: false;
			  }
			| {
					sendToVisitor: true;
					requestData: NonNullable<IOmnichannelRoom['transcriptRequest']>;
			  };
		pdfTranscript?: {
			requestedBy: string;
		};
	};
};

export type CloseRoomParamsByUser = {
	user: IUser | null;
} & GenericCloseRoomParams;

export type CloseRoomParamsByVisitor = {
	visitor: ILivechatVisitor;
} & GenericCloseRoomParams;

export type CloseRoomParams = CloseRoomParamsByUser | CloseRoomParamsByVisitor;

class LivechatClass {
	logger: Logger;

	webhookLogger: MainLogger;

	constructor() {
		this.logger = new Logger('Livechat');
		this.webhookLogger = this.logger.section('Webhook');
	}

	findGuest(token: string) {
		return LivechatVisitors.getVisitorByToken(token, {
			projection: {
				name: 1,
				username: 1,
				token: 1,
				visitorEmails: 1,
				department: 1,
			},
		});
	}

	enabled() {
		return Boolean(settings.get('Livechat_enabled'));
	}

	async online(department?: string, skipNoAgentSetting = false, skipFallbackCheck = false): Promise<boolean> {
		Livechat.logger.debug(`Checking online agents ${department ? `for department ${department}` : ''}`);
		if (!skipNoAgentSetting && settings.get('Livechat_accept_chats_with_no_agents')) {
			Livechat.logger.debug('Can accept without online agents: true');
			return true;
		}

		if (settings.get('Livechat_assign_new_conversation_to_bot')) {
			Livechat.logger.debug(`Fetching online bot agents for department ${department}`);
			const botAgents = await Livechat.getBotAgents(department);
			if (botAgents) {
				const onlineBots = await botAgents.count();
				this.logger.debug(`Found ${onlineBots} online`);
				if (onlineBots > 0) {
					return true;
				}
			}
		}

		const agentsOnline = await this.checkOnlineAgents(department, undefined, skipFallbackCheck);
		Livechat.logger.debug(`Are online agents ${department ? `for department ${department}` : ''}?: ${agentsOnline}`);
		return agentsOnline;
	}

	getNextAgent(department?: string): Promise<SelectedAgent | null | undefined> {
		return RoutingManager.getNextAgent(department);
	}

	async getOnlineAgents(department?: string, agent?: SelectedAgent): Promise<FindCursor<ILivechatAgent> | undefined> {
		if (agent?.agentId) {
			return Users.findOnlineAgents(agent.agentId);
		}

		if (department) {
			const departmentAgents = await LivechatDepartmentAgents.getOnlineForDepartment(department);
			if (!departmentAgents) {
				return;
			}

			const agentIds = await departmentAgents.map(({ agentId }) => agentId).toArray();
			if (!agentIds.length) {
				return;
			}

			return Users.findByIds<ILivechatAgent>(agentIds);
		}
		return Users.findOnlineAgents();
	}

	async closeRoom(params: CloseRoomParams): Promise<void> {
		const { comment } = params;
		const { room } = params;

		this.logger.debug(`Attempting to close room ${room._id}`);
		if (!room || !isOmnichannelRoom(room) || !room.open) {
			this.logger.debug(`Room ${room._id} is not open`);
			return;
		}

		const { updatedOptions: options } = await this.resolveChatTags(room, params.options);
		this.logger.debug(`Resolved chat tags for room ${room._id}`);

		const now = new Date();
		const { _id: rid, servedBy, transcriptRequest } = room;
		const serviceTimeDuration = servedBy && (now.getTime() - new Date(servedBy.ts).getTime()) / 1000;

		const closeData: IOmnichannelRoomClosingInfo = {
			closedAt: now,
			chatDuration: (now.getTime() - new Date(room.ts).getTime()) / 1000,
			...(serviceTimeDuration && { serviceTimeDuration }),
			...options,
		};
		this.logger.debug(`Room ${room._id} was closed at ${closeData.closedAt} (duration ${closeData.chatDuration})`);

		const isRoomClosedByUserParams = (params: CloseRoomParams): params is CloseRoomParamsByUser =>
			(params as CloseRoomParamsByUser).user !== undefined;
		const isRoomClosedByVisitorParams = (params: CloseRoomParams): params is CloseRoomParamsByVisitor =>
			(params as CloseRoomParamsByVisitor).visitor !== undefined;

		let chatCloser: any;
		if (isRoomClosedByUserParams(params)) {
			const { user } = params;
			this.logger.debug(`Closing by user ${user?._id}`);
			closeData.closer = 'user';
			closeData.closedBy = {
				_id: user?._id || '',
				username: user?.username,
			};
			chatCloser = user;
		} else if (isRoomClosedByVisitorParams(params)) {
			const { visitor } = params;
			this.logger.debug(`Closing by visitor ${params.visitor._id}`);
			closeData.closer = 'visitor';
			closeData.closedBy = {
				_id: visitor._id,
				username: visitor.username,
			};
			chatCloser = visitor;
		} else {
			throw new Error('Error: Please provide details of the user or visitor who closed the room');
		}

		this.logger.debug(`Updating DB for room ${room._id} with close data`);

		await Promise.all([
			LivechatRooms.closeRoomById(rid, closeData),
			LivechatInquiry.removeByRoomId(rid),
			Subscriptions.removeByRoomId(rid),
		]);

		this.logger.debug(`DB updated for room ${room._id}`);

		const message = {
			t: 'livechat-close',
			msg: comment,
			groupable: false,
			transcriptRequested: !!transcriptRequest,
		};

		// Retrieve the closed room
		const newRoom = await LivechatRooms.findOneById(rid);

		if (!newRoom) {
			throw new Error('Error: Room not found');
		}

		this.logger.debug(`Sending closing message to room ${room._id}`);
		await sendMessage(chatCloser, message, newRoom);

		await Message.saveSystemMessage('command', rid, 'promptTranscript', closeData.closedBy);

		this.logger.debug(`Running callbacks for room ${newRoom._id}`);

		process.nextTick(() => {
			/**
			 * @deprecated the `AppEvents.ILivechatRoomClosedHandler` event will be removed
			 * in the next major version of the Apps-Engine
			 */
			void Apps.getBridges()?.getListenerBridge().livechatEvent(AppEvents.ILivechatRoomClosedHandler, newRoom);
			void Apps.getBridges()?.getListenerBridge().livechatEvent(AppEvents.IPostLivechatRoomClosed, newRoom);
		});
		if (process.env.TEST_MODE) {
			await callbacks.run('livechat.closeRoom', {
				room: newRoom,
				options,
			});
		} else {
			callbacks.runAsync('livechat.closeRoom', {
				room: newRoom,
				options,
			});
		}

		this.logger.debug(`Room ${newRoom._id} was closed`);
	}

	async getRequiredDepartment(onlineRequired = true) {
		const departments = LivechatDepartment.findEnabledWithAgents();

		for await (const dept of departments) {
			if (!dept.showOnRegistration) {
				continue;
			}
			if (!onlineRequired) {
				return dept;
			}

			const onlineAgents = await LivechatDepartmentAgents.getOnlineForDepartment(dept._id);
			if (onlineAgents && (await onlineAgents.count())) {
				return dept;
			}
		}
	}

	async getRoom(
		guest: ILivechatVisitor,
		message: Pick<IMessage, 'rid' | 'msg'>,
		roomInfo: {
			source?: IOmnichannelRoom['source'];
			[key: string]: unknown;
		},
		agent?: SelectedAgent,
		extraData?: Record<string, unknown>,
	) {
		if (!this.enabled()) {
			throw new Meteor.Error('error-omnichannel-is-disabled');
		}
		Livechat.logger.debug(`Attempting to find or create a room for visitor ${guest._id}`);
		let room = await LivechatRooms.findOneById(message.rid);
		let newRoom = false;

		if (room && !room.open) {
			Livechat.logger.debug(`Last room for visitor ${guest._id} closed. Creating new one`);
			message.rid = Random.id();
			room = null;
		}

		if (guest.department && !(await LivechatDepartment.findOneById(guest.department))) {
			await LivechatVisitors.removeDepartmentById(guest._id);
			const tmpGuest = await LivechatVisitors.findOneById(guest._id);
			if (tmpGuest) {
				guest = tmpGuest;
			}
		}

		if (room == null) {
			const defaultAgent = await callbacks.run('livechat.checkDefaultAgentOnNewRoom', agent, guest);
			// if no department selected verify if there is at least one active and pick the first
			if (!defaultAgent && !guest.department) {
				const department = await this.getRequiredDepartment();
				Livechat.logger.debug(`No department or default agent selected for ${guest._id}`);

				if (department) {
					Livechat.logger.debug(`Assigning ${guest._id} to department ${department._id}`);
					guest.department = department._id;
				}
			}

			// delegate room creation to QueueManager
			Livechat.logger.debug(`Calling QueueManager to request a room for visitor ${guest._id}`);
			room = await QueueManager.requestRoom({
				guest,
				message,
				roomInfo,
				agent: defaultAgent,
				extraData,
			});
			newRoom = true;

			Livechat.logger.debug(`Room obtained for visitor ${guest._id} -> ${room._id}`);
		}

		if (!room || room.v.token !== guest.token) {
			Livechat.logger.debug(`Visitor ${guest._id} trying to access another visitor's room`);
			throw new Meteor.Error('cannot-access-room');
		}

		if (newRoom) {
			await Messages.setRoomIdByToken(guest.token, room._id);
		}

		return { room, newRoom };
	}

	async checkOnlineAgents(department?: string, agent?: { agentId: string }, skipFallbackCheck = false): Promise<boolean> {
		if (agent?.agentId) {
			return Users.checkOnlineAgents(agent.agentId);
		}

		if (department) {
			const onlineForDep = await LivechatDepartmentAgents.checkOnlineForDepartment(department);
			if (onlineForDep || skipFallbackCheck) {
				return onlineForDep;
			}

			const dep = await LivechatDepartment.findOneById(department);
			if (!dep?.fallbackForwardDepartment) {
				return onlineForDep;
			}

			return this.checkOnlineAgents(dep?.fallbackForwardDepartment);
		}

		return Users.checkOnlineAgents();
	}

	async setDepartmentForGuest({ token, department }: { token: string; department: string }) {
		check(token, String);
		check(department, String);

		Livechat.logger.debug(`Switching departments for user with token ${token} (to ${department})`);

		const updateUser = {
			$set: {
				department,
			},
		};

		const dep = await LivechatDepartment.findOneById(department);
		if (!dep) {
			throw new Meteor.Error('invalid-department', 'Provided department does not exists');
		}

		const visitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });
		if (!visitor) {
			throw new Meteor.Error('invalid-token', 'Provided token is invalid');
		}
		await LivechatVisitors.updateById(visitor._id, updateUser);
	}

	async removeRoom(rid: string) {
		Livechat.logger.debug(`Deleting room ${rid}`);
		check(rid, String);
		const room = await LivechatRooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		const result = await Promise.allSettled([
			Messages.removeByRoomId(rid),
			Subscriptions.removeByRoomId(rid),
			LivechatInquiry.removeByRoomId(rid),
			LivechatRooms.removeById(rid),
		]);

		for (const r of result) {
			if (r.status === 'rejected') {
				this.logger.error(`Error removing room ${rid}: ${r.reason}`);
				throw new Meteor.Error('error-removing-room', 'Error removing room');
			}
		}
	}

	async sendTranscript({
		token,
		rid,
		email,
		subject,
		user,
	}: {
		token: string;
		rid: string;
		email: string;
		subject?: string;
		user?: Pick<IUser, '_id' | 'name' | 'username' | 'utcOffset'> | null;
	}): Promise<boolean> {
		check(rid, String);
		check(email, String);
		this.logger.debug(`Sending conversation transcript of room ${rid} to user with token ${token}`);

		const room = await LivechatRooms.findOneById(rid);

		const visitor = await LivechatVisitors.getVisitorByToken(token, {
			projection: { _id: 1, token: 1, language: 1, username: 1, name: 1 },
		});

		if (!visitor) {
			throw new Error('error-invalid-token');
		}

		// @ts-expect-error - Visitor typings should include language?
		const userLanguage = visitor?.language || settings.get('Language') || 'en';
		const timezone = getTimezone(user);
		this.logger.debug(`Transcript will be sent using ${timezone} as timezone`);

		if (!room) {
			throw new Error('error-invalid-room');
		}

		// allow to only user to send transcripts from their own chats
		if (room.t !== 'l' || !room.v || room.v.token !== token) {
			throw new Error('error-invalid-room');
		}

		const showAgentInfo = settings.get<string>('Livechat_show_agent_info');
		const closingMessage = await Messages.findLivechatClosingMessage(rid, { projection: { ts: 1 } });
		const ignoredMessageTypes: MessageTypesValues[] = [
			'livechat_navigation_history',
			'livechat_transcript_history',
			'command',
			'livechat-close',
			'livechat-started',
			'livechat_video_call',
		];
		const messages = await Messages.findVisibleByRoomIdNotContainingTypesBeforeTs(
			rid,
			ignoredMessageTypes,
			closingMessage?.ts ? new Date(closingMessage.ts) : new Date(),
			{
				sort: { ts: 1 },
			},
		);

		let html = '<div> <hr>';
		await messages.forEach((message) => {
			let author;
			if (message.u._id === visitor._id) {
				author = i18n.t('You', { lng: userLanguage });
			} else {
				author = showAgentInfo ? message.u.name || message.u.username : i18n.t('Agent', { lng: userLanguage });
			}

			const datetime = moment.tz(message.ts, timezone).locale(userLanguage).format('LLL');
			const singleMessage = `
				<p><strong>${author}</strong>  <em>${datetime}</em></p>
				<p>${message.msg}</p>
			`;
			html += singleMessage;
		});

		html = `${html}</div>`;

		const fromEmail = settings.get<string>('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);
		let emailFromRegexp = '';
		if (fromEmail) {
			emailFromRegexp = fromEmail[0];
		} else {
			emailFromRegexp = settings.get<string>('From_Email');
		}

		const mailSubject = subject || i18n.t('Transcript_of_your_livechat_conversation', { lng: userLanguage });

		await this.sendEmail(emailFromRegexp, email, emailFromRegexp, mailSubject, html);

		setImmediate(() => {
			void callbacks.run('livechat.sendTranscript', messages, email);
		});

		const requestData: IOmnichannelSystemMessage['requestData'] = {
			type: 'user',
			visitor,
			user,
		};

		if (!user?.username) {
			const cat = await Users.findOneById('rocket.cat', { projection: { _id: 1, username: 1, name: 1 } });
			if (cat) {
				requestData.user = cat;
				requestData.type = 'visitor';
			}
		}

		if (!requestData.user) {
			this.logger.error('rocket.cat user not found');
			throw new Error('No user provided and rocket.cat not found');
		}

		await Message.saveSystemMessage<IOmnichannelSystemMessage>('livechat_transcript_history', room._id, '', requestData.user, {
			requestData,
		});

		return true;
	}

	async registerGuest({
		id,
		token,
		name,
		email,
		department,
		phone,
		username,
		connectionData,
		status = 'online',
	}: {
		id?: string;
		token: string;
		name?: string;
		email?: string;
		department?: string;
		phone?: { number: string };
		username?: string;
		connectionData?: any;
		status?: ILivechatVisitor['status'];
	}) {
		check(token, String);
		check(id, Match.Maybe(String));

		Livechat.logger.debug(`New incoming conversation: id: ${id} | token: ${token}`);

		let userId;
		type Mutable<Type> = {
			-readonly [Key in keyof Type]: Type[Key];
		};

		type UpdateUserType = Required<Pick<UpdateFilter<ILivechatVisitor>, '$set'>>;
		const updateUser: Required<Pick<UpdateFilter<ILivechatVisitor>, '$set'>> = {
			$set: {
				token,
				status,
				...(phone?.number ? { phone: [{ phoneNumber: phone.number }] } : {}),
				...(name ? { name } : {}),
			},
		};

		if (email) {
			email = email.trim().toLowerCase();
			validateEmail(email);
			(updateUser.$set as Mutable<UpdateUserType['$set']>).visitorEmails = [{ address: email }];
		}

		if (department) {
			Livechat.logger.debug(`Attempt to find a department with id/name ${department}`);
			const dep = await LivechatDepartment.findOneByIdOrName(department);
			if (!dep) {
				Livechat.logger.debug('Invalid department provided');
				throw new Meteor.Error('error-invalid-department', 'The provided department is invalid');
			}
			Livechat.logger.debug(`Assigning visitor ${token} to department ${dep._id}`);
			(updateUser.$set as Mutable<UpdateUserType['$set']>).department = dep._id;
		}

		const user = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });
		let existingUser = null;

		if (user) {
			Livechat.logger.debug('Found matching user by token');
			userId = user._id;
		} else if (phone?.number && (existingUser = await LivechatVisitors.findOneVisitorByPhone(phone.number))) {
			Livechat.logger.debug('Found matching user by phone number');
			userId = existingUser._id;
			// Don't change token when matching by phone number, use current visitor token
			(updateUser.$set as Mutable<UpdateUserType['$set']>).token = existingUser.token;
		} else if (email && (existingUser = await LivechatVisitors.findOneGuestByEmailAddress(email))) {
			Livechat.logger.debug('Found matching user by email');
			userId = existingUser._id;
		} else {
			Livechat.logger.debug(`No matches found. Attempting to create new user with token ${token}`);
			if (!username) {
				username = await LivechatVisitors.getNextVisitorUsername();
			}

			const userData = {
				username,
				status,
				ts: new Date(),
				token,
				...(id && { _id: id }),
			};

			if (settings.get('Livechat_Allow_collect_and_store_HTTP_header_informations')) {
				Livechat.logger.debug(`Saving connection data for visitor ${token}`);
				const connection = connectionData;
				if (connection?.httpHeaders) {
					(updateUser.$set as Mutable<UpdateUserType['$set']>).userAgent = connection.httpHeaders['user-agent'];
					(updateUser.$set as Mutable<UpdateUserType['$set']>).ip =
						connection.httpHeaders['x-real-ip'] || connection.httpHeaders['x-forwarded-for'] || connection.clientAddress;
					(updateUser.$set as Mutable<UpdateUserType['$set']>).host = connection.httpHeaders.host;
				}
			}

			userId = (await LivechatVisitors.insertOne(userData)).insertedId;
		}

		await LivechatVisitors.updateById(userId, updateUser);

		return userId;
	}

	private async getBotAgents(department?: string) {
		if (department) {
			return LivechatDepartmentAgents.getBotsForDepartment(department);
		}

		return Users.findBotAgents();
	}

	private async resolveChatTags(
		room: IOmnichannelRoom,
		options: CloseRoomParams['options'] = {},
	): Promise<{ updatedOptions: CloseRoomParams['options'] }> {
		this.logger.debug(`Resolving chat tags for room ${room._id}`);

		const concatUnique = (...arrays: (string[] | undefined)[]): string[] => [
			...new Set(([] as string[]).concat(...arrays.filter((a): a is string[] => !!a))),
		];

		const { departmentId, tags: optionsTags } = room;
		const { clientAction, tags: oldRoomTags } = options;
		const roomTags = concatUnique(oldRoomTags, optionsTags);

		if (!departmentId) {
			return {
				updatedOptions: {
					...options,
					...(roomTags.length && { tags: roomTags }),
				},
			};
		}

		const department = await LivechatDepartment.findOneById(departmentId);
		if (!department) {
			return {
				updatedOptions: {
					...options,
					...(roomTags.length && { tags: roomTags }),
				},
			};
		}

		const { requestTagBeforeClosingChat, chatClosingTags } = department;
		const extraRoomTags = concatUnique(roomTags, chatClosingTags);

		if (!requestTagBeforeClosingChat) {
			return {
				updatedOptions: {
					...options,
					...(extraRoomTags.length && { tags: extraRoomTags }),
				},
			};
		}

		const checkRoomTags = !clientAction || (roomTags && roomTags.length > 0);
		const checkDepartmentTags = chatClosingTags && chatClosingTags.length > 0;
		if (!checkRoomTags || !checkDepartmentTags) {
			throw new Error('error-tags-must-be-assigned-before-closing-chat');
		}

		return {
			updatedOptions: {
				...options,
				...(extraRoomTags.length && { tags: extraRoomTags }),
			},
		};
	}

	private async sendEmail(from: string, to: string, replyTo: string, subject: string, html: string): Promise<void> {
		await Mailer.send({
			to,
			from,
			replyTo,
			subject,
			html,
		});
	}

	async sendRequest(
		postData: {
			type: string;
			[key: string]: any;
		},
		attempts = 10,
	) {
		if (!attempts) {
			return;
		}
		const timeout = settings.get<number>('Livechat_http_timeout');
		const secretToken = settings.get<string>('Livechat_secret_token');
		try {
			const result = await fetch(settings.get('Livechat_webhookUrl'), {
				method: 'POST',
				headers: {
					...(secretToken && { 'X-RocketChat-Livechat-Token': secretToken }),
				},
				body: postData,
				timeout,
			});

			if (result.status === 200) {
				metrics.totalLivechatWebhooksSuccess.inc();
			} else {
				metrics.totalLivechatWebhooksFailures.inc();
			}
			return result;
		} catch (err) {
			Livechat.webhookLogger.error({ msg: `Response error on ${11 - attempts} try ->`, err });
			// try 10 times after 20 seconds each
			attempts - 1 && Livechat.webhookLogger.warn(`Will try again in ${(timeout / 1000) * 4} seconds ...`);
			setTimeout(async () => {
				await Livechat.sendRequest(postData, attempts - 1);
			}, timeout * 4);
		}
	}

	async saveAgentInfo(_id: string, agentData: any, agentDepartments: string[]) {
		check(_id, String);
		check(agentData, Object);
		check(agentDepartments, [String]);

		const user = await Users.findOneById(_id);
		if (!user || !(await hasRoleAsync(_id, 'livechat-agent'))) {
			throw new Meteor.Error('error-user-is-not-agent', 'User is not a livechat agent');
		}

		await Users.setLivechatData(_id, agentData);

		const currentDepartmentsForAgent = await LivechatDepartmentAgents.findByAgentId(_id).toArray();

		const toRemoveIds = currentDepartmentsForAgent
			.filter((dept) => !agentDepartments.includes(dept.departmentId))
			.map((dept) => dept.departmentId);
		const toAddIds = agentDepartments.filter((d) => !currentDepartmentsForAgent.some((c) => c.departmentId === d));

		await Promise.all(
			await LivechatDepartment.findInIds([...toRemoveIds, ...toAddIds], {
				projection: {
					_id: 1,
					enabled: 1,
				},
			})
				.map((dep) => {
					return updateDepartmentAgents(
						dep._id,
						{
							...(toRemoveIds.includes(dep._id) ? { remove: [{ agentId: _id }] } : { upsert: [{ agentId: _id }] }),
						},
						dep.enabled,
					);
				})
				.toArray(),
		);

		return true;
	}
}

export const Livechat = new LivechatClass();
