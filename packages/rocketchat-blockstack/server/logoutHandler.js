const logger = new Logger('Blockstack');

// Logout user from a Blockstack auth session
// Make sure the user is logged in before initiating
// Nothing is really done here, other than logging, because the Blockstack
// service logout is handled on the client side from a callback on this
// function's success. It might be useful to extend in future though.
Meteor.methods({
	blockstackLogout() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'blockstackLogout' });
		}
		const serviceConfig = ServiceConfiguration.configurations.findOne({ service: 'blockstack' });
		const user = Meteor.users.findOne({
			_id: Meteor.userId()
		}, {
			'services.blockstack': 1
		});
		const blockstackID = user.services.blockstack.id;
		logger.info(`User loggout for Blockstack ID ${ blockstackID }`);
		logger.debug('Logging out user', user);
		return true;
	}
});
