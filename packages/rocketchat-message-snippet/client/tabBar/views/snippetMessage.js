import moment from 'moment';

Template.snippetMessage.helpers({
	time: function() {
		return moment(this.ts).format(RocketChat.settings.get('Message_TimeFormat'));
	},
	date: function() {
		return moment(this.ts).format(RocketChat.settings.get('Message_DateFormat'));
	},
	own: function() {
		if (this.u !== undefined && this.u && this.u._id === Meteor.userId()) {
			return 'own';
		}
	},
	body: function() {
		return `<a href="/snippet/${this._id}/${this.snippetName}">${this.snippetName}</a>`;
	}
});
