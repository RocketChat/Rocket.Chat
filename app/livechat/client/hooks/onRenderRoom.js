import { callbacks } from '../../../callbacks';

callbacks.add('onRenderRoom', (instance, room) => {
	if (!instance || !instance.tabBar) {
		return;
	}

	if (!room || !room.t || room.t !== 'l') {
		return;
	}

	const button = instance.tabBar.getButtons().find((button) => button.id === 'visitor-info');
	if (!button) {
		return;
	}

	const { template, i18nTitle: label, icon } = button;
	instance.tabBar.setTemplate(template);
	instance.tabBar.setData({
		label,
		icon,
	});

	instance.tabBar.open();
});
