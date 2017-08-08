/* globals menu */

Template.sidebarItem.helpers({
	canLeave() {
		const roomData = Session.get(`roomData${ this.rid }`);

		if (!roomData) { return false; }

		if (((roomData.cl != null) && !roomData.cl) || (roomData.t === 'd')) {
			return false;
		} else {
			return true;
		}
	}
});

Template.sidebarItem.events({
	'click [data-id], click .sidebar-item__link'() {
		return menu.close();
	}
});

Template.sidebarItem.onCreated(function() {
	// console.log('sidebarItem', this.data);
});
