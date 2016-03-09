Template.otrFlexTab.helpers({
	otrAvailable() {
		return RocketChat.OTR && RocketChat.OTR.enabled === true;
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
				return user && user.status !== 'offline';
			}
		}
	},
	rsaReady() {
		const otr = RocketChat.OTR.getInstanceByRoomId(this.rid);
		return otr && otr.rsaReady.get();
	},
	establishing() {
		const otr = RocketChat.OTR.getInstanceByRoomId(this.rid);
		return otr && otr.establishing.get();
	}
});

Template.otrFlexTab.events({
	'click button.start': function(e, t) {
		e.preventDefault();
		const otr = RocketChat.OTR.getInstanceByRoomId(this.rid);
		if (otr) {
			otr.handshake();
			t.timeout = Meteor.setTimeout(() => {
				swal("Timeout", "", "error");
				otr.establishing.set(false);
				otr.rsaReady.set(false);
				otr.aesReady.set(false);
			}, 10000);
		}
	},
	'click button.end': function(e, t) {
		e.preventDefault();
		const otr = RocketChat.OTR.getInstanceByRoomId(this.rid);
		if (otr) {
			otr.end();
			otr.rsaReady.set(false);
			otr.aesReady.set(false);
		}
	}
});

Template.otrFlexTab.onCreated(function() {
	this.timeout = null;
	this.autorun(() => {
		const otr = RocketChat.OTR.getInstanceByRoomId(this.data.rid);
		if (otr && otr.aesReady.get()) {
			Meteor.clearTimeout(this.timeout);
		}
	})
});
