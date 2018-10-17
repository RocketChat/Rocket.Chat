import FederatedMessage from '../federatedResources/FederatedMessage';
import FederatedRoom from '../federatedResources/FederatedRoom';
import FederatedUser from '../federatedResources/FederatedUser';

import federationEventsRoutes from './routes/federation/events';
import usersRoutes from './routes/users';

class PeerServer {
	constructor(config) {
		// General
		this.config = config;
	}

	log(message) {
		console.log(`[federation-server] ${ message }`);
	}

	start() {
		const { identifier } = this.config;

		// Setup routes
		usersRoutes.call(this);
		federationEventsRoutes.call(this);

		this.log(`${ identifier }'s routes are set`);
	}

	handleDirectRoomCreatedEvent(e) {
		this.log('handleDirectRoomCreatedEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federatedRoom: federatedRoomObject } } = e;

		// Load the federated room
		const federatedRoom = new FederatedRoom(localPeerIdentifier, federatedRoomObject);

		// Create, if needed, all room's users
		federatedRoom.createUsers();

		// Then, create the room, if needed
		federatedRoom.create();
	}

	handleRoomCreatedEvent(e) {
		this.log('handleRoomCreatedEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room: federatedRoomObject } } = e;

		// Load the federated room
		const federatedRoom = new FederatedRoom(localPeerIdentifier, federatedRoomObject);

		// Create, if needed, all room's users
		federatedRoom.createUsers();

		// Then, create the room, if needed
		federatedRoom.create();
	}

	handleUserJoinedRoomEvent(e) {
		this.log('handleUserJoinedRoomEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, federated_user: federatedUserObject } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);

		// Create the user, if needed
		const federatedUser = new FederatedUser(localPeerIdentifier, federatedUserObject);
		const localUser = federatedUser.create();

		// Add the user to the room
		RocketChat.addUserToRoom(federatedRoom.room._id, localUser, null, false, { skipCallbacks: true });

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	handleUserAddedToRoomEvent(e) {
		this.log('handleUserAddedToRoomEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, federated_user: federatedUserObject, federated_inviter_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);

		// Create the user, if needed
		const federatedUser = new FederatedUser(localPeerIdentifier, federatedUserObject);
		const localUser = federatedUser.create();

		// Load the inviter
		const federatedInviter = FederatedUser.loadByFederationId(localPeerIdentifier, federated_inviter_id);

		if (!federatedInviter) {
			throw new Error('Inviting user does not exist');
		}

		const localInviter = federatedInviter.getLocalUser();

		// Add the user to the room
		RocketChat.addUserToRoom(federatedRoom.room._id, localUser, localInviter, false, { skipCallbacks: true });

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	handleUserLeftRoomEvent(e) {
		this.log('handleUserLeftRoomEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, federated_user_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);

		// Load the user who left
		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// Remove the user from the room
		RocketChat.removeUserFromRoom(federatedRoom.room._id, localUser, { skipCallbacks: true });

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	handleUserRemovedFromRoomEvent(e) {
		this.log('handleUserRemovedFromRoomEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, federated_user_id, federated_removed_by_user_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);

		// Load the user who left
		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// Load the user who removed
		const federatedUserWhoRemoved = FederatedUser.loadByFederationId(localPeerIdentifier, federated_removed_by_user_id);
		const localUserWhoRemoved = federatedUserWhoRemoved.getLocalUser();

		// Remove the user from the room
		RocketChat.removeUserFromRoom(federatedRoom.room._id, localUser, { byUser: localUserWhoRemoved, skipCallbacks: true });

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	handleMessageSentEvent(e) {
		this.log('handleMessageSentEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_message: federatedMessageObject } } = e;

		// Load the federated message
		const federatedMessage = new FederatedMessage(localPeerIdentifier, federatedMessageObject);

		// Create the federated message
		federatedMessage.create();
	}

}

export default PeerServer;
