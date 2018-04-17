export class RocketChatAnnouncement {
	constructor(args={}) {
		this.room = new ReactiveVar(args.room);
		this.message = new ReactiveVar(args.message);
		this.callback = new ReactiveVar(args.callback);
		this.style = new ReactiveVar(args.style);
	}
	save() {
		const announcementObject = { message: this.message.get(), callback: this.callback.get(), style: this.style.get() };
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
}
