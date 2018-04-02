export class AppListenerBridge {
	constructor(orch) {
		this.orch = orch;
	}

	messageEvent(inte, message) {
		const msg = this.orch.getConverters().get('messages').convertMessage(message);
		const result = this.orch.getManager().getListenerManager().executeListener(inte, msg);

		if (typeof result === 'boolean') {
			return result;
		} else {
			return this.orch.getConverters().get('messages').convertAppMessage(result);
		}
		// try {

		// } catch (e) {
		// 	console.log(`${ e.name }: ${ e.message }`);
		// 	console.log(e.stack);
		// }
	}

	roomEvent(inte, room) {
		const rm = this.orch.getConverters().get('rooms').convertRoom(room);
		const result = this.orch.getManager().getListenerManager().executeListener(inte, rm);

		if (typeof result === 'boolean') {
			return result;
		} else {
			return this.orch.getConverters().get('rooms').convertAppRoom(result);
		}
		// try {

		// } catch (e) {
		// 	console.log(`${ e.name }: ${ e.message }`);
		// 	console.log(e.stack);
		// }
	}
}
