import s from 'underscore.string';

import moment from 'moment';

Template.snippetMessage.helpers({
	time() {
		return moment(this.ts).format(RocketChat.settings.get('Message_TimeFormat'));
	},
	date() {
		return moment(this.ts).format(RocketChat.settings.get('Message_DateFormat'));
	},
	own() {
		if (this.u !== undefined && this.u && this.u._id === Meteor.userId()) {
			return 'own';
		}
	},
	body() {
		return `<a href="/snippet/${ this._id }/${ encodeURIComponent(this.snippetName) }">${ s.escapeHTML(this.snippetName) }</a>`;
	}
});
