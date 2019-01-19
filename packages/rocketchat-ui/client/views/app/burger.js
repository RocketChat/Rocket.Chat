import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { Layout } from 'meteor/rocketchat:ui-utils';

Template.burger.helpers({
	unread() {
		return Session.get('unread');
	},
	isMenuOpen() {
		if (Session.equals('isMenuOpen', true)) {
			return 'menu-opened';
		}
	},
	embeddedVersion() {
		return Layout.isEmbedded();
	},
});
