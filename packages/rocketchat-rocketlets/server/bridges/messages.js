export class RocketletMessageBridge {
	constructor(orch) {
		this.orch = orch;
	}

	create(message, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is creating a new message.`, message);

		let msg = this.orch.getConverters().get('messages').convertRocketletMessage(message);

		Meteor.runAsUser(msg.u._id, () => {
			msg = Meteor.call('sendMessage', msg);
		});

		return msg._id;
	}

	getById(messageId, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is getting the message: "${ messageId }"`);

		return this.orch.getConverters().get('messages').convertById(messageId);
	}
}
