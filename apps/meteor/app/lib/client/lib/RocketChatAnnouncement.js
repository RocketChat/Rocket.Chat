import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

export class RocketChatAnnouncement {
	constructor(args = {}) {
		this.room = new ReactiveVar(args.room);
		this.message = new ReactiveVar(args.message);
		this.callback = new ReactiveVar(args.callback);
		this.style = new ReactiveVar(args.style);
	}

	save() {
		const announcementObject = {
			message: this.message.get(),
			callback: this.callback.get(),
			style: this.style.get(),
		};
		Meteor.call('saveRoomSettings', this.room.get(), 'roomAnnouncement', announcementObject);
	}

	getMessage() {
		return this.message.get();
	}

	getCallback() {
		return this.callback.get();
	}

	getStyle() {
		return this.callback.get();
	}

	getByRoom(rid) {
		const roomData = Session.get(`roomData${rid}`);
		if (!roomData) {
			return null;
		}
		this.room.set(rid);
		this.message.set(roomData.announcement);
		this.callback.set(roomData.announcementDetails ? roomData.announcementDetails.callback : null);
		this.style.set(roomData.announcementDetails ? roomData.announcementDetails.style : null);
		return this;
	}

	clear() {
		this.message.set(null);
		this.callback.set(null);
		this.style.set(null);
		Meteor.call('saveRoomSettings', this.room.get(), 'roomAnnouncement', {});
	}
}
