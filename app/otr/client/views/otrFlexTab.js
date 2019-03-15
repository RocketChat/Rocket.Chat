import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { OTR } from '../rocketchat.otr';
import { modal } from '../../../ui-utils';

Template.otrFlexTab.helpers({
	otrAvailable() {
		return OTR && OTR.isEnabled();
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
	userIsBot() {
		const peerId = this.rid.replace(Meteor.userId(), '');
		const user = Meteor.users.findOne(peerId);
		if (user.username === 'rocket.cat') {
			return true;
		}
		return false;
	},
	established() {
		const otr = OTR.getInstanceByRoomId(this.rid);
		return otr && otr.established.get();
	},
	establishing() {
		const otr = OTR.getInstanceByRoomId(this.rid);
		return otr && otr.establishing.get();
	},
});

Template.otrFlexTab.events({
	'click button.start'(e, t) {
		e.preventDefault();
		const otr = OTR.getInstanceByRoomId(this.rid);
		if (otr) {
			otr.handshake();
			t.timeout = Meteor.setTimeout(() => {
				modal.open({
					title: t('Timeout'),
					type: 'error',
					timer: 2000,
				});
				otr.establishing.set(false);
			}, 10000);
		}
	},
	'click button.refresh'(e, t) {
		e.preventDefault();
		const otr = OTR.getInstanceByRoomId(this.rid);
		if (otr) {
			otr.reset();
			otr.handshake(true);
			t.timeout = Meteor.setTimeout(() => {
				modal.open({
					title: t('Timeout'),
					type: 'error',
					timer: 2000,
				});
				otr.establishing.set(false);
			}, 10000);
		}
	},
	'click button.end'(e/* , t*/) {
		e.preventDefault();
		const otr = OTR.getInstanceByRoomId(this.rid);
		if (otr) {
			otr.end();
		}
	},
});

Template.otrFlexTab.onCreated(function() {
	this.timeout = null;
	this.autorun(() => {
		const otr = OTR.getInstanceByRoomId(this.data.rid);
		if (otr && otr.established.get()) {
			Meteor.clearTimeout(this.timeout);
		}
	});
});
