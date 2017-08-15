Template.burger.helpers({
	unread() {
		return Session.get('unread');
	},
	isMenuOpen() {
		if (Session.equals('isMenuOpen', true)) {
			return 'menu-opened';
		}
	},
	isNew() {
		return Template.instace().new === true ? '' : 'rc-old';
	}
});
