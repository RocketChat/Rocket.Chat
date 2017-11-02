/* globals SystemLogger */
import {searchProviders} from '../../lib/SearchProviderRegistry';

const callbackIds = {
	MESSAGE: 'search-on-message',
	USER_ADDED: 'search-on-user-added',
	USER_REMOVED: 'search-on-user-removed'
};

/**
 * Since a search provider often uses an external system, the integration involves protocolas such as http
 * which might be subject to failure.
 * This class provides a persistent buffer for incompleted hooks
 */
class ReplayBuffer {

	constructor() {
		this.buffer = []; // todo: provide a collection
	}

	recordFailure(error, callbackId, parameters) {
		this.buffer.push({
			error,
			callbackId,
			parameters
		});
	}
}

/**
 * This class provides hook-methods with appropriate signature and wrap the actual provider.
 * In addition to adapting to the interface, this class can provide logging and buffering in case
 * the handler cannot execute
 */
class ActiveProviderProxy {
	constructor() {
		this.replayBuffer = new ReplayBuffer();

		searchProviders.activeProvider
			? this.activeProviderRuntimeIntegration = searchProviders.activeProvider.runtimeIntegration
			: null;
	}

	afterSaveMessage(message, room, userId) {
		if (this.activeProviderRuntimeIntegration) {
			try {
				this.activeProviderRuntimeIntegration.onMessageSent(message, SystemLogger);
			} catch (error) {
				this.replayBuffer.recordFailure(error, callbackIds.MESSAGE, { message, room, userId });
			}
		}
	}

	afterJoinRoom(user, room) {
		if (this.activeProviderRuntimeIntegration) {
			try {
				this.activeProviderRuntimeIntegration.onUserAdded(user, room, SystemLogger);
			} catch (error) {
				this.replayBuffer.recordFailure(error, callbackIds.USER_ADDED, {user, room});
			}
		}
	}

	afterLeaveRoom(user, room) {
		if (this.activeProviderRuntimeIntegration) {
			try {
				this.activeProviderRuntimeIntegration.onUserRemoved(user, room, SystemLogger);
			} catch (error) {
				this.replayBuffer.recordFailure(error, callbackIds.USER_REMOVED, {user, room});
			}
		}
	}
}

export function registerHooks() {
	const facade = new ActiveProviderProxy();

	RocketChat.callbacks.add('afterSaveMessage', facade.afterSaveMessage, RocketChat.callbacks.priority.LOW, callbackIds.MESSAGE);
	RocketChat.callbacks.add('afterJoinRoom', facade.afterJoinRoom, RocketChat.callbacks.priority.LOW, callbackIds.USER_ADDED);
	RocketChat.callbacks.add('afterLeaveRoom', facade.afterLeaveRoom, RocketChat.callbacks.priority.LOW, callbackIds.USER_REMOVED);
}
