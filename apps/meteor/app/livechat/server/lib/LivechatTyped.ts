import type {
	IOmnichannelRoom,
	IOmnichannelRoomClosingInfo,
	IUser,
	MessageTypesValues,
	ILivechatVisitor,
	IOmnichannelSystemMessage,
} from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatInquiry, LivechatRooms, Subscriptions, LivechatVisitors, Messages, Users } from '@rocket.chat/models';
import { Message } from '@rocket.chat/core-services';
import moment from 'moment-timezone';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { callbacks } from '../../../../lib/callbacks';
import { Logger } from '../../../logger/server';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { Apps, AppEvents } from '../../../../ee/server/apps';
import { getTimezone } from '../../../utils/server/lib/getTimezone';
import { settings } from '../../../settings/server';
import * as Mailer from '../../../mailer/server/api';
import type { MainLogger } from '../../../../server/lib/logger/getPino';
import { metrics } from '../../../metrics/server';
import { i18n } from '../../../../server/lib/i18n';

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
		callbacks.runAsync('livechat.closeRoom', {
			room: newRoom,
			options,
		});

		this.logger.debug(`Room ${newRoom._id} was closed`);
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
		return Mailer.send({
			to,
			from,
			replyTo,
			subject,
			html,
		});
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
}

export const Livechat = new LivechatClass();
