import { createEphemeralPortal } from '../../../../client/reactAdapters';

export const alerts = {
	async open(config) {
		this.unregister?.();

		this.unregister = await createEphemeralPortal(
			() => import('../../../../client/views/banners/GenericBanner'),
			() => ({
				config,
				onAction: () => {
					if (config.action) {
						config.action.call();
					}
				},
				onClose: () => {
					if (config.onClose) {
						config.onClose.call();
					}
					alerts.close();
				},
			}),
			document.getElementById('alert-anchor'),
		);
	},
	close() {
		this.unregister?.();
	},
};
