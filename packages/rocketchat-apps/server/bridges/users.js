export class AppUserBridge {
	constructor(orch) {
		this.orch = orch;
	}

	getById(userId, appId) {
		console.log(`The App ${ appId } is getting the userId: "${ userId }"`);

		return this.orch.getConverters().get('users').convertById(userId);
	}

	getByUsername(username, appId) {
		console.log(`The App ${ appId } is getting the username: "${ username }"`);

		return this.orch.getConverters().get('users').convertByUsername(username);
	}
}
