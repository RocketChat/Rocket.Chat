import { onToggledFeature } from '../../app/license/server/license';
import { addSettings } from '../settings/deviceManagement';

onToggledFeature('device-management', {
	up: async () => {
		const { createPermissions, createEmailTemplates } = await import('../lib/deviceManagement/startup');
		const { listenSessionLogin } = await import('../lib/deviceManagement/session');

		addSettings();
		await createPermissions();
		await createEmailTemplates();
		await listenSessionLogin();
	},
});
