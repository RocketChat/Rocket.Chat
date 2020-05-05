import { AppInterface } from '@rocket.chat/apps-engine/server/compiler';

export class AppListenerBridge {
	constructor(orch) {
		this.orch = orch;
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

		// try {

		// } catch (e) {
		// 	this.orch.debugLog(`${ e.name }: ${ e.message }`);
		// 	this.orch.debugLog(e.stack);
		// }
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
