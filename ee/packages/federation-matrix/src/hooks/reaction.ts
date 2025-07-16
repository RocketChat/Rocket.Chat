import { Settings } from '@rocket.chat/core-services';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { isMessageFromMatrixFederation } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Rooms } from '@rocket.chat/models';

import type { FederationMatrix } from '../FederationMatrix';
import type { ICallbacks } from '../types/ICallbacks';

const logger = new Logger('federation-matrix:reaction');

export function reaction(federationMatrixService: FederationMatrix, callbacks: ICallbacks) {
	callbacks.add(
		'afterSetReaction',
		async (message: IMessage, params: { user: IUser; reaction: string }): Promise<void> => {
			await handleReactionAdded(federationMatrixService, message, params.user, params.reaction);
		},
		callbacks.priority.HIGH,
		'federation-matrix-after-set-reaction',
	);

	callbacks.add(
		'afterUnsetReaction',
		async (_message: IMessage, params: { user: IUser; reaction: string; oldMessage: IMessage }): Promise<void> => {
			await handleReactionRemoved(federationMatrixService, params.oldMessage, params.user, params.reaction);
		},
		callbacks.priority.HIGH,
		'federation-matrix-after-unset-reaction',
	);
}

async function handleReactionAdded(
	federationMatrixService: FederationMatrix,
	message: IMessage,
	user: IUser,
	reactionString: string,
): Promise<void> {
	try {
		if (!(await shouldHandleReaction(federationMatrixService, message, user))) {
			return;
		}

		await federationMatrixService.sendReaction(message._id, reactionString, user);
	} catch (error) {
		logger.error('Failed to handle reaction added:', error);
	}
}

async function handleReactionRemoved(
	federationMatrixService: FederationMatrix,
	message: IMessage,
	user: IUser,
	reactionString: string,
): Promise<void> {
	try {
		if (!(await shouldHandleReaction(federationMatrixService, message, user))) {
			return;
		}

		await federationMatrixService.removeReaction(message._id, reactionString, user);
	} catch (error) {
		logger.error('Failed to handle reaction removed:', error);
	}
}

async function shouldHandleReaction(federationMatrixService: FederationMatrix, message: IMessage, user: IUser): Promise<boolean> {
	try {
		const room = await Rooms.findOneById(message.rid);
		if (!room?.federated) {
			return false;
		}

		if (!isMessageFromMatrixFederation(message)) {
			return false;
		}

		if (user.federated) {
			return false;
		}

		const matrixDomain = await federationMatrixService.getMatrixDomain();
		if (user.username?.includes(':') && !user.username.endsWith(`:${matrixDomain}`)) {
			return false;
		}

		const federationEnabled = await Settings.get<boolean>('Federation_Matrix_enabled');
		if (!federationEnabled) {
			return false;
		}

		return true;
	} catch (error) {
		logger.error('Error in shouldHandleReaction:', error);
		return false;
	}
}
