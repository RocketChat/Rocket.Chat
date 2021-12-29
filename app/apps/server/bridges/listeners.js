import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import { LivechatTransferEventType } from '@rocket.chat/apps-engine/definition/livechat';

export class AppListenerBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async handleEvent(event, ...payload) {
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
				default:
					return 'defaultEvent';
			}
		})();

		return this[method](event, ...payload);
	}

	async defaultEvent(inte, payload) {
		return this.orch.getManager().getListenerManager().executeListener(inte, payload);
	}

	async messageEvent(inte, message) {
		const msg = this.orch.getConverters().get('messages').convertMessage(message);
		const result = await this.orch.getManager().getListenerManager().executeListener(inte, msg);

		if (typeof result === 'boolean') {
			return result;
		}
		return this.orch.getConverters().get('messages').convertAppMessage(result);
	}

	async roomEvent(inte, room, ...payload) {
		const rm = this.orch.getConverters().get('rooms').convertRoom(room);

		const params = (() => {
			switch (inte) {
				case AppInterface.IPreRoomUserJoined:
				case AppInterface.IPostRoomUserJoined:
					const [joiningUser, invitingUser] = payload;
					return {
						room: rm,
						joiningUser: this.orch.getConverters().get('users').convertToApp(joiningUser),
						invitingUser: this.orch.getConverters().get('users').convertToApp(invitingUser),
					};
				case AppInterface.IPreRoomUserLeave:
				case AppInterface.IPostRoomUserLeave:
					const [leavingUser] = payload;
					return {
						room: rm,
						leavingUser: this.orch.getConverters().get('users').convertToApp(leavingUser),
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
						room: this.orch.getConverters().get('rooms').convertRoom(data.room),
						agent: this.orch.getConverters().get('users').convertToApp(data.user),
					});
			case AppInterface.IPostLivechatRoomTransferred:
				const converter = data.type === LivechatTransferEventType.AGENT ? 'users' : 'departments';

				return this.orch
					.getManager()
					.getListenerManager()
					.executeListener(inte, {
						type: data.type,
						room: this.orch.getConverters().get('rooms').convertById(data.room),
						from: this.orch.getConverters().get(converter).convertById(data.from),
						to: this.orch.getConverters().get(converter).convertById(data.to),
					});
			case AppInterface.IPostLivechatGuestSaved:
				return this.orch
					.getManager()
					.getListenerManager()
					.executeListener(inte, this.orch.getConverters().get('visitors').convertById(data));
			case AppInterface.IPostLivechatRoomSaved:
				return this.orch.getManager().getListenerManager().executeListener(inte, this.orch.getConverters().get('rooms').convertById(data));
			default:
				const room = this.orch.getConverters().get('rooms').convertRoom(data);

				return this.orch.getManager().getListenerManager().executeListener(inte, room);
		}
	}
}
