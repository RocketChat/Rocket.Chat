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
		console.log('burger', RocketChat.Layout.isEmbedded());
		return RocketChat.Layout.isEmbedded();
	}
});
