import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import { LivechatTransferEventType } from '@rocket.chat/apps-engine/definition/livechat';

export class AppListenerBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async handleEvent(event, ...payload) {
		// eslint-disable-next-line complexity
		const method = (() => {
			switch (event) {
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
				case AppInterface.IPostLivechatRoomStarted:
				case AppInterface.IPostLivechatRoomClosed:
				case AppInterface.IPostLivechatAgentAssigned:
				case AppInterface.IPostLivechatAgentUnassigned:
				case AppInterface.IPostLivechatRoomTransferred:
				case AppInterface.IPostLivechatGuestSaved:
				case AppInterface.IPostLivechatRoomSaved:
					return 'livechatEvent';
				case AppInterface.IPostUserCreated:
				case AppInterface.IPostUserUpdated:
				case AppInterface.IPostUserDeleted:
				case AppInterface.IPostUserLogin:
				case AppInterface.IPostUserLogout:
				case AppInterface.IPostUserStatusChanged:
					return 'userEvent';
				default:
					return 'defaultEvent';
			}
		})();

		return this[method](event, ...payload);
	}

	async defaultEvent(inte, payload) {
		return this.orch.getManager().getListenerManager().executeListener(inte, payload);
	}

	async messageEvent(inte, message, ...payload) {
		const msg = await this.orch.getConverters().get('messages').convertMessage(message);

		const params = (async () => {
			switch (inte) {
				case AppInterface.IPostMessageDeleted:
					const [userDeleted] = payload;
					return {
						user: await this.orch.getConverters().get('users').convertToApp(userDeleted),
						message: msg,
					};
				case AppInterface.IPostMessageReacted:
					const [userReacted, reaction, isRemoved] = payload;
					return {
						message: msg,
						user: await this.orch.getConverters().get('users').convertToApp(userReacted),
						reaction,
						isRemoved,
					};
				case AppInterface.IPostMessageFollowed:
					const [userFollowed, isUnfollow] = payload;
					return {
						message: msg,
						user: await this.orch.getConverters().get('users').convertToApp(userFollowed),
						isUnfollow,
					};
				case AppInterface.IPostMessagePinned:
					const [userPinned, isUnpinned] = payload;
					return {
						message: msg,
						user: await this.orch.getConverters().get('users').convertToApp(userPinned),
						isUnpinned,
					};
				case AppInterface.IPostMessageStarred:
					const [userStarred, isStarred] = payload;
					return {
						message: msg,
						user: await this.orch.getConverters().get('users').convertToApp(userStarred),
						isStarred,
					};
				case AppInterface.IPostMessageReported:
					const [userReported, reason] = payload;
					return {
						message: msg,
						user: await this.orch.getConverters().get('users').convertToApp(userReported),
						reason,
					};
				default:
					return msg;
			}
		})();

		const result = await this.orch.getManager().getListenerManager().executeListener(inte, params);

		if (typeof result === 'boolean') {
			return result;
		}
		return this.orch.getConverters().get('messages').convertAppMessage(result);
	}

	async roomEvent(inte, room, ...payload) {
		const rm = await this.orch.getConverters().get('rooms').convertRoom(room);

		const params = (async () => {
			switch (inte) {
				case AppInterface.IPreRoomUserJoined:
				case AppInterface.IPostRoomUserJoined:
					const [joiningUser, invitingUser] = payload;
					return {
						room: rm,
						joiningUser: await this.orch.getConverters().get('users').convertToApp(joiningUser),
						invitingUser: await this.orch.getConverters().get('users').convertToApp(invitingUser),
					};
				case AppInterface.IPreRoomUserLeave:
				case AppInterface.IPostRoomUserLeave:
					const [leavingUser] = payload;
					return {
						room: rm,
						leavingUser: await this.orch.getConverters().get('users').convertToApp(leavingUser),
					};
				default:
					return rm;
			}
		})();

		const result = await this.orch.getManager().getListenerManager().executeListener(inte, params);

		if (typeof result === 'boolean') {
			return result;
		}
		return this.orch.getConverters().get('rooms').convertAppRoom(result);
	}

	async livechatEvent(inte, data) {
		switch (inte) {
			case AppInterface.IPostLivechatAgentAssigned:
			case AppInterface.IPostLivechatAgentUnassigned:
				return this.orch
					.getManager()
					.getListenerManager()
					.executeListener(inte, {
						room: await this.orch.getConverters().get('rooms').convertRoom(data.room),
						agent: await this.orch.getConverters().get('users').convertToApp(data.user),
					});
			case AppInterface.IPostLivechatRoomTransferred:
				const converter = data.type === LivechatTransferEventType.AGENT ? 'users' : 'departments';

				return this.orch
					.getManager()
					.getListenerManager()
					.executeListener(inte, {
						type: data.type,
						room: await this.orch.getConverters().get('rooms').convertById(data.room),
						from: await this.orch.getConverters().get(converter).convertById(data.from),
						to: await this.orch.getConverters().get(converter).convertById(data.to),
					});
			case AppInterface.IPostLivechatGuestSaved:
				return this.orch
					.getManager()
					.getListenerManager()
					.executeListener(inte, await this.orch.getConverters().get('visitors').convertById(data));
			case AppInterface.IPostLivechatRoomSaved:
				return this.orch
					.getManager()
					.getListenerManager()
					.executeListener(inte, await this.orch.getConverters().get('rooms').convertById(data));
			default:
				const room = await this.orch.getConverters().get('rooms').convertRoom(data);

				return this.orch.getManager().getListenerManager().executeListener(inte, room);
		}
	}

	async userEvent(inte, data) {
		let context;
		switch (inte) {
			case AppInterface.IPostUserLoggedIn:
			case AppInterface.IPostUserLogout:
				context = await this.orch.getConverters().get('users').convertToApp(data.user);
				return this.orch.getManager().getListenerManager().executeListener(inte, context);
			case AppInterface.IPostUserStatusChanged:
				const { currentStatus, previousStatus } = data;
				context = {
					user: await this.orch.getConverters().get('users').convertToApp(data.user),
					currentStatus,
					previousStatus,
				};

				return this.orch.getManager().getListenerManager().executeListener(inte, context);
			case AppInterface.IPostUserCreated:
			case AppInterface.IPostUserUpdated:
			case AppInterface.IPostUserDeleted:
				context = {
					user: await this.orch.getConverters().get('users').convertToApp(data.user),
					performedBy: await this.orch.getConverters().get('users').convertToApp(data.performedBy),
				};
				if (inte === AppInterface.IPostUserUpdated) {
					context.previousData = await this.orch.getConverters().get('users').convertToApp(data.previousUser);
				}
				return this.orch.getManager().getListenerManager().executeListener(inte, context);
		}
	}
}
