export class AppListenerBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async messageEvent(inte, message) {
		const msg = this.orch.getConverters().get('messages').convertMessage(message);
		const result = await this.orch.getManager().getListenerManager().executeListener(inte, msg);

		if (typeof result === 'boolean') {
			return result;
		} else {
			return this.orch.getConverters().get('messages').convertAppMessage(result);
		}
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
		} else {
			return this.orch.getConverters().get('rooms').convertAppRoom(result);
		}
		// try {

		// } catch (e) {
		// 	this.orch.debugLog(`${ e.name }: ${ e.message }`);
		// 	this.orch.debugLog(e.stack);
		// }
	}
}
