import { callbacks } from '../../../callbacks';

callbacks.add('onCreateRoomTabBar', (tabBar, room) => {
	if (!tabBar) {
		return;
	}

	if (!room || !room.t || room.t !== 'l') {
		return;
	}

	const button = tabBar.getButtons().find((button) => button.id === 'visitor-info');
	if (!button) {
		return;
	}

	const { template, i18nTitle: label, icon } = button;
	tabBar.setTemplate(template);
	tabBar.setData({
		label,
		icon,
	});

	tabBar.open();
});
