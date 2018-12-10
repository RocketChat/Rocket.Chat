import FederatedMessage from '../federatedResources/FederatedMessage';
import FederatedRoom from '../federatedResources/FederatedRoom';
import FederatedUser from '../federatedResources/FederatedUser';

import federationEventsRoutes from './routes/federation/events';
import uploadsRoutes from './routes/uploads';
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
		federationEventsRoutes.call(this);
		uploadsRoutes.call(this);
		usersRoutes.call(this);

		this.log(`${ identifier }'s routes are set`);
	}

	handleDirectRoomCreatedEvent(e) {
		this.log('handleDirectRoomCreatedEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { room, owner, users } } = e;

		// Load the federated room
		const federatedRoom = new FederatedRoom(localPeerIdentifier, room, { owner });

		// Set users
		federatedRoom.setUsers(users);

		// Create, if needed, all room's users
		federatedRoom.createUsers();

		// Then, create the room, if needed
		federatedRoom.create();
	}

	handleRoomCreatedEvent(e) {
		this.log('handleRoomCreatedEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { room, owner, users } } = e;

		// Load the federated room
		const federatedRoom = new FederatedRoom(localPeerIdentifier, room, { owner });

		// Set users
		federatedRoom.setUsers(users);

		// Create, if needed, all room's users
		federatedRoom.createUsers();

		// Then, create the room, if needed
		federatedRoom.create();
	}

	handleUserJoinedEvent(e) {
		this.log('handleUserJoinedEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, user } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);

		// Create the user, if needed
		const federatedUser = FederatedUser.loadOrCreate(localPeerIdentifier, user);
		const localUser = federatedUser.create();

		// Callback management
		Meteor.federationPeerClient.addCallbackToSkip('afterAddedToRoom', federatedUser.getFederationId());

		// Add the user to the room
		RocketChat.addUserToRoom(federatedRoom.room._id, localUser, null, false);

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	handleUserAddedEvent(e) {
		this.log('handleUserAddedEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, federated_inviter_id, user } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);

		// Load the inviter
		const federatedInviter = FederatedUser.loadByFederationId(localPeerIdentifier, federated_inviter_id);

		if (!federatedInviter) {
			throw new Error('Inviting user does not exist');
		}

		const localInviter = federatedInviter.getLocalUser();

		// Create the user, if needed
		const federatedUser = FederatedUser.loadOrCreate(localPeerIdentifier, user);
		const localUser = federatedUser.create();

		// Callback management
		Meteor.federationPeerClient.addCallbackToSkip('afterAddedToRoom', federatedUser.getFederationId());

		// Add the user to the room
		RocketChat.addUserToRoom(federatedRoom.room._id, localUser, localInviter, false);

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	handleUserLeftEvent(e) {
		this.log('handleUserLeftEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, federated_user_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);

		// Load the user who left
		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// Callback management
		Meteor.federationPeerClient.addCallbackToSkip('beforeLeaveRoom', federatedUser.getFederationId());

		// Remove the user from the room
		RocketChat.removeUserFromRoom(federatedRoom.room._id, localUser);

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	handleUserRemovedEvent(e) {
		this.log('handleUserRemovedEvent');

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

		// Callback management
		Meteor.federationPeerClient.addCallbackToSkip('beforeRemoveFromRoom', federatedUser.getFederationId());

		// Remove the user from the room
		RocketChat.removeUserFromRoom(federatedRoom.room._id, localUser, { byUser: localUserWhoRemoved });

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();
	}

	handleUserMutedEvent(e) {
		this.log('handleUserMutedEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, federated_user_id } } = e;
		// const { payload: { federated_room_id, federated_user_id, federated_muted_by_user_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);

		// Load the user who left
		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// // Load the user who muted
		// const federatedUserWhoMuted = FederatedUser.loadByFederationId(localPeerIdentifier, federated_muted_by_user_id);
		// const localUserWhoMuted = federatedUserWhoMuted.getLocalUser();

		// Mute user
		RocketChat.models.Rooms.muteUsernameByRoomId(federatedRoom.room._id, localUser.username);

		// TODO: should we create a message?
	}

	handleUserUnmutedEvent(e) {
		this.log('handleUserUnmutedEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, federated_user_id } } = e;
		// const { payload: { federated_room_id, federated_user_id, federated_unmuted_by_user_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);

		// Load the user who left
		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// // Load the user who muted
		// const federatedUserWhoUnmuted = FederatedUser.loadByFederationId(localPeerIdentifier, federated_unmuted_by_user_id);
		// const localUserWhoUnmuted = federatedUserWhoUnmuted.getLocalUser();

		// Unmute user
		RocketChat.models.Rooms.unmuteUsernameByRoomId(federatedRoom.room._id, localUser.username);

		// TODO: should we create a message?
	}

	handleMessageCreatedEvent(e) {
		this.log('handleMessageCreatedEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { message } } = e;

		// Load the federated message
		const federatedMessage = new FederatedMessage(localPeerIdentifier, message);

		// Callback management
		Meteor.federationPeerClient.addCallbackToSkip('afterSaveMessage', federatedMessage.getFederationId());

		// Create the federated message
		federatedMessage.create();
	}

	handleMessageUpdatedEvent(e) {
		this.log('handleMessageUpdatedEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { message, federated_user_id } } = e;

		// Load the federated message
		const federatedMessage = new FederatedMessage(localPeerIdentifier, message);

		// Load the federated user
		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, federated_user_id);

		// Callback management
		Meteor.federationPeerClient.addCallbackToSkip('afterSaveMessage', federatedMessage.getFederationId());

		// Update the federated message
		federatedMessage.update(federatedUser);
	}

	handleMessageDeletedEvent(e) {
		this.log('handleMessageDeletedEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_message_id } } = e;

		const federatedMessage = FederatedMessage.loadByFederationId(localPeerIdentifier, federated_message_id);

		// Load the federated message
		const localMessage = federatedMessage.getLocalMessage();

		// Load the author
		const localAuthor = federatedMessage.federatedAuthor.getLocalUser();

		// Callback management
		Meteor.federationPeerClient.addCallbackToSkip('afterDeleteMessage', federatedMessage.getFederationId());

		// Create the federated message
		RocketChat.deleteMessage(localMessage, localAuthor);
	}

	handleMessagesReadEvent(e) {
		this.log('handleMessagesReadEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, federated_user_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);

		// Load the user who left
		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// Mark the messages as read
		RocketChat.readMessages(federatedRoom.room._id, localUser._id);
	}

	handleMessagesSetReactionEvent(e) {
		this.log('handleMessagesSetReactionEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, federated_message_id, federated_user_id, reaction, shouldReact } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);
		const localRoom = federatedRoom.getLocalRoom();

		// Load the user who reacted
		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// Load the message
		const federatedMessage = FederatedMessage.loadByFederationId(localPeerIdentifier, federated_message_id);
		const localMessage = federatedMessage.getLocalMessage();

		// Callback management
		Meteor.federationPeerClient.addCallbackToSkip('afterSetReaction', federatedMessage.getFederationId());

		// Set message reaction
		RocketChat.setReaction(localRoom, localUser, localMessage, reaction, shouldReact);
	}

	handleMessagesUnsetReactionEvent(e) {
		this.log('handleMessagesUnsetReactionEvent');

		const { identifier: localPeerIdentifier } = this.config;

		const { payload: { federated_room_id, federated_message_id, federated_user_id, reaction, shouldReact } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, federated_room_id);
		const localRoom = federatedRoom.getLocalRoom();

		// Load the user who reacted
		const federatedUser = FederatedUser.loadByFederationId(localPeerIdentifier, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// Load the message
		const federatedMessage = FederatedMessage.loadByFederationId(localPeerIdentifier, federated_message_id);
		const localMessage = federatedMessage.getLocalMessage();

		// Callback management
		Meteor.federationPeerClient.addCallbackToSkip('afterUnsetReaction', federatedMessage.getFederationId());

		// Unset message reaction
		RocketChat.setReaction(localRoom, localUser, localMessage, reaction, shouldReact);
	}

}

export default PeerServer;
