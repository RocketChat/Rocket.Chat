Template.burger.helpers({
	unread() {
		return Session.get('unread');
	},
	isMenuOpen() {
		if (Session.equals('isMenuOpen', true)) {
			return 'menu-opened';
		}
	},
	isOld() {
		return Template.instance().old === false ? '' : 'rc-old';
	}
});
