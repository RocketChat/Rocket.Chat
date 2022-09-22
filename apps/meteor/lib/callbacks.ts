import type Url from 'url';

import { Meteor } from 'meteor/meteor';
import type { FilterOperators } from 'mongodb';
import type {
	IMessage,
	IRoom,
	IUser,
	ILivechatDepartmentRecord,
	ILivechatAgent,
	OmnichannelAgentStatus,
	ILivechatInquiryRecord,
	ILivechatVisitor,
	VideoConference,
	ParsedUrl,
	OEmbedMeta,
	OEmbedUrlContent,
} from '@rocket.chat/core-typings';

import type { Logger } from '../app/logger/server';
import type { IBusinessHourBehavior } from '../app/livechat/server/business-hour/AbstractBusinessHour';
import { getRandomId } from './random';
import type { ILoginAttempt } from '../app/authentication/server/ILoginAttempt';
import { compareByRanking } from './utils/comparisons';

enum CallbackPriority {
	HIGH = -1000,
	MEDIUM = 0,
	LOW = 1000,
}

/**
 * Callbacks returning void, like event listeners.
 *
 * TODO: move those to event-based systems
 */
type EventLikeCallbackSignatures = {
	'afterActivateUser': (user: IUser) => void;
	'afterCreateChannel': (owner: IUser, room: IRoom) => void;
	'afterCreatePrivateGroup': (owner: IUser, room: IRoom) => void;
	'afterDeactivateUser': (user: IUser) => void;
	'afterDeleteMessage': (message: IMessage, room: IRoom) => void;
	'validateUserRoles': (userData: Partial<IUser>) => void;
	'workspaceLicenseChanged': (license: string) => void;
	'afterReadMessages': (rid: IRoom['_id'], params: { uid: IUser['_id']; lastSeen: Date }) => void;
	'beforeReadMessages': (rid: IRoom['_id'], uid: IUser['_id']) => void;
	'afterDeleteUser': (user: IUser) => void;
	'afterFileUpload': (params: { user: IUser; room: IRoom; message: IMessage }) => void;
	'afterSaveMessage': (message: IMessage, room: IRoom, uid: string) => void;
	'livechat.removeAgentDepartment': (params: { departmentId: ILivechatDepartmentRecord['_id']; agentsId: ILivechatAgent['_id'][] }) => void;
	'livechat.saveAgentDepartment': (params: { departmentId: ILivechatDepartmentRecord['_id']; agentsId: ILivechatAgent['_id'][] }) => void;
	'livechat.closeRoom': (room: IRoom) => void;
	'livechat.saveRoom': (room: IRoom) => void;
	'livechat:afterReturnRoomAsInquiry': (params: { room: IRoom }) => void;
	'livechat.setUserStatusLivechat': (params: { userId: IUser['_id']; status: OmnichannelAgentStatus }) => void;
	'livechat.agentStatusChanged': (params: { userId: IUser['_id']; status: OmnichannelAgentStatus }) => void;
	'livechat.afterTakeInquiry': (inq: ILivechatInquiryRecord, agent: ILivechatAgent) => void;
	'afterAddedToRoom': (params: { user: IUser; inviter: IUser }, room: IRoom) => void;
	'beforeAddedToRoom': (params: { user: IUser; inviter: IUser }) => void;
	'afterCreateDirectRoom': (params: IRoom, second: { members: IUser[]; creatorId: IUser['_id'] }) => void;
	'beforeDeleteRoom': (params: IRoom) => void;
	'beforeJoinDefaultChannels': (user: IUser) => void;
	'beforeCreateChannel': (owner: IUser, room: IRoom) => void;
	'afterCreateRoom': (owner: IUser, room: IRoom) => void;
	'onValidateLogin': (login: ILoginAttempt) => void;
	'federation.afterCreateFederatedRoom': (room: IRoom, second: { owner: IUser; originalMemberList: string[] }) => void;
	'beforeCreateDirectRoom': (members: IUser[]) => void;
	'federation.beforeCreateDirectMessage': (members: IUser[]) => void;
	'federation.beforeAddUserAToRoom': (params: { user: IUser | string; inviter: IUser }, room: IRoom) => void;
	'onJoinVideoConference': (callId: VideoConference['_id'], userId?: IUser['_id']) => Promise<void>;
};

/**
 * Callbacks that are supposed to be composed like a chain.
 *
 * TODO: develop a middleware alternative and grant independence of execution order
 */
type ChainedCallbackSignatures = {
	'beforeSaveMessage': (message: IMessage, room?: IRoom) => IMessage;
	'afterCreateUser': (user: IUser) => IUser;
	'afterDeleteRoom': (rid: IRoom['_id']) => IRoom['_id'];
	'livechat:afterOnHold': (room: IRoom) => IRoom;
	'livechat:afterOnHoldChatResumed': (room: IRoom) => IRoom;
	'livechat:onTransferFailure': (params: { room: IRoom; guest: ILivechatVisitor; transferData: { [k: string]: string | any } }) => {
		room: IRoom;
		guest: ILivechatVisitor;
		transferData: { [k: string]: string | any };
	};
	'livechat.afterForwardChatToAgent': (params: { rid: IRoom['_id']; servedBy: unknown; oldServedBy: unknown }) => {
		rid: IRoom['_id'];
		servedBy: unknown;
		oldServedBy: unknown;
	};
	'livechat.afterForwardChatToDepartment': (params: {
		rid: IRoom['_id'];
		newDepartmentId: ILivechatDepartmentRecord['_id'];
		oldDepartmentId: ILivechatDepartmentRecord['_id'];
	}) => {
		rid: IRoom['_id'];
		newDepartmentId: ILivechatDepartmentRecord['_id'];
		oldDepartmentId: ILivechatDepartmentRecord['_id'];
	};
	'livechat.afterInquiryQueued': (inquiry: ILivechatInquiryRecord) => ILivechatInquiryRecord;
	'livechat.afterRemoveDepartment': (params: { departmentId: ILivechatDepartmentRecord['_id']; agentsId: ILivechatAgent['_id'][] }) => {
		departmentId: ILivechatDepartmentRecord['_id'];
		agentsId: ILivechatAgent['_id'][];
	};
	'livechat.applySimultaneousChatRestrictions': (_: undefined, params: { departmentId?: ILivechatDepartmentRecord['_id'] }) => undefined;
	'livechat.beforeCloseRoom': (params: { room: IRoom; options: unknown }) => { room: IRoom; options: unknown };
	'livechat.beforeDelegateAgent': (agent: ILivechatAgent, params: { department?: ILivechatDepartmentRecord }) => ILivechatAgent | null;
	'livechat.applyDepartmentRestrictions': (
		query: FilterOperators<ILivechatDepartmentRecord>,
		params: { userId: IUser['_id'] },
	) => FilterOperators<ILivechatDepartmentRecord>;
	'livechat.onMaxNumberSimultaneousChatsReached': (inquiry: ILivechatInquiryRecord) => ILivechatInquiryRecord;
	'on-business-hour-start': (params: { BusinessHourBehaviorClass: { new (): IBusinessHourBehavior } }) => {
		BusinessHourBehaviorClass: { new (): IBusinessHourBehavior };
	};
	'renderMessage': <T extends IMessage & { html: string }>(message: T) => T;
	'oembed:beforeGetUrlContent': (data: {
		urlObj: Omit<Url.UrlWithParsedQuery, 'host' | 'search'> & { host?: unknown; search?: unknown };
		parsedUrl: ParsedUrl;
	}) => {
		urlObj: Url.UrlWithParsedQuery;
		parsedUrl: ParsedUrl;
	};
	'oembed:afterParseContent': (data: {
		url: string;
		meta: OEmbedMeta;
		headers: { [k: string]: string };
		parsedUrl: ParsedUrl;
		content: OEmbedUrlContent;
	}) => {
		url: string;
		meta: OEmbedMeta;
		headers: { [k: string]: string };
		parsedUrl: ParsedUrl;
		content: OEmbedUrlContent;
	};
};

type Hook =
	| keyof EventLikeCallbackSignatures
	| keyof ChainedCallbackSignatures
	| 'afterJoinRoom'
	| 'afterLeaveRoom'
	| 'afterLogoutCleanUp'
	| 'afterProcessOAuthUser'
	| 'afterRemoveFromRoom'
	| 'afterRoomArchived'
	| 'afterRoomNameChange'
	| 'afterRoomTopicChange'
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
	| 'livechat.saveInfo'
	| 'loginPageStateChange'
	| 'mapLDAPUserData'
	| 'onCreateUser'
	| 'onLDAPLogin'
	| 'onValidateLogin'
	| 'openBroadcast'
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
	| 'userStatusManuallySet';

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
	add<THook extends keyof EventLikeCallbackSignatures>(
		hook: THook,
		callback: EventLikeCallbackSignatures[THook],
		priority?: CallbackPriority,
		id?: string,
	): void;

	add<THook extends keyof ChainedCallbackSignatures>(
		hook: THook,
		callback: ChainedCallbackSignatures[THook],
		priority?: CallbackPriority,
		id?: string,
	): void;

	add<TItem, TConstant, TNextItem = TItem>(
		hook: Hook,
		callback: (item: TItem, constant?: TConstant) => TNextItem,
		priority?: CallbackPriority,
		id?: string,
	): void;

	add(hook: Hook, callback: (item: unknown, constant?: unknown) => unknown, priority = this.priority.MEDIUM, id = getRandomId()): void {
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
		callbacks.sort(compareByRanking((callback: Callback): number => callback.priority ?? this.priority.MEDIUM));

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
	run<THook extends keyof EventLikeCallbackSignatures>(hook: THook, ...args: Parameters<EventLikeCallbackSignatures[THook]>): void;

	run<THook extends keyof ChainedCallbackSignatures>(
		hook: THook,
		...args: Parameters<ChainedCallbackSignatures[THook]>
	): ReturnType<ChainedCallbackSignatures[THook]>;

	run<TItem, TConstant, TNextItem = TItem>(hook: Hook, item: TItem, constant?: TConstant): TNextItem;

	run(hook: Hook, item: unknown, constant?: unknown): unknown {
		const runner = this.sequentialRunners.get(hook) ?? ((item: unknown, _constant?: unknown): unknown => item);
		return runner(item, constant);
	}

	/**
	 * Successively run all of a hook's callbacks on an item, in async mode (only works on server)
	 *
	 * @param hook the name of the hook
	 * @param item the post, comment, modifier, etc. on which to run the callbacks
	 * @param constant an optional constant that will be passed along to each callback
	 * @returns the post, comment, modifier, etc. on which to run the callbacks
	 */
	runAsync<THook extends keyof EventLikeCallbackSignatures>(hook: THook, ...args: Parameters<EventLikeCallbackSignatures[THook]>): void;

	runAsync(hook: Hook, item: unknown, constant?: unknown): unknown {
		const runner = this.asyncRunners.get(hook) ?? ((item: unknown, _constant?: unknown): unknown => item);
		return runner(item, constant);
	}
}

/**
 * Callback hooks provide an easy way to add extra steps to common operations.
 * @deprecated
 */
export const callbacks = new Callbacks();
