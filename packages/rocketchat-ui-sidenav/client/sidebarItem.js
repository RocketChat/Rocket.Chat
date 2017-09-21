/* globals menu popover */

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
	},
	'click .sidebar-item__menu'(e) {
		e.preventDefault();

		const config = {
			popoverClass: 'sidebar-item',
			columns: [
				{
					groups: [
						{
							items: [
								{
									icon: 'eye-off',
									name: t('Hide_room'),
									type: 'sidebar-item',
									id: 'hide'
								},
								{
									icon: 'sign-out',
									name: t('Leave_room'),
									type: 'sidebar-item',
									id: 'leave',
									modifier: 'error'
								}
							]
						}
					]
				}
			],
			mousePosition: {
				x: e.clientX,
				y: e.clientY
			},
			data: {
				template: this.t,
				rid: this.rid,
				name: this.name
			}
		};

		popover.open(config);
	}
});
