import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { settings } from '../../../settings/client';
import { RoomManager, RoomHistoryManager } from '../../../ui-utils/client';
import { hasAllPermission } from '../../../authorization/client';
import { call } from '../../../../client/lib/utils/call';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import './messageBoxNotSubscribed.html';

Template.messageBoxNotSubscribed.helpers({
	customTemplate() {
		return roomCoordinator.getRoomTypeConfigById(this.rid)?.notSubscribedTpl;
	},
	canJoinRoom() {
		return Meteor.userId() && roomCoordinator.getRoomDirectivesById(this.rid)?.showJoinLink(this.rid);
	},
	roomName() {
		const room = Session.get(`roomData${this.rid}`);
		return roomCoordinator.getRoomName(room.t, room);
	},
	isJoinCodeRequired() {
		const room = Session.get(`roomData${this.rid}`);
		return room?.joinCodeRequired;
	},
	isAnonymousReadAllowed() {
		return Meteor.userId() == null && settings.get('Accounts_AllowAnonymousRead') === true;
	},
	isAnonymousWriteAllowed() {
		return (
			Meteor.userId() == null &&
			settings.get('Accounts_AllowAnonymousRead') === true &&
			settings.get('Accounts_AllowAnonymousWrite') === true
		);
	},
});

Template.messageBoxNotSubscribed.events({
	async 'click .js-join-code'(event: JQuery.ClickEvent) {
		event.stopPropagation();
		event.preventDefault();

		const joinCodeInput = Template.instance().find('[name=joinCode]') as HTMLInputElement;
		const joinCode = joinCodeInput?.value;

		await call('joinRoom', this.rid, joinCode);

		if (hasAllPermission('preview-c-room') === false && RoomHistoryManager.getRoom(this.rid).loaded === 0) {
			const openedRoom = RoomManager.getOpenedRoomByRid(this.rid);
			if (openedRoom) {
				openedRoom.streamActive = false;
				openedRoom.ready = false;
			}
			RoomHistoryManager.getRoom(this.rid).loaded = undefined;
			RoomManager.computation.invalidate();
		}
	},
	'click .js-register'(event: JQuery.ClickEvent) {
		event.stopPropagation();
		event.preventDefault();

		Session.set('forceLogin', true);
	},
	async 'click .js-register-anonymous'(event: JQuery.ClickEvent) {
		event.stopPropagation();
		event.preventDefault();

		const { token } = await call('registerUser', {});
		Meteor.loginWithToken(token);
	},
});
