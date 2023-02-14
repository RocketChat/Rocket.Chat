// Goal is to have a typed version of apps/meteor/app/livechat/server/lib/Livechat.js
// This is a work in progress, and is not yet complete
// But it is a start.

// Important note: Try to not use the original Livechat.js file, but use this one instead.
// If possible, move methods from Livechat.js to this file.
// This is because we want to slowly convert the code to typescript, and this is a good way to do it.
import type { IOmnichannelRoom, IOmnichannelRoomClosingInfo } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatInquiry, LivechatRooms, Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { Logger } from '../../../logger/server';
import type { CloseRoomParams, CloseRoomParamsByUser, CloseRoomParamsByVisitor } from './LivechatTyped.d';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { Apps, AppEvents } from '../../../apps/server';
import { Messages as LegacyMessage } from '../../../models/server';

class LivechatClass {
	logger: Logger;

	constructor() {
		this.logger = new Logger('Livechat');
	}

	async closeRoom(params: CloseRoomParams): Promise<void> {
		const { comment } = params;
		let { room } = params;

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
			this.logger.debug(`Closing by user ${user._id}`);
			closeData.closer = 'user';
			closeData.closedBy = {
				_id: user._id,
				username: user.username,
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
		room = (await LivechatRooms.findOneById(rid)) as IOmnichannelRoom;

		this.logger.debug(`Sending closing message to room ${room._id}`);
		sendMessage(chatCloser, message, room);

		LegacyMessage.createCommandWithRoomIdAndUser('promptTranscript', rid, closeData.closedBy);

		this.logger.debug(`Running callbacks for room ${room._id}`);

		Meteor.defer(() => {
			/**
			 * @deprecated the `AppEvents.ILivechatRoomClosedHandler` event will be removed
			 * in the next major version of the Apps-Engine
			 */
			Apps.getBridges()?.getListenerBridge().livechatEvent(AppEvents.ILivechatRoomClosedHandler, room);
			Apps.getBridges()?.getListenerBridge().livechatEvent(AppEvents.IPostLivechatRoomClosed, room);
		});
		callbacks.runAsync('livechat.closeRoom', {
			room,
			options,
		});

		this.logger.debug(`Room ${room._id} was closed`);
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
}

export const Livechat = new LivechatClass();
