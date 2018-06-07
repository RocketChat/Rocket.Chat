Template.burger.helpers({
	unread() {
		const unread = Session.get('unread');
		window.fireGlobalEvent('unread-messages', {unread_msgs: unread});
		return unread;
	},
	isMenuOpen() {
		if (Session.equals('isMenuOpen', true)) {
			return 'menu-opened';
		}
	},
	embeddedVersion() {
		return RocketChat.Layout.isEmbedded();
	}
});
