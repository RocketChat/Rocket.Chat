import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

import type { IAppServerOrchestrator, IAppsRoom, IAppsLivechatRoom, IAppsMessage } from '@rocket.chat/apps';
import type { IPreEmailSentContext } from '@rocket.chat/apps-engine/definition/email';
import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import { LivechatTransferEventType } from '@rocket.chat/apps-engine/definition/livechat';
import { isLivechatRoom } from '@rocket.chat/apps-engine/definition/livechat/ILivechatRoom';
import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import type { UIKitIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit';
import type { IUIKitLivechatIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/livechat';
import type { IUserContext, IUserUpdateContext } from '@rocket.chat/apps-engine/definition/users';
import type { IMessage, IRoom, IUser, ILivechatDepartment, IUpload } from '@rocket.chat/core-typings';

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
	performedBy?: IUser;
	previousUser?: IUser;
};

// IPostMessageSentToBot is an internally triggered event, based on IPostMessageSent
// so we don't add it here
type HandleMessageEvent =
	| {
			event: AppInterface.IPostMessageDeleted;
			payload: [IMessage, IUser];
	  }
	| {
			event: AppInterface.IPostMessageReacted;
			payload: [IMessage, IUser, string, boolean];
	  }
	| {
			event: AppInterface.IPostMessageFollowed;
			payload: [IMessage, IUser, boolean];
	  }
	| {
			event: AppInterface.IPostMessagePinned;
			payload: [IMessage, IUser, boolean];
	  }
	| {
			event: AppInterface.IPostMessageStarred;
			payload: [IMessage, IUser, boolean];
	  }
	| {
			event: AppInterface.IPostMessageReported;
			payload: [IMessage, IUser, string];
	  }
	| {
			event:
				| AppInterface.IPostSystemMessageSent
				| AppInterface.IPreMessageSentPrevent
				| AppInterface.IPreMessageSentExtend
				| AppInterface.IPreMessageSentModify
				| AppInterface.IPostMessageSent
				| AppInterface.IPreMessageDeletePrevent
				| AppInterface.IPreMessageUpdatedPrevent
				| AppInterface.IPreMessageUpdatedExtend
				| AppInterface.IPreMessageUpdatedModify
				| AppInterface.IPostMessageUpdated;
			payload: [IMessage];
	  };

type HandleRoomEvent =
	| {
			event: AppInterface.IPreRoomUserJoined | AppInterface.IPostRoomUserJoined;
			payload: [IRoom, IUser, IUser];
	  }
	| {
			event: AppInterface.IPreRoomUserLeave | AppInterface.IPostRoomUserLeave;
			payload: [IRoom, IUser, IUser];
	  }
	| {
			event:
				| AppInterface.IPreRoomCreatePrevent
				| AppInterface.IPreRoomCreateExtend
				| AppInterface.IPreRoomCreateModify
				| AppInterface.IPostRoomCreate
				| AppInterface.IPreRoomDeletePrevent
				| AppInterface.IPostRoomDeleted
				| AppInterface.IPreRoomUserJoined
				| AppInterface.IPostRoomUserJoined
				| AppInterface.IPreRoomUserLeave
				| AppInterface.IPostRoomUserLeave;
			payload: [IRoom];
	  };

type HandleLivechatEvent =
	| {
			event: AppInterface.IPostLivechatAgentAssigned | AppInterface.IPostLivechatAgentUnassigned;
			payload: [LivechatAgentData];
	  }
	| {
			event: AppInterface.IPostLivechatRoomTransferred;
			payload: [LivechatTransferData];
	  }
	| {
			event: AppInterface.IPostLivechatGuestSaved;
			payload: [string];
	  }
	| {
			event: AppInterface.IPostLivechatRoomSaved;
			payload: [string];
	  }
	| {
			event: AppInterface.IPostLivechatDepartmentRemoved;
			payload: [ILivechatDepartment];
	  }
	| {
			event: AppInterface.IPostLivechatDepartmentDisabled;
			payload: [ILivechatDepartment];
	  }
	| {
			event:
				| AppInterface.ILivechatRoomClosedHandler
				| AppInterface.IPreLivechatRoomCreatePrevent
				| AppInterface.IPostLivechatRoomStarted
				| AppInterface.IPostLivechatRoomClosed;
			payload: [IRoom];
	  };

type HandleUserEvent =
	| {
			event: AppInterface.IPostUserLoggedIn | AppInterface.IPostUserLoggedOut;
			payload: [IUser];
	  }
	| {
			event: AppInterface.IPostUserStatusChanged;
			payload: [UserStatusChangedData];
	  }
	| {
			event: AppInterface.IPostUserDeleted | AppInterface.IPostUserCreated | AppInterface.IPostUserUpdated;
			payload: [UserCrudData];
	  };

type HandleDefaultEvent =
	| {
			event: AppInterface.IPostExternalComponentOpened | AppInterface.IPostExternalComponentClosed;
			payload: [IExternalComponent];
	  }
	| {
			event: AppInterface.IUIKitInteractionHandler;
			payload: [UIKitIncomingInteraction];
	  }
	| {
			event: AppInterface.IUIKitLivechatInteractionHandler;
			payload: [IUIKitLivechatIncomingInteraction];
	  }
	| {
			event: AppInterface.IPreEmailSent;
			payload: [IPreEmailSentContext];
	  };

type HandleFileUploadEvent = {
	event: AppInterface.IPreFileUpload | AppInterface.IPreFileUploadStream;
	payload: [file: IUpload, content: Buffer];
};

type HandleEvent =
	| HandleMessageEvent
	| HandleRoomEvent
	| HandleLivechatEvent
	| HandleUserEvent
	| HandleFileUploadEvent
	| HandleDefaultEvent;

export class AppListenerBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {}

	// eslint-disable-next-line complexity
	async handleEvent(args: HandleEvent): Promise<any> {
		switch (args.event) {
			case AppInterface.IPreFileUpload:
			case AppInterface.IPreFileUploadStream:
				return this.uploadEvent(args);
			case AppInterface.IPostMessageDeleted:
			case AppInterface.IPostMessageReacted:
			case AppInterface.IPostMessageFollowed:
			case AppInterface.IPostMessagePinned:
			case AppInterface.IPostMessageStarred:
			case AppInterface.IPostMessageReported:
			case AppInterface.IPostSystemMessageSent:
			case AppInterface.IPreMessageSentPrevent:
			case AppInterface.IPreMessageSentExtend:
			case AppInterface.IPreMessageSentModify:
			case AppInterface.IPostMessageSent:
			case AppInterface.IPreMessageDeletePrevent:
			case AppInterface.IPreMessageUpdatedPrevent:
			case AppInterface.IPreMessageUpdatedExtend:
			case AppInterface.IPreMessageUpdatedModify:
			case AppInterface.IPostMessageUpdated:
				return this.messageEvent(args);
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
				return this.roomEvent(args);
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
				return this.livechatEvent(args);
			case AppInterface.IPostUserCreated:
			case AppInterface.IPostUserUpdated:
			case AppInterface.IPostUserDeleted:
			case AppInterface.IPostUserLoggedIn:
			case AppInterface.IPostUserLoggedOut:
			case AppInterface.IPostUserStatusChanged:
				return this.userEvent(args);
			default:
				return this.defaultEvent(args);
		}
	}

	async defaultEvent(args: HandleDefaultEvent): Promise<unknown> {
		return this.orch.getManager().getListenerManager().executeListener(args.event, args.payload[0]);
	}

	async uploadEvent(args: HandleFileUploadEvent): Promise<void> {
		const [file, content] = args.payload;

		const tmpfile = path.join(os.tmpdir(), crypto.randomUUID());
		await fs.promises.writeFile(tmpfile, content);

		const appFile = await this.orch.getConverters().get('uploads').convertToApp(file);

		await this.orch.getManager().getListenerManager().executeListener(args.event, { file: appFile, path: tmpfile });
	}

	async messageEvent(args: HandleMessageEvent): Promise<boolean | IMessage | undefined> {
		const [message] = args.payload;

		const msg = await this.orch.getConverters().get('messages').convertMessage(message);

		const result = await (() => {
			switch (args.event) {
				case AppInterface.IPostMessageDeleted:
					const [, userDeleted] = args.payload;
					return this.orch
						.getManager()
						.getListenerManager()
						.executeListener(args.event, {
							message: msg,
							user: this.orch.getConverters().get('users').convertToApp(userDeleted),
						});
				case AppInterface.IPostMessageReacted:
					const [, userReacted, reaction, isReacted] = args.payload;
					return this.orch
						.getManager()
						.getListenerManager()
						.executeListener(args.event, {
							message: msg,
							user: this.orch.getConverters().get('users').convertToApp(userReacted),
							reaction,
							isReacted,
						});
				case AppInterface.IPostMessageFollowed:
					const [, userFollowed, isFollowed] = args.payload;
					return this.orch
						.getManager()
						.getListenerManager()
						.executeListener(args.event, {
							message: msg,
							user: this.orch.getConverters().get('users').convertToApp(userFollowed),
							isFollowed,
						});
				case AppInterface.IPostMessagePinned:
					const [, userPinned, isPinned] = args.payload;
					return this.orch
						.getManager()
						.getListenerManager()
						.executeListener(args.event, {
							message: msg,
							user: this.orch.getConverters().get('users').convertToApp(userPinned),
							isPinned,
						});
				case AppInterface.IPostMessageStarred:
					const [, userStarred, isStarred] = args.payload;
					return this.orch
						.getManager()
						.getListenerManager()
						.executeListener(args.event, {
							message: msg,
							user: this.orch.getConverters().get('users').convertToApp(userStarred),
							isStarred,
						});
				case AppInterface.IPostMessageReported:
					const [, userReported, reason] = args.payload;
					return this.orch
						.getManager()
						.getListenerManager()
						.executeListener(args.event, {
							message: msg,
							user: this.orch.getConverters().get('users').convertToApp(userReported),
							reason,
						});
				default:
					return this.orch.getManager().getListenerManager().executeListener(args.event, msg);
			}
		})();

		// TODO: weird that boolean is not returned by executeListener
		if (typeof result === 'boolean' || result === undefined) {
			return result ?? undefined;
		}

		return this.orch
			.getConverters()
			.get('messages')
			.convertAppMessage(result as IAppsMessage);
	}

	async roomEvent(args: HandleRoomEvent): Promise<boolean | IRoom | IAppsRoom | IAppsLivechatRoom | undefined> {
		const [room] = args.payload;

		const rm = await this.orch.getConverters().get('rooms').convertRoom(room);

		const result = await (() => {
			switch (args.event) {
				case AppInterface.IPreRoomUserJoined:
				case AppInterface.IPostRoomUserJoined:
					const [, joiningUser, invitingUser] = args.payload;
					return this.orch
						.getManager()
						.getListenerManager()
						.executeListener(args.event, {
							room: rm,
							joiningUser: this.orch.getConverters().get('users').convertToApp(joiningUser)!,
							inviter: this.orch.getConverters().get('users').convertToApp(invitingUser),
						});
				case AppInterface.IPreRoomUserLeave:
				case AppInterface.IPostRoomUserLeave:
					const [, leavingUser, removedBy] = args.payload;
					return this.orch
						.getManager()
						.getListenerManager()
						.executeListener(args.event, {
							room: rm,
							leavingUser: this.orch.getConverters().get('users').convertToApp(leavingUser)!,
							removedBy: this.orch.getConverters().get('users').convertToApp(removedBy),
						});
				default:
					return this.orch.getManager().getListenerManager().executeListener(args.event, rm);
			}
		})();

		if (typeof result === 'boolean' || result === undefined) {
			return result ?? undefined;
		}

		return this.orch.getConverters().get('rooms').convertAppRoom(result);
	}

	async livechatEvent(args: HandleLivechatEvent): Promise<unknown> {
		switch (args.event) {
			case AppInterface.IPostLivechatAgentAssigned:
			case AppInterface.IPostLivechatAgentUnassigned:
				const [agentData] = args.payload;
				return this.orch
					.getManager()
					.getListenerManager()
					.executeListener(args.event, {
						room: (await this.orch.getConverters().get('rooms').convertRoom(agentData.room)) as IAppsLivechatRoom,
						agent: this.orch.getConverters().get('users').convertToApp(agentData.user),
					});

			case AppInterface.IPostLivechatRoomTransferred: {
				const [transferData] = args.payload;
				const converter = transferData.type === LivechatTransferEventType.AGENT ? 'users' : 'departments';

				const room = await this.orch.getConverters().get('rooms').convertById(transferData.room);
				const from = await this.orch.getConverters().get(converter).convertById(transferData.from);
				const to = await this.orch.getConverters().get(converter).convertById(transferData.to);

				if (!room) {
					throw new Error(`Room with id ${transferData.room} not found`);
				}

				if (!to) {
					throw new Error(`Transfer to entity with id ${transferData.to} not found`);
				}

				return this.orch
					.getManager()
					.getListenerManager()
					.executeListener(args.event, {
						room,
						from: from as NonNullable<typeof from>, // type definition in the apps-engine seems to be incorrect
						to,
						type: transferData.type,
					});
			}

			case AppInterface.IPostLivechatGuestSaved: {
				const [visitorId] = args.payload;
				const visitor = await this.orch.getConverters().get('visitors').convertById(visitorId);

				if (!visitor) {
					throw new Error(`Visitor with id ${visitorId} not found`);
				}

				return this.orch.getManager().getListenerManager().executeListener(args.event, visitor);
			}

			case AppInterface.IPostLivechatRoomSaved: {
				const [roomId] = args.payload;
				const room = await this.orch.getConverters().get('rooms').convertById(roomId);

				if (!room) {
					throw new Error(`Room with id ${roomId} not found`);
				}

				return this.orch
					.getManager()
					.getListenerManager()
					.executeListener(args.event, room as IAppsLivechatRoom);
			}

			case AppInterface.IPostLivechatDepartmentDisabled: {
				const [departmentData] = args.payload;
				const department = await this.orch.getConverters().get('departments').convertDepartment(departmentData);

				if (!department) {
					throw new Error(`Department ${departmentData._id} not found`);
				}

				return this.orch.getManager().getListenerManager().executeListener(args.event, { department });
			}

			case AppInterface.IPostLivechatDepartmentRemoved: {
				const [departmentData] = args.payload;
				const department = await this.orch.getConverters().get('departments').convertDepartment(departmentData);

				if (!department) {
					throw new Error(`Department ${departmentData._id} not found`);
				}

				return this.orch.getManager().getListenerManager().executeListener(args.event, { department });
			}

			default:
				const [roomData] = args.payload;
				const room = await this.orch.getConverters().get('rooms').convertRoom(roomData);

				if (!room) {
					throw new Error(`Room ${roomData._id} not found`);
				}

				if (!isLivechatRoom(room)) {
					throw new Error(`Room ${roomData._id} is not a livechat room`);
				}

				return this.orch.getManager().getListenerManager().executeListener(args.event, room);
		}
	}

	async userEvent(args: HandleUserEvent): Promise<unknown> {
		switch (args.event) {
			case AppInterface.IPostUserLoggedIn:
			case AppInterface.IPostUserLoggedOut: {
				const [loggedInUser] = args.payload;
				const context = this.orch.getConverters().get('users').convertToApp(loggedInUser);
				return this.orch.getManager().getListenerManager().executeListener(args.event, context);
			}
			case AppInterface.IPostUserStatusChanged: {
				const [statusData] = args.payload;
				const { currentStatus, previousStatus } = statusData;
				const context = {
					user: this.orch.getConverters().get('users').convertToApp(statusData.user),
					currentStatus,
					previousStatus,
				};

				return this.orch.getManager().getListenerManager().executeListener(args.event, context);
			}
			case AppInterface.IPostUserCreated:
			case AppInterface.IPostUserDeleted: {
				const [crudData] = args.payload;
				const context: IUserContext = {
					user: this.orch.getConverters().get('users').convertToApp(crudData.user),
					performedBy: this.orch.getConverters().get('users').convertToApp(crudData.performedBy),
				};

				return this.orch.getManager().getListenerManager().executeListener(args.event, context);
			}
			case AppInterface.IPostUserUpdated: {
				const [crudData] = args.payload;
				const context: IUserUpdateContext = {
					user: this.orch.getConverters().get('users').convertToApp(crudData.user),
					performedBy: this.orch.getConverters().get('users').convertToApp(crudData.performedBy),
					previousData: this.orch.getConverters().get('users').convertToApp(crudData.previousUser),
				};

				return this.orch.getManager().getListenerManager().executeListener(args.event, context);
			}
		}
	}
}
