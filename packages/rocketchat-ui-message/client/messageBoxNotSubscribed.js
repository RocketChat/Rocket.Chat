import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { settings } from 'meteor/rocketchat:settings';
import { RoomHistoryManager, RoomManager, call } from 'meteor/rocketchat:ui-utils';
import { t, roomTypes } from 'meteor/rocketchat:utils';
import { hasAllPermission } from 'meteor/rocketchat:authorization';
import toastr from 'toastr';
import './messageBoxNotSubscribed.html';


Template.messageBoxNotSubscribed.helpers({
	customTemplate() {
		return roomTypes.getNotSubscribedTpl(this.rid);
	},
	canJoinRoom() {
		return Meteor.userId() && roomTypes.verifyShowJoinLink(this.rid);
	},
	roomName() {
		const room = Session.get(`roomData${ this.rid }`);
		return roomTypes.getRoomName(room.t, room);
	},
	isJoinCodeRequired() {
		const room = Session.get(`roomData${ this.rid }`);
		return room && room.joinCodeRequired;
	},
	isAnonymousReadAllowed() {
		return (Meteor.userId() == null) &&
			settings.get('Accounts_AllowAnonymousRead') === true;
	},
	isAnonymousWriteAllowed() {
		return (Meteor.userId() == null) &&
			settings.get('Accounts_AllowAnonymousRead') === true &&
			settings.get('Accounts_AllowAnonymousWrite') === true;
	},
});

Template.messageBoxNotSubscribed.events({
	async 'click .js-join'(event) {
		event.stopPropagation();
		event.preventDefault();

		const joinCode = Template.instance().$('[name=joinCode]').val();

		try {
			await call('joinRoom', this.rid, joinCode);
			if (hasAllPermission('preview-c-room') === false && RoomHistoryManager.getRoom(this.rid).loaded === 0) {
				RoomManager.getOpenedRoomByRid(this.rid).streamActive = false;
				RoomManager.getOpenedRoomByRid(this.rid).ready = false;
				RoomHistoryManager.getRoom(this.rid).loaded = null;
				RoomManager.computation.invalidate();
			}
		} catch (error) {
			toastr.error(t(error.reason));
		}
	},

	'click .js-register'(event) {
		event.stopPropagation();
		event.preventDefault();

		Session.set('forceLogin', true);
	},

	async 'click .js-register-anonymous'(event) {
		event.stopPropagation();
		event.preventDefault();

		const { token } = await call('registerUser', {});
		Meteor.loginWithToken(token);
	},
});
