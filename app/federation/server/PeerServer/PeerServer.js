import { callbacks } from '../../../callbacks';
import { setReaction } from '../../../reactions/server';
import { addUserToRoom, removeUserFromRoom, deleteMessage } from '../../../lib';
import { Rooms, Subscriptions, FederationPeers } from '../../../models';
import { FederatedMessage, FederatedRoom, FederatedUser } from '../federatedResources';
import { logger } from '../logger.js';

import { Federation } from '..';

export class PeerServer {
	constructor() {
		this.config = {};
		this.enabled = false;
	}

	setConfig(config) {
		// General
		this.config = config;
	}

	log(message) {
		logger.peerServer.info(message);
	}

	disable() {
		this.log('Disabling...');

		this.enabled = false;
	}

	enable() {
		this.log('Enabling...');

		this.enabled = true;
	}

	start() {
		this.log('Routes are set');
	}

	handleDirectRoomCreatedEvent(e) {
		this.log('handleDirectRoomCreatedEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { room, owner, users } } = e;

		// Load the federated room
		const federatedRoom = new FederatedRoom(localPeerDomain, room, { owner });

		// Set users
		federatedRoom.setUsers(users);

		// Create, if needed, all room's users
		federatedRoom.createUsers();

		// Then, create the room, if needed
		federatedRoom.create();

		// Refresh federation peers
		FederationPeers.refreshPeers(localPeerDomain);
	}

	handleRoomCreatedEvent(e) {
		this.log('handleRoomCreatedEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { room, owner, users } } = e;

		// Load the federated room
		const federatedRoom = new FederatedRoom(localPeerDomain, room, { owner });

		// Set users
		federatedRoom.setUsers(users);

		// Create, if needed, all room's users
		federatedRoom.createUsers();

		// Then, create the room, if needed
		federatedRoom.create(true);

		// Refresh federation peers
		FederationPeers.refreshPeers(localPeerDomain);
	}

	handleUserJoinedEvent(e) {
		this.log('handleUserJoinedEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { federated_room_id, user } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, federated_room_id);

		// Create the user, if needed
		const federatedUser = FederatedUser.loadOrCreate(localPeerDomain, user);
		const localUser = federatedUser.create();

		// Callback management
		Federation.peerClient.addCallbackToSkip('afterAddedToRoom', federatedUser.getFederationId());

		// Add the user to the room
		addUserToRoom(federatedRoom.room._id, localUser, null, false);

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		// Refresh federation peers
		FederationPeers.refreshPeers(localPeerDomain);
	}

	handleUserAddedEvent(e) {
		this.log('handleUserAddedEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { federated_room_id, federated_inviter_id, user } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, federated_room_id);

		// Load the inviter
		const federatedInviter = FederatedUser.loadByFederationId(localPeerDomain, federated_inviter_id);

		if (!federatedInviter) {
			throw new Error('Inviting user does not exist');
		}

		const localInviter = federatedInviter.getLocalUser();

		// Create the user, if needed
		const federatedUser = FederatedUser.loadOrCreate(localPeerDomain, user);
		const localUser = federatedUser.create();

		// Callback management
		Federation.peerClient.addCallbackToSkip('afterAddedToRoom', federatedUser.getFederationId());

		// Add the user to the room
		addUserToRoom(federatedRoom.room._id, localUser, localInviter, false);

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		// Refresh federation peers
		FederationPeers.refreshPeers(localPeerDomain);
	}

	handleUserLeftEvent(e) {
		this.log('handleUserLeftEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { federated_room_id, federated_user_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, federated_room_id);

		// Load the user who left
		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// Callback management
		Federation.peerClient.addCallbackToSkip('beforeLeaveRoom', federatedUser.getFederationId());

		// Remove the user from the room
		removeUserFromRoom(federatedRoom.room._id, localUser);

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		// Refresh federation peers
		FederationPeers.refreshPeers(localPeerDomain);
	}

	handleUserRemovedEvent(e) {
		this.log('handleUserRemovedEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { federated_room_id, federated_user_id, federated_removed_by_user_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, federated_room_id);

		// Load the user who left
		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// Load the user who removed
		const federatedUserWhoRemoved = FederatedUser.loadByFederationId(localPeerDomain, federated_removed_by_user_id);
		const localUserWhoRemoved = federatedUserWhoRemoved.getLocalUser();

		// Callback management
		Federation.peerClient.addCallbackToSkip('beforeRemoveFromRoom', federatedUser.getFederationId());

		// Remove the user from the room
		removeUserFromRoom(federatedRoom.room._id, localUser, { byUser: localUserWhoRemoved });

		// Load federated users
		federatedRoom.loadUsers();

		// Refresh room's federation
		federatedRoom.refreshFederation();

		// Refresh federation peers
		FederationPeers.refreshPeers(localPeerDomain);
	}

	handleUserMutedEvent(e) {
		this.log('handleUserMutedEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { federated_room_id, federated_user_id } } = e;
		// const { payload: { federated_room_id, federated_user_id, federated_muted_by_user_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, federated_room_id);

		// Load the user who left
		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// // Load the user who muted
		// const federatedUserWhoMuted = FederatedUser.loadByFederationId(localPeerDomain, federated_muted_by_user_id);
		// const localUserWhoMuted = federatedUserWhoMuted.getLocalUser();

		// Mute user
		Rooms.muteUsernameByRoomId(federatedRoom.room._id, localUser.username);

		// TODO: should we create a message?
	}

	handleUserUnmutedEvent(e) {
		this.log('handleUserUnmutedEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { federated_room_id, federated_user_id } } = e;
		// const { payload: { federated_room_id, federated_user_id, federated_unmuted_by_user_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, federated_room_id);

		// Load the user who left
		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// // Load the user who muted
		// const federatedUserWhoUnmuted = FederatedUser.loadByFederationId(localPeerDomain, federated_unmuted_by_user_id);
		// const localUserWhoUnmuted = federatedUserWhoUnmuted.getLocalUser();

		// Unmute user
		Rooms.unmuteUsernameByRoomId(federatedRoom.room._id, localUser.username);

		// TODO: should we create a message?
	}

	handleMessageCreatedEvent(e) {
		this.log('handleMessageCreatedEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { message } } = e;

		// Load the federated message
		const federatedMessage = new FederatedMessage(localPeerDomain, message);

		// Callback management
		Federation.peerClient.addCallbackToSkip('afterSaveMessage', federatedMessage.getFederationId());

		// Create the federated message
		federatedMessage.create();
	}

	handleMessageUpdatedEvent(e) {
		this.log('handleMessageUpdatedEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { message, federated_user_id } } = e;

		// Load the federated message
		const federatedMessage = new FederatedMessage(localPeerDomain, message);

		// Load the federated user
		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, federated_user_id);

		// Callback management
		Federation.peerClient.addCallbackToSkip('afterSaveMessage', federatedMessage.getFederationId());

		// Update the federated message
		federatedMessage.update(federatedUser);
	}

	handleMessageDeletedEvent(e) {
		this.log('handleMessageDeletedEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { federated_message_id } } = e;

		const federatedMessage = FederatedMessage.loadByFederationId(localPeerDomain, federated_message_id);

		// Load the federated message
		const localMessage = federatedMessage.getLocalMessage();

		// Load the author
		const localAuthor = federatedMessage.federatedAuthor.getLocalUser();

		// Callback management
		Federation.peerClient.addCallbackToSkip('afterDeleteMessage', federatedMessage.getFederationId());

		// Create the federated message
		deleteMessage(localMessage, localAuthor);
	}

	handleMessagesReadEvent(e) {
		this.log('handleMessagesReadEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { federated_room_id, federated_user_id } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, federated_room_id);

		Federation.peerClient.addCallbackToSkip('afterReadMessages', federatedRoom.getFederationId());

		// Load the user who left
		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// Mark the messages as read
		// TODO: move below calls to an exported function
		const userSubscription = Subscriptions.findOneByRoomIdAndUserId(federatedRoom.room._id, localUser._id, { fields: { ls: 1 } });
		Subscriptions.setAsReadByRoomIdAndUserId(federatedRoom.room._id, localUser._id);

		callbacks.run('afterReadMessages', federatedRoom.room._id, { userId: localUser._id, lastSeen: userSubscription.ls });
	}

	handleMessagesSetReactionEvent(e) {
		this.log('handleMessagesSetReactionEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { federated_room_id, federated_message_id, federated_user_id, reaction, shouldReact } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, federated_room_id);
		const localRoom = federatedRoom.getLocalRoom();

		// Load the user who reacted
		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// Load the message
		const federatedMessage = FederatedMessage.loadByFederationId(localPeerDomain, federated_message_id);
		const localMessage = federatedMessage.getLocalMessage();

		// Callback management
		Federation.peerClient.addCallbackToSkip('afterSetReaction', federatedMessage.getFederationId());

		// Set message reaction
		setReaction(localRoom, localUser, localMessage, reaction, shouldReact);
	}

	handleMessagesUnsetReactionEvent(e) {
		this.log('handleMessagesUnsetReactionEvent');

		const { peer: { domain: localPeerDomain } } = this.config;

		const { payload: { federated_room_id, federated_message_id, federated_user_id, reaction, shouldReact } } = e;

		// Load the federated room
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerDomain, federated_room_id);
		const localRoom = federatedRoom.getLocalRoom();

		// Load the user who reacted
		const federatedUser = FederatedUser.loadByFederationId(localPeerDomain, federated_user_id);
		const localUser = federatedUser.getLocalUser();

		// Load the message
		const federatedMessage = FederatedMessage.loadByFederationId(localPeerDomain, federated_message_id);
		const localMessage = federatedMessage.getLocalMessage();

		// Callback management
		Federation.peerClient.addCallbackToSkip('afterUnsetReaction', federatedMessage.getFederationId());

		// Unset message reaction
		setReaction(localRoom, localUser, localMessage, reaction, shouldReact);
	}
}
