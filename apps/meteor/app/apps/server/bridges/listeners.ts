import type { IAppServerOrchestrator, IAppsMessage, IAppsRoom, IAppsUser, IAppsLivechatRoom, AppEvents } from '@rocket.chat/apps';
import { LivechatTransferEventType } from '@rocket.chat/apps-engine/definition/livechat';
import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import type { IUserContext, IUserUpdateContext } from '@rocket.chat/apps-engine/definition/users';
import type { IListenerExecutor } from '@rocket.chat/apps-engine/server/managers/AppListenerManager';
import type { IMessage, IRoom, IUser, ILivechatDepartment } from '@rocket.chat/core-typings';

type LivechatTransferData = {
	type: LivechatTransferEventType;
	room: string;
	from: string;
	to: string;
};

type LivechatAgentData = {
	room: IRoom;
	user: IUser;
};

type UserStatusChangedData = {
	user: IUser;
	currentStatus: string;
	previousStatus: string;
};

type UserCrudData = {
	user: IUser;
	performedBy: IUser;
	previousUser?: IUser;
};

export class AppListenerBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {}

	async handleEvent(event: AppEvents, ...payload: unknown[]): Promise<any> {
		// eslint-disable-next-line complexity
		const method = ((): keyof Omit<AppListenerBridge, 'handleEvent' | 'orch'> => {
			switch (event) {
				case AppInterface.IPostSystemMessageSent:
				case AppInterface.IPreMessageSentPrevent:
				case AppInterface.IPreMessageSentExtend:
				case AppInterface.IPreMessageSentModify:
				case AppInterface.IPostMessageSent:
				case AppInterface.IPreMessageDeletePrevent:
				case AppInterface.IPostMessageDeleted:
				case AppInterface.IPreMessageUpdatedPrevent:
				case AppInterface.IPreMessageUpdatedExtend:
				case AppInterface.IPreMessageUpdatedModify:
				case AppInterface.IPostMessageUpdated:
				case AppInterface.IPostMessageReacted:
				case AppInterface.IPostMessageFollowed:
				case AppInterface.IPostMessagePinned:
				case AppInterface.IPostMessageStarred:
				case AppInterface.IPostMessageReported:
					return 'messageEvent';
				case AppInterface.IPreRoomCreatePrevent:
				case AppInterface.IPreRoomCreateExtend:
				case AppInterface.IPreRoomCreateModify:
				case AppInterface.IPostRoomCreate:
				case AppInterface.IPreRoomDeletePrevent:
				case AppInterface.IPostRoomDeleted:
				case AppInterface.IPreRoomUserJoined:
				case AppInterface.IPostRoomUserJoined:
				case AppInterface.IPreRoomUserLeave:
				case AppInterface.IPostRoomUserLeave:
					return 'roomEvent';
				/**
				 * @deprecated please prefer the AppInterface.IPostLivechatRoomClosed event
				 */
				case AppInterface.ILivechatRoomClosedHandler:
				case AppInterface.IPreLivechatRoomCreatePrevent:
				case AppInterface.IPostLivechatRoomStarted:
				case AppInterface.IPostLivechatRoomClosed:
				case AppInterface.IPostLivechatAgentAssigned:
				case AppInterface.IPostLivechatAgentUnassigned:
				case AppInterface.IPostLivechatRoomTransferred:
				case AppInterface.IPostLivechatGuestSaved:
				case AppInterface.IPostLivechatRoomSaved:
				case AppInterface.IPostLivechatDepartmentRemoved:
				case AppInterface.IPostLivechatDepartmentDisabled:
					return 'livechatEvent';
				case AppInterface.IPostUserCreated:
				case AppInterface.IPostUserUpdated:
				case AppInterface.IPostUserDeleted:
				case AppInterface.IPostUserLoggedIn:
				case AppInterface.IPostUserLoggedOut:
				case AppInterface.IPostUserStatusChanged:
					return 'userEvent';
				default:
					return 'defaultEvent';
			}
		})();

		// Using type assertion here because TypeScript doesn't understand that method is a valid method name
		return this[method](event as keyof IListenerExecutor, Array.isArray(payload) ? payload : [payload]);
	}

	async defaultEvent(inte: keyof IListenerExecutor, payload: unknown): Promise<unknown> {
		return this.orch
			.getManager()
			.getListenerManager()
			.executeListener(inte, payload as any); // We're delegating the payload validation to the method being called
	}

	async messageEvent(inte: keyof IListenerExecutor, data: unknown): Promise<boolean | IMessage | undefined> {
		const [message, ...payload] = data as [IMessage, ...unknown[]];

		const msg = await this.orch.getConverters().get('messages').convertMessage(message);

		const params = ((): IAppsMessage | { message: IAppsMessage; user: IAppsUser; [key: string]: any } => {
			switch (inte) {
				case AppInterface.IPostMessageDeleted:
					const [userDeleted] = payload as [IUser];
					return {
						message: msg,
						user: this.orch.getConverters().get('users').convertToApp(userDeleted),
					};
				case AppInterface.IPostMessageReacted:
					const [userReacted, reaction, isReacted] = payload as [IUser, string, boolean];
					return {
						message: msg,
						user: this.orch.getConverters().get('users').convertToApp(userReacted),
						reaction,
						isReacted,
					};
				case AppInterface.IPostMessageFollowed:
					const [userFollowed, isUnfollow] = payload as [IUser, boolean];
					return {
						message: msg,
						user: this.orch.getConverters().get('users').convertToApp(userFollowed),
						isUnfollow,
					};
				case AppInterface.IPostMessagePinned:
					const [userPinned, isUnpinned] = payload as [IUser, boolean];
					return {
						message: msg,
						user: this.orch.getConverters().get('users').convertToApp(userPinned),
						isUnpinned,
					};
				case AppInterface.IPostMessageStarred:
					const [userStarred, isStarred] = payload as [IUser, boolean];
					return {
						message: msg,
						user: this.orch.getConverters().get('users').convertToApp(userStarred),
						isStarred,
					};
				case AppInterface.IPostMessageReported:
					const [userReported, reason] = payload as [IUser, string];
					return {
						message: msg,
						user: this.orch.getConverters().get('users').convertToApp(userReported),
						reason,
					};
				default:
					return msg;
			}
		})();

		const result: unknown = await this.orch.getManager().getListenerManager().executeListener(inte, params);

		if (typeof result === 'boolean') {
			return result;
		}

		return this.orch
			.getConverters()
			.get('messages')
			.convertAppMessage(result as IAppsMessage);
	}

	async roomEvent(inte: keyof IListenerExecutor, data: unknown): Promise<boolean | IRoom | IAppsRoom | IAppsLivechatRoom | undefined> {
		const [room, ...payload] = data as [IRoom, ...unknown[]];

		const rm = await this.orch.getConverters().get('rooms').convertRoom(room);

		const params = ((): IAppsRoom | IAppsLivechatRoom | { room: IAppsRoom | IAppsLivechatRoom; [key: string]: any } => {
			switch (inte) {
				case AppInterface.IPreRoomUserJoined:
				case AppInterface.IPostRoomUserJoined:
					const [joiningUser, invitingUser] = payload as [IUser, IUser];
					return {
						room: rm,
						joiningUser: this.orch.getConverters().get('users').convertToApp(joiningUser),
						invitingUser: this.orch.getConverters().get('users').convertToApp(invitingUser),
					};
				case AppInterface.IPreRoomUserLeave:
				case AppInterface.IPostRoomUserLeave:
					const [leavingUser, removedBy] = payload as [IUser, IUser];
					return {
						room: rm,
						leavingUser: this.orch.getConverters().get('users').convertToApp(leavingUser),
						removedBy: this.orch.getConverters().get('users').convertToApp(removedBy),
					};
				default:
					return rm;
			}
		})();

		const result: unknown = await this.orch
			.getManager()
			.getListenerManager()
			.executeListener(inte, params as any); // We're delegating the payload validation to the method being called

		if (typeof result === 'boolean') {
			return result;
		}

		return this.orch
			.getConverters()
			.get('rooms')
			.convertAppRoom(result as IAppsRoom);
	}

	async livechatEvent(inte: keyof IListenerExecutor, data: unknown): Promise<unknown> {
		switch (inte) {
			case AppInterface.IPostLivechatAgentAssigned:
			case AppInterface.IPostLivechatAgentUnassigned:
				const agentData = data as LivechatAgentData;
				return this.orch
					.getManager()
					.getListenerManager()
					.executeListener(inte, {
						room: (await this.orch.getConverters().get('rooms').convertRoom(agentData.room)) as IAppsLivechatRoom,
						agent: this.orch.getConverters().get('users').convertToApp(agentData.user),
					});

			case AppInterface.IPostLivechatRoomTransferred: {
				const transferData = data as LivechatTransferData;
				const converter = transferData.type === LivechatTransferEventType.AGENT ? 'users' : 'departments';

				const room = await this.orch.getConverters().get('rooms').convertById(transferData.room);
				const from = await this.orch.getConverters().get(converter).convertById(transferData.from);
				const to = await this.orch.getConverters().get(converter).convertById(transferData.to);

				if (!room) {
					throw new Error(`Room with id ${transferData.room} not found`);
				}

				if (!from) {
					throw new Error(`Transfer from entity with id ${transferData.from} not found`);
				}

				if (!to) {
					throw new Error(`Transfer to entity with id ${transferData.to} not found`);
				}

				return this.orch.getManager().getListenerManager().executeListener(inte, {
					room,
					from,
					to,
					type: transferData.type,
				});
			}

			case AppInterface.IPostLivechatGuestSaved: {
				const visitor = await this.orch
					.getConverters()
					.get('visitors')
					.convertById(data as string);

				if (!visitor) {
					throw new Error(`Visitor with id ${data as string} not found`);
				}

				return this.orch.getManager().getListenerManager().executeListener(inte, visitor);
			}

			case AppInterface.IPostLivechatRoomSaved: {
				const room = await this.orch
					.getConverters()
					.get('rooms')
					.convertById(data as string);

				if (!room) {
					throw new Error(`Room with id ${data as string} not found`);
				}

				return this.orch
					.getManager()
					.getListenerManager()
					.executeListener(inte, room as IAppsLivechatRoom);
			}

			case AppInterface.IPostLivechatDepartmentDisabled: {
				const department = await this.orch
					.getConverters()
					.get('departments')
					.convertDepartment(data as ILivechatDepartment);

				if (!department) {
					throw new Error(`Department ${data} not found`);
				}

				return this.orch.getManager().getListenerManager().executeListener(inte, { department });
			}

			case AppInterface.IPostLivechatDepartmentRemoved: {
				const department = await this.orch
					.getConverters()
					.get('departments')
					.convertDepartment(data as ILivechatDepartment);

				if (!department) {
					throw new Error(`Department ${data} not found`);
				}

				return this.orch.getManager().getListenerManager().executeListener(inte, { department });
			}

			default:
				const room = await this.orch
					.getConverters()
					.get('rooms')
					.convertRoom(data as IRoom);

				return this.orch.getManager().getListenerManager().executeListener(inte, room);
		}
	}

	async userEvent(inte: keyof IListenerExecutor, data: unknown): Promise<unknown> {
		switch (inte) {
			case AppInterface.IPostUserLoggedIn:
			case AppInterface.IPostUserLoggedOut: {
				const loginData = data as { user: IUser };
				const context = this.orch.getConverters().get('users').convertToApp(loginData.user);
				return this.orch.getManager().getListenerManager().executeListener(inte, context);
			}
			case AppInterface.IPostUserStatusChanged: {
				const statusData = data as UserStatusChangedData;
				const { currentStatus, previousStatus } = statusData;
				const context = {
					user: this.orch.getConverters().get('users').convertToApp(statusData.user),
					currentStatus,
					previousStatus,
				};

				return this.orch.getManager().getListenerManager().executeListener(inte, context);
			}
			case AppInterface.IPostUserCreated:
			case AppInterface.IPostUserUpdated:
			case AppInterface.IPostUserDeleted: {
				const crudData = data as UserCrudData;
				const context: IUserContext | IUserUpdateContext = {
					user: this.orch.getConverters().get('users').convertToApp(crudData.user),
					performedBy: this.orch.getConverters().get('users').convertToApp(crudData.performedBy),
				};

				if (inte === AppInterface.IPostUserUpdated && crudData.previousUser) {
					(context as IUserUpdateContext).previousData = this.orch.getConverters().get('users').convertToApp(crudData.previousUser);
				}

				return this.orch.getManager().getListenerManager().executeListener(inte, context);
			}
		}
	}
}
