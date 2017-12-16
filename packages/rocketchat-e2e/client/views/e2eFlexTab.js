Template.e2eFlexTab.helpers({
	e2eAvailable() {
		return RocketChat.E2E && RocketChat.E2E.isEnabled();
	},
	e2eReady() {
		return RocketChat.E2E && RocketChat.E2E.isReady();
	},
	established() {
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		return e2e && e2e.established.get();
	},
	establishing() {
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		return e2e && e2e.establishing.get();
	},
	isGroup() {
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		return e2e && (e2e.typeOfRoom === 'p');
	}
});

Template.e2eFlexTab.events({
	'click button.initE2E'(e) {
		e.preventDefault();
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		if (e2e) {
			RocketChat.E2E.startClient();
		}
	},
	'click button.start'(e, t) {
		e.preventDefault();
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		if (e2e) {
			e2e.handshake(true);
			t.timeout = Meteor.setTimeout(() => {
				swal('Timeout', '', 'error');
				e2e.establishing.set(false);
			}, 10000);
		}
	},
	'click button.refresh'(e, t) {
		e.preventDefault();
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		if (e2e) {
			// e2e.reset(true);
			// RocketChat.Notifications.notifyUser(user._id, 'e2e', 'clearGroupKey', { roomId: self.roomId, userId: self.userId });
			// Notify all users of the refresh. Similar to clearGroupKey notification.
			e2e.handshake(true, true);
			t.timeout = Meteor.setTimeout(() => {
				swal('Timeout', '', 'error');
				e2e.establishing.set(false);
			}, 10000);
		}
	},
	'click button.clearGroupKey'(e) {
		e.preventDefault();
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		if (e2e) {
			e2e.end();
			e2e.clearGroupKey();
			swal({
				title: `<i class='icon-key alert-icon failure-color'></i>${ TAPi18n.__('E2E') }`,
				text: TAPi18n.__('The E2E session key was cleared. Session has now ended.'),
				html: true
			});
		}
	},
	'click button.end'(e) {
		e.preventDefault();
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		if (e2e) {
			e2e.end();
		}
	}
});

Template.e2eFlexTab.onCreated(function() {
	this.timeout = null;
	this.autorun(() => {
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.data.rid);
		if (e2e && e2e.established.get()) {
			Meteor.clearTimeout(this.timeout);
		}
	});
});
