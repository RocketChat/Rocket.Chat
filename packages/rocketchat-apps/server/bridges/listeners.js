export class AppListenerBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async notificationEvent(interfaceName, payload, converterName = 'notifications') {
		const converter = this.orch.getConverters().get(converterName);

		if (!converter) {
			throw new Meteor.Error('invalid_converter', 'The converter name provided is not a valid one');
		}

		const appData = converter.convertToApp(payload);

		const response = await this.orch.getManager().getListenerManager().executeListener(interfaceName, appData);

		if (typeof response === 'boolean') {
			return response;
		}

		return converter.convertFromApp(response);
	}

	async desktopNotificationEvent(interfaceName, payload) {
		return this.notificationEvent(interfaceName, payload, 'desktopNotifications');
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
		// 	console.log(`${ e.name }: ${ e.message }`);
		// 	console.log(e.stack);
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
		// 	console.log(`${ e.name }: ${ e.message }`);
		// 	console.log(e.stack);
		// }
	}
}
