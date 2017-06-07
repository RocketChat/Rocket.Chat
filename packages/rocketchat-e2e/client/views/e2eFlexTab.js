Template.e2eFlexTab.helpers({
	e2eAvailable() {
		return RocketChat.E2E && RocketChat.E2E.isEnabled();
	},
	userIsOnline() {
		// I have to appear online for the other user
		if (Meteor.user().status === 'offline') {
			return false;
		}

		if (this.rid) {
			const peerId = this.rid.replace(Meteor.userId(), '');
			if (peerId) {
				const user = Meteor.users.findOne(peerId);
				const online = user && user.status !== 'offline';
				return online;
			}
		}
	},
	established() {
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		return e2e && e2e.established.get();
	},
	establishing() {
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		return e2e && e2e.establishing.get();
	}
});

Template.e2eFlexTab.events({
	'click button.start'(e, t) {
		e.preventDefault();
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		if (e2e) {
			e2e.handshake();
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
			e2e.reset();
			e2e.handshake(true);
			t.timeout = Meteor.setTimeout(() => {
				swal('Timeout', '', 'error');
				e2e.establishing.set(false);
			}, 10000);
		}
	},
	'click button.end'(e/*, t*/) {
		e.preventDefault();
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.rid);
		if (e2e) {
			e2e.end();
		}
	}
});

Template.otrFlexTab.onCreated(function() {
	this.timeout = null;
	this.autorun(() => {
		const e2e = RocketChat.E2E.getInstanceByRoomId(this.data.rid);
		if (e2e && e2e.established.get()) {
			Meteor.clearTimeout(this.timeout);
		}
	});
});
