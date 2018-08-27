import {TAPi18n} from 'meteor/tap:i18n';

Template.privateNoPermission.helpers({
	data() {
		return Session.get('privateNoPermission');
	},
	name() {
		return Blaze._escape(this.name);
	},
	sameUser() {
		const user = Meteor.user();
		return user && user.username === this.name;
	},
	showSendRequest() {
		const instance = Template.instance();
		return instance.showSendReqeust.get();
	},
	roomName() {
		return this.name;
	},
	requestStatus() {
		const instance = Template.instance();
		return TAPi18n.__(instance.joinRoomStatus.get());
	}
});

Template.privateNoPermission.events({
	'click .joinRoomRequest'(e, t) {
		const modalConfig = {
			title: TAPi18n.__('Join_channel'),
			text: TAPi18n.__('Room_join_request_confirm_text'),
			showCancelButton: true,
			confirmButtonText: TAPi18n.__('Send'),
			cancelButtonColor: '#DD6B55',
			cancelButtonText: TAPi18n.__('Cancel'),
			closeOnConfirm: true,
			html: false,
			type: 'input',
			inputPlaceholder: TAPi18n.__('Room_join_request_comment')
		};
		modal.open(
			modalConfig, (inputValue) => {
				Meteor.call('joinRoomRequest', this.name, Meteor.user(), inputValue, (err, result) => {
					if (err) {
						return err;
					}
					t.joinRoomStatus.set(result.attachments[0].fields[0].status);
					t.showSendReqeust.set(false);
				});
			});

	}
});

Template.privateNoPermission.onCreated(function() {
	const instance = this;
	instance.showSendReqeust = new ReactiveVar(true);
	instance.joinRoomStatus = new ReactiveVar(null);

	const room = Session.get('privateNoPermission');
	Meteor.call('getJoinRoomStatus', room.name, (err, result) => {
		if (err) {
			instance.joinRoomStatus.set(false);
		}
		result.forEach(object => {
			if (object.hasOwnProperty('attachments')) {
				object.attachments.forEach(object => {
					if (object.hasOwnProperty('fields')) {
						object.fields.forEach(object => {
							if (object.hasOwnProperty('status')) {
								instance.joinRoomStatus.set(object.status);
								if (object.status === 'pending') {
									instance.showSendReqeust.set(false);
								}
							}
						});
					}
				});
			}
		});
	});
});
