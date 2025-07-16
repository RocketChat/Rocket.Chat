import { Apps, AppEvents } from '@rocket.chat/apps';
import { Message } from '@rocket.chat/core-services';
import type { ILivechatDepartment, ILivechatInquiryRecord, IOmnichannelRoom, IOmnichannelRoomClosingInfo } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatInquiry, LivechatRooms, Subscriptions, Users } from '@rocket.chat/models';
import type { ClientSession } from 'mongodb';

import type { CloseRoomParams, CloseRoomParamsByUser, CloseRoomParamsByVisitor } from './localTypes';
import { livechatLogger as logger } from './logger';
import { parseTranscriptRequest } from './parseTranscriptRequest';
import { callbacks } from '../../../../lib/callbacks';
import { client, shouldRetryTransaction } from '../../../../server/database/utils';
import {
	notifyOnLivechatInquiryChanged,
	notifyOnRoomChangedById,
	notifyOnSubscriptionChanged,
} from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';

type ChatCloser = { _id: string; username: string | undefined };

const isRoomClosedByUserParams = (params: CloseRoomParams): params is CloseRoomParamsByUser =>
	(params as CloseRoomParamsByUser).user !== undefined;
const isRoomClosedByVisitorParams = (params: CloseRoomParams): params is CloseRoomParamsByVisitor =>
	(params as CloseRoomParamsByVisitor).visitor !== undefined;

export async function closeRoom(params: CloseRoomParams, attempts = 2): Promise<void> {
	let newRoom: IOmnichannelRoom;
	let chatCloser: ChatCloser;
	let removedInquiryObj: ILivechatInquiryRecord | null;

	const session = client.startSession();
	try {
		session.startTransaction();
		const { room, closedBy, removedInquiry } = await doCloseRoom(params, session);
		await session.commitTransaction();

		newRoom = room;
		chatCloser = closedBy;
		removedInquiryObj = removedInquiry;
	} catch (e) {
		logger.error({ err: e, msg: 'Failed to close room', afterAttempts: attempts });
		await session.abortTransaction();
		// Dont propagate transaction errors
		if (shouldRetryTransaction(e)) {
			if (attempts > 0) {
				logger.debug(`Retrying close room because of transient error. Attempts left: ${attempts}`);
				return closeRoom(params, attempts - 1);
			}

			throw new Error('error-room-cannot-be-closed-try-again');
		}
		throw e;
	} finally {
		await session.endSession();
	}

	// Note: when reaching this point, the room has been closed
	// Transaction is commited and so these messages can be sent here.
	return afterRoomClosed(newRoom, chatCloser, removedInquiryObj, params);
}

async function afterRoomClosed(
	newRoom: IOmnichannelRoom,
	chatCloser: ChatCloser,
	inquiry: ILivechatInquiryRecord | null,
	params: CloseRoomParams,
): Promise<void> {
	if (!chatCloser) {
		// this should never happen
		return;
	}
	// Note: we are okay with these messages being sent outside of the transaction. The process of sending a message
	// is huge and involves multiple db calls. Making it transactionable this way would be really hard.
	// And passing just _some_ actions to the transaction creates some deadlocks since messages are updated in the afterSaveMessages callbacks.
	const transcriptRequested =
		!!params.room.transcriptRequest || (!settings.get('Livechat_enable_transcript') && settings.get('Livechat_transcript_send_always'));
	logger.debug(`Sending closing message to room ${newRoom._id}`);
	await Message.saveSystemMessageAndNotifyUser('livechat-close', newRoom._id, params.comment ?? '', chatCloser, {
		groupable: false,
		transcriptRequested,
		...(isRoomClosedByVisitorParams(params) && { token: params.visitor.token }),
	});

	if (settings.get('Livechat_enable_transcript') && !settings.get('Livechat_transcript_send_always')) {
		await Message.saveSystemMessage('command', newRoom._id, 'promptTranscript', chatCloser);
	}

	logger.debug(`Running callbacks for room ${newRoom._id}`);

	process.nextTick(() => {
		/**
		 * @deprecated the `AppEvents.ILivechatRoomClosedHandler` event will be removed
		 * in the next major version of the Apps-Engine
		 */
		void Apps.self?.getBridges()?.getListenerBridge().livechatEvent(AppEvents.ILivechatRoomClosedHandler, newRoom);
		void Apps.self?.getBridges()?.getListenerBridge().livechatEvent(AppEvents.IPostLivechatRoomClosed, newRoom);
	});

	const visitor = isRoomClosedByVisitorParams(params) ? params.visitor : undefined;
	const opts = await parseTranscriptRequest(params.room, params.options, visitor);
	if (process.env.TEST_MODE) {
		await callbacks.run('livechat.closeRoom', {
			room: newRoom,
			options: opts,
		});
	} else {
		callbacks.runAsync('livechat.closeRoom', {
			room: newRoom,
			options: opts,
		});
	}

	void notifyOnRoomChangedById(newRoom._id);
	if (inquiry) {
		void notifyOnLivechatInquiryChanged(inquiry, 'removed');
	}

	logger.debug(`Room ${newRoom._id} was closed`);
}

async function doCloseRoom(
	params: CloseRoomParams,
	session: ClientSession,
): Promise<{ room: IOmnichannelRoom; closedBy: ChatCloser; removedInquiry: ILivechatInquiryRecord | null }> {
	const { comment } = params;
	const { room, forceClose } = params;

	logger.debug({ msg: `Attempting to close room`, roomId: room._id, forceClose });
	if (!room || !isOmnichannelRoom(room) || (!forceClose && !room.open)) {
		logger.debug(`Room ${room._id} is not open`);
		throw new Error('error-room-closed');
	}

	const commentRequired = settings.get('Livechat_request_comment_when_closing_conversation');
	if (commentRequired && !comment?.trim()) {
		throw new Error('error-comment-is-required');
	}

	const { updatedOptions: options } = await resolveChatTags(room, params.options);
	logger.debug(`Resolved chat tags for room ${room._id}`);

	const now = new Date();
	const { _id: rid, servedBy } = room;
	const serviceTimeDuration = servedBy && (now.getTime() - new Date(servedBy.ts).getTime()) / 1000;

	const closeData: IOmnichannelRoomClosingInfo = {
		closedAt: now,
		chatDuration: (now.getTime() - new Date(room.ts).getTime()) / 1000,
		...(serviceTimeDuration && { serviceTimeDuration }),
		...options,
	};
	logger.debug(`Room ${room._id} was closed at ${closeData.closedAt} (duration ${closeData.chatDuration})`);

	if (isRoomClosedByUserParams(params)) {
		const { user } = params;
		logger.debug(`Closing by user ${user?._id}`);
		closeData.closer = 'user';
		closeData.closedBy = {
			_id: user?._id || '',
			username: user?.username,
		};
	} else if (isRoomClosedByVisitorParams(params)) {
		const { visitor } = params;
		logger.debug(`Closing by visitor ${params.visitor._id}`);
		closeData.closer = 'visitor';
		closeData.closedBy = {
			_id: visitor._id,
			username: visitor.username,
		};
	} else {
		throw new Error('Error: Please provide details of the user or visitor who closed the room');
	}

	logger.debug(`Updating DB for room ${room._id} with close data`);

	const inquiry = await LivechatInquiry.findOneByRoomId(rid, { session });
	const removedInquiry = await LivechatInquiry.removeByRoomId(rid, { session });
	if (!params.forceClose && removedInquiry && removedInquiry.deletedCount !== 1) {
		throw new Error('Error removing inquiry');
	}

	const updatedRoom = await LivechatRooms.closeRoomById(rid, closeData, { session });
	if (!params.forceClose && (!updatedRoom || updatedRoom.modifiedCount !== 1)) {
		throw new Error('Error closing room');
	}

	const subs = await Subscriptions.countByRoomId(rid, { session });
	if (subs) {
		const removedSubs = await Subscriptions.removeByRoomId(rid, {
			async onTrash(doc) {
				void notifyOnSubscriptionChanged(doc, 'removed');
			},
			session,
		});

		if (!params.forceClose && removedSubs.deletedCount !== subs) {
			throw new Error('Error removing subscriptions');
		}
	}

	logger.debug(`DB updated for room ${room._id}`);

	// Retrieve the closed room
	const newRoom = await LivechatRooms.findOneById(rid, { session });
	if (!newRoom) {
		throw new Error('Error: Room not found');
	}

	return { room: newRoom, closedBy: closeData.closedBy, removedInquiry: inquiry };
}

async function resolveChatTags(
	room: IOmnichannelRoom,
	options: CloseRoomParams['options'] = {},
): Promise<{ updatedOptions: CloseRoomParams['options'] }> {
	logger.debug(`Resolving chat tags for room ${room._id}`);

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

	const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'requestTagBeforeClosingChat' | 'chatClosingTags'>>(
		departmentId,
		{
			projection: { requestTagBeforeClosingChat: 1, chatClosingTags: 1 },
		},
	);
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

export async function closeOpenChats(userId: string, comment?: string) {
	logger.debug(`Closing open chats for user ${userId}`);
	const user = await Users.findOneById(userId);

	const extraQuery = await callbacks.run('livechat.applyDepartmentRestrictions', {}, { userId });
	const openChats = LivechatRooms.findOpenByAgent(userId, extraQuery);
	const promises: Promise<void>[] = [];
	await openChats.forEach((room) => {
		promises.push(closeRoom({ user, room, comment }));
	});

	await Promise.all(promises);
}
