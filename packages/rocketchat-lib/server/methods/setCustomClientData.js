Meteor.methods({
	setCustomClientData(clientData) {
		check(clientData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setCustomClientData' });
		}

		const user = Meteor.user();

		clientData.ipAddress = this.connection.clientAddress;

		return RocketChat.setCustomClientData(user, clientData);
	}
});
