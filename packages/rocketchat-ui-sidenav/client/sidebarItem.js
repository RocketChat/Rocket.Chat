/* globals menu */

Template.sidebarItem.events({
	'click [data-id]'() {
		return menu.close();
	}
});
