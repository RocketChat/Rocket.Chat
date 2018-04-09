export class RocketChatRoomAnnouncement {
	constructor(args={}) {
		this.room = new ReactiveVar(args.room);
		this.message = new ReactiveVar(args.message);
		this.callback = new ReactiveVar(args.callback);
	}
	save() {
		const announcementObject = { message: this.message.get(), callback: this.callback.get() };
		Meteor.call('saveRoomSettings', this.room.get(), 'roomAnnouncement', announcementObject);
	}
}
