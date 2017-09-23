/* globals menu popover */
Template.sidebarItem.events({
	'click [data-id], click .sidebar-item__link'() {
		return menu.close();
	},
	'click .sidebar-item__menu'(e) {
		const canLeave = () => {
			const roomData = Session.get(`roomData${ this.rid }`);

			if (!roomData) { return false; }

			return !(((roomData.cl != null) && !roomData.cl) || (['d', 'l'].includes(roomData.t)));
		};
		e.preventDefault();
		const items = [{
			icon: 'eye-off',
			name: t('Hide_room'),
			type: 'sidebar-item',
			id: 'hide'
		}];
		if (canLeave()) {
			items.push({
				icon: 'sign-out',
				name: t('Leave_room'),
				type: 'sidebar-item',
				id: 'leave',
				modifier: 'error'
			});
		}
		const config = {
			popoverClass: 'sidebar-item',
			columns: [
				{
					groups: [
						{
							items
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
