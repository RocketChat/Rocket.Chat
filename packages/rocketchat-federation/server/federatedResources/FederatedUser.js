import FederatedResource from './FederatedResource';

class FederatedUser extends FederatedResource {
	constructor(localPeerIdentifier, user) {
		super('user');

		if (!user) {
			throw new Error('user param cannot be empty');
		}

		this.localPeerIdentifier = localPeerIdentifier;

		// Make sure all properties are normalized
		// Prepare the federation property
		if (!user.federation) {
			const federation = {
				_id: user._id,
				peer: localPeerIdentifier,
			};

				// Prepare the user
			user.federation = federation;

			// Update the user
			RocketChat.models.Users.update(user._id, { $set: { federation } });
		}

		// Make sure user dates are correct
		user.createdAt = new Date(user.createdAt);
		user.lastLogin = new Date(user.lastLogin);
		user._updatedAt = new Date(user._updatedAt);

		// Delete sensitive data as well
		delete user.emails;
		delete user.roles;
		delete user.services;

		// Make sure some other properties are ready
		user.name = user.name.indexOf('@') === -1 ? `${ user.name }@${ user.federation.peer }` : user.name;
		user.username = user.username.indexOf('@') === -1 ? `${ user.username }@${ user.federation.peer }` : user.username;
		user.roles = ['user'];
		user.status = 'online';
		user.statusConnection = 'online';
		user.type = 'user';

		// Set user property
		this.user = user;
		// }
	}

	getFederationId() {
		return this.user.federation._id;
	}

	getUser() {
		return this.user;
	}

	getLocalUser() {
		this.log('getLocalUser');

		const { localPeerIdentifier, user, user: { federation } } = this;

		const localUser = Object.assign({}, user);

		if (federation.peer === localPeerIdentifier) {
			localUser.username = user.username.split('@')[0];
			localUser.name = user.name.split('@')[0];
		}

		return localUser;
	}

	create() {
		this.log('create');

		// Get the local user object (with or without suffixes)
		const localUserObject = this.getLocalUser();

		// Grab the federation id
		const { federation: { _id: federationId } } = localUserObject;

		// Check if the user exists
		let localUser = RocketChat.models.Users.findOne({ 'federation._id': federationId });

		// Create if needed
		if (!localUser) {
			delete localUserObject._id;

			localUser = localUserObject;

			localUser._id = RocketChat.models.Users.create(localUserObject);
		}

		return localUser;
	}
}

FederatedUser.loadByFederationId = function loadByFederationId(localPeerIdentifier, federationId) {
	const localUser = RocketChat.models.Users.findOne({ 'federation._id': federationId });

	if (!localUser) { return; }

	return new FederatedUser(localPeerIdentifier, localUser);
};

FederatedUser.loadOrCreate = function loadOrCreate(localPeerIdentifier, user) {
	const { federation } = user;

	if (federation) {
		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, federation._id);

		if (federatedUser) {
			return federatedUser;
		}
	}

	return new FederatedUser(localPeerIdentifier, user);
};

export default FederatedUser;
