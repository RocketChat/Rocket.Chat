import { callbacks } from '../../../callbacks';

callbacks.add('onCreateRoomTabBar', (info) => {
	const { tabBar, room } = info;

	if (!tabBar) {
		return info;
	}

	if (!room || !room.t || room.t !== 'l') {
		return info;
	}

	const button = tabBar.getButtons().find((button) => button.id === 'visitor-info');
	if (!button) {
		return info;
	}

	const { template, i18nTitle: label, icon } = button;
	tabBar.setTemplate(template);
	tabBar.setData({
		label,
		icon,
	});

	tabBar.open();

	return info;
});
