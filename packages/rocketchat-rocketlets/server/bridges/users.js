export class RocketletUserBridge {
	constructor(orch) {
		this.orch = orch;
	}

	getById(userId, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is getting the userId: "${ userId }"`);

		return this.orch.getConverters().get('users').convertById(userId);
	}

	getByUsername(username, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is getting the username: "${ username }"`);

		return this.orch.getConverters().get('users').convertByUsername(username);
	}
}
