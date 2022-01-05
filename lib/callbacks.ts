import { Meteor } from 'meteor/meteor';

import type { Logger } from '../app/logger/server';
import { getRandomId } from './random';

enum CallbackPriority {
	HIGH = -1000,
	MEDIUM = 0,
	LOW = 1000,
}

type Hook =
	| 'afterActivateUser'
	| 'afterCreateChannel'
	| 'afterCreatePrivateGroup'
	| 'afterCreateUser'
	| 'afterDeactivateUser'
	| 'afterDeleteMessage'
	| 'afterDeleteRoom'
	| 'afterDeleteUser'
	| 'afterFileUpload'
	| 'afterJoinRoom'
	| 'afterLeaveRoom'
	| 'afterLogoutCleanUp'
	| 'afterProcessOAuthUser'
	| 'afterReadMessages'
	| 'afterRemoveFromRoom'
	| 'afterRoomArchived'
	| 'afterRoomNameChange'
	| 'afterSaveMessage'
	| 'afterSaveUser'
	| 'afterValidateLogin'
	| 'afterValidateNewOAuthUser'
	| 'archiveRoom'
	| 'beforeActivateUser'
	| 'beforeCreateRoom'
	| 'beforeCreateUser'
	| 'beforeGetMentions'
	| 'beforeJoinRoom'
	| 'beforeLeaveRoom'
	| 'beforeReadMessages'
	| 'beforeRemoveFromRoom'
	| 'beforeSaveMessage'
	| 'beforeSendMessageNotifications'
	| 'beforeValidateLogin'
	| 'cachedCollection-loadFromServer-rooms'
	| 'cachedCollection-loadFromServer-subscriptions'
	| 'cachedCollection-received-rooms'
	| 'cachedCollection-received-subscriptions'
	| 'cachedCollection-sync-rooms'
	| 'cachedCollection-sync-subscriptions'
	| 'enter-room'
	| 'livechat:afterOnHold'
	| 'livechat:afterOnHoldChatResumed'
	| 'livechat:afterReturnRoomAsInquiry'
	| 'livechat:onTransferFailure'
	| 'livechat.afterForwardChatToAgent'
	| 'livechat.afterForwardChatToDepartment'
	| 'livechat.afterInquiryQueued'
	| 'livechat.afterRemoveDepartment'
	| 'livechat.afterTakeInquiry'
	| 'livechat.agentStatusChanged'
	| 'livechat.applyDepartmentRestrictions'
	| 'livechat.applySimultaneousChatRestrictions'
	| 'livechat.beforeCloseRoom'
	| 'livechat.beforeDelegateAgent'
	| 'livechat.beforeForwardRoomToDepartment'
	| 'livechat.beforeInquiry'
	| 'livechat.beforeListTags'
	| 'livechat.beforeRoom'
	| 'livechat.beforeRouteChat'
	| 'livechat.chatQueued'
	| 'livechat.checkAgentBeforeTakeInquiry'
	| 'livechat.checkDefaultAgentOnNewRoom'
	| 'livechat.closeRoom'
	| 'livechat.leadCapture'
	| 'livechat.newRoom'
	| 'livechat.offlineMessage'
	| 'livechat.onAgentAssignmentFailed'
	| 'livechat.onCheckRoomApiParams'
	| 'livechat.onLoadConfigApi'
	| 'livechat.onLoadForwardDepartmentRestrictions'
	| 'livechat.onMaxNumberSimultaneousChatsReached'
	| 'livechat.removeAgentDepartment'
	| 'livechat.saveAgentDepartment'
	| 'livechat.saveInfo'
	| 'livechat.setUserStatusLivechat'
	| 'loginPageStateChange'
	| 'mapLDAPUserData'
	| 'oembed:afterParseContent'
	| 'oembed:beforeGetUrlContent'
	| 'on-business-hour-start'
	| 'onCreateUser'
	| 'onLDAPLogin'
	| 'onValidateLogin'
	| 'openBroadcast'
	| 'renderMessage'
	| 'renderNotification'
	| 'roomAnnouncementChanged'
	| 'roomAvatarChanged'
	| 'roomNameChanged'
	| 'roomTopicChanged'
	| 'roomTypeChanged'
	| 'setReaction'
	| 'streamMessage'
	| 'streamNewMessage'
	| 'unarchiveRoom'
	| 'unsetReaction'
	| 'userAvatarSet'
	| 'userConfirmationEmailRequested'
	| 'userForgotPasswordEmailRequested'
	| 'usernameSet'
	| 'userPasswordReset'
	| 'userRegistered'
	| 'userStatusManuallySet'
	| 'validateUserRoles'
	| 'workspaceLicenseChanged';

type Callback = {
	(item: unknown, constant?: unknown): unknown;
	hook: Hook;
	id: string;
	priority: CallbackPriority;
	stack: string;
};

type CallbackTracker = (callback: Callback) => () => void;

type HookTracker = (params: { hook: Hook; length: number }) => () => void;

class Callbacks {
	private logger: Logger | undefined = undefined;

	private trackCallback: CallbackTracker | undefined = undefined;

	private trackHook: HookTracker | undefined = undefined;

	private callbacks = new Map<Hook, Callback[]>();

	private sequentialRunners = new Map<Hook, (item: unknown, constant?: unknown) => unknown>();

	private asyncRunners = new Map<Hook, (item: unknown, constant?: unknown) => unknown>();

	readonly priority = CallbackPriority;

	setLogger(logger: Logger): void {
		this.logger = logger;
	}

	setMetricsTrackers({ trackCallback, trackHook }: { trackCallback?: CallbackTracker; trackHook?: HookTracker }): void {
		this.trackCallback = trackCallback;
		this.trackHook = trackHook;
	}

	private runOne(callback: Callback, item: unknown, constant: unknown): unknown {
		const stopTracking = this.trackCallback?.(callback);

		try {
			return callback(item, constant);
		} finally {
			stopTracking?.();
		}
	}

	private createSequentialRunner(hook: Hook, callbacks: Callback[]): (item: unknown, constant?: unknown) => unknown {
		const wrapCallback =
			(callback: Callback) =>
			(item: unknown, constant?: unknown): unknown => {
				this.logger?.debug(`Executing callback with id ${callback.id} for hook ${callback.hook}`);

				return this.runOne(callback, item, constant) ?? item;
			};

		const identity = <TItem>(item: TItem): TItem => item;

		const pipe =
			(curr: (item: unknown, constant?: unknown) => unknown, next: (item: unknown, constant?: unknown) => unknown) =>
			(item: unknown, constant?: unknown): unknown =>
				next(curr(item, constant), constant);

		const fn = callbacks.map(wrapCallback).reduce(pipe, identity);

		return (item: unknown, constant?: unknown): unknown => {
			const stopTracking = this.trackHook?.({ hook, length: callbacks.length });

			try {
				return fn(item, constant);
			} finally {
				stopTracking?.();
			}
		};
	}

	private createAsyncRunner(_: Hook, callbacks: Callback[]) {
		return (item: unknown, constant?: unknown): unknown => {
			if (typeof window !== 'undefined') {
				throw new Error('callbacks.runAsync on client server not allowed');
			}

			for (const callback of callbacks) {
				Meteor.defer(() => {
					this.runOne(callback, item, constant);
				});
			}

			return item;
		};
	}

	getCallbacks(hook: Hook): Callback[] {
		return this.callbacks.get(hook) ?? [];
	}

	setCallbacks(hook: Hook, callbacks: Callback[]): void {
		this.callbacks.set(hook, callbacks);
		this.sequentialRunners.set(hook, this.createSequentialRunner(hook, callbacks));
		this.asyncRunners.set(hook, this.createAsyncRunner(hook, callbacks));
	}

	/**
	 * Add a callback function to a hook
	 *
	 * @param hook the name of the hook
	 * @param callback the callback function
	 * @param priority the callback run priority (order)
	 * @param id human friendly name for this callback
	 */
	add<TItem, TConstant, TNextItem = TItem>(
		hook: Hook,
		callback: (item: TItem, constant?: TConstant) => TNextItem,
		priority = this.priority.MEDIUM,
		id = getRandomId(),
	): void {
		const callbacks = this.getCallbacks(hook);

		if (callbacks.some((cb) => cb.id === id)) {
			return;
		}

		callbacks.push(
			Object.assign(callback as Callback, {
				hook,
				priority,
				id,
				stack: new Error().stack,
			}),
		);
		const rank = (callback: Callback): number => callback.priority ?? this.priority.MEDIUM;
		callbacks.sort((a, b) => rank(a) - rank(b));

		this.setCallbacks(hook, callbacks);
	}

	/**
	 * Remove a callback from a hook
	 *
	 * @param hook the name of the hook
	 * @param id the callback's id
	 */
	remove(hook: Hook, id: string): void {
		const hooks = this.getCallbacks(hook).filter((callback) => callback.id !== id);
		this.setCallbacks(hook, hooks);
	}

	/**
	 * Successively run all of a hook's callbacks on an item
	 *
	 * @param hook the name of the hook
	 * @param item the post, comment, modifier, etc. on which to run the callbacks
	 * @param constant an optional constant that will be passed along to each callback
	 * @returns returns the item after it's been through all the callbacks for this hook
	 */
	run<TItem, TConstant, TNextItem = TItem>(hook: Hook, item: TItem, constant?: TConstant): TNextItem {
		const runner = this.sequentialRunners.get(hook) ?? ((item: TItem, _constant?: TConstant): TItem => item);
		return runner(item, constant) as TNextItem;
	}

	/**
	 * Successively run all of a hook's callbacks on an item, in async mode (only works on server)
	 *
	 * @param hook the name of the hook
	 * @param item the post, comment, modifier, etc. on which to run the callbacks
	 * @param constant an optional constant that will be passed along to each callback
	 * @returns the post, comment, modifier, etc. on which to run the callbacks
	 */
	runAsync<TItem, TConstant>(hook: Hook, item: TItem, constant?: TConstant): TItem {
		const runner = this.asyncRunners.get(hook) ?? ((item: TItem, _constant?: TConstant): TItem => item);
		return runner(item, constant) as TItem;
	}
}

/**
 * Callback hooks provide an easy way to add extra steps to common operations.
 * @deprecated
 */
export const callbacks = new Callbacks();
