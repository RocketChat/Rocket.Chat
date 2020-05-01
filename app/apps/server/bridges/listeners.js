import { AppInterface } from '@rocket.chat/apps-engine/server/compiler';

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
					return 'roomEvent';
				case AppInterface.IPostExternalComponentOpened:
				case AppInterface.IPostExternalComponentClosed:
					return 'externalComponentEvent';
				/**
				 * @deprecated please prefer the AppInterface.IPostLivechatRoomClosed event
				 */
				case AppInterface.ILivechatRoomClosedHandler:
				case AppInterface.IPostLivechatRoomStarted:
				case AppInterface.IPostLivechatRoomClosed:
				case AppInterface.IPostLivechatAgentAssigned:
				case AppInterface.IPostLivechatAgentUnassigned:
					return 'livechatEvent';
				case AppInterface.IUIKitInteractionHandler:
					return 'uiKitInteractionEvent';
			}
		})();

		return this[method](event, ...payload);
	}

	async messageEvent(inte, message) {
		const msg = this.orch.getConverters().get('messages').convertMessage(message);
		const result = await this.orch.getManager().getListenerManager().executeListener(inte, msg);

		if (typeof result === 'boolean') {
			return result;
		}
		return this.orch.getConverters().get('messages').convertAppMessage(result);

		// try {

		// } catch (e) {
		// 	this.orch.debugLog(`${ e.name }: ${ e.message }`);
		// 	this.orch.debugLog(e.stack);
		// }
	}

	async roomEvent(inte, room) {
		const rm = this.orch.getConverters().get('rooms').convertRoom(room);
		const result = await this.orch.getManager().getListenerManager().executeListener(inte, rm);

		if (typeof result === 'boolean') {
			return result;
		}
		return this.orch.getConverters().get('rooms').convertAppRoom(result);

		// try {

		// } catch (e) {
		// 	this.orch.debugLog(`${ e.name }: ${ e.message }`);
		// 	this.orch.debugLog(e.stack);
		// }
	}

	async externalComponentEvent(inte, externalComponent) {
		const result = await this.orch.getManager().getListenerManager().executeListener(inte, externalComponent);

		return result;
	}

	async uiKitInteractionEvent(inte, action) {
		return this.orch.getManager().getListenerManager().executeListener(inte, action);
	}

	async livechatEvent(inte, data) {
		switch (inte) {
			case AppInterface.IPostLivechatRoomStarted:
			case AppInterface.IPostLivechatRoomClosed:
				const room = this.orch.getConverters().get('rooms').convertRoom(data);

				return this.orch.getManager().getListenerManager().executeListener(inte, room);
			case AppInterface.IPostLivechatAgentAssigned:
			case AppInterface.IPostLivechatAgentUnassigned:
				return this.orch.getManager().getListenerManager().executeListener(inte, {
					room: this.orch.getConverters().get('rooms').convertRoom(data.room),
					agent: this.orch.getConverters().get('users').convertToApp(data.user),
				});
			default:
				break;
		}
	}
}
