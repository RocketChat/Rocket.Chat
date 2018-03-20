export class AppListenerBridge {
	constructor(orch) {
		this.orch = orch;
	}

	messageEvent(inte, message) {
		const msg = this.orch.getConverters().get('messages').convertMessage(message);
		return this.orch.getManager().getListenerManager().executeListener(inte, msg);
	}

	roomEvent(inte, room) {
		const rm = this.orch.getConverters().get('rooms').convertRoom(room);
		return this.orch.getManager().getListenerManager().executeListener(inte, rm);
	}
}
