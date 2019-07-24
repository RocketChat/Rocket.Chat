import toastr from 'toastr';

import { modal, popover } from '../../../ui-utils/client';
import { t } from '../../../utils/client';
import { Apps } from '../orchestrator';

const promptAppDeactivation = (callback) => {
	modal.open({
		text: t('Apps_Marketplace_Deactivate_App_Prompt'),
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes'),
		cancelButtonText: t('No'),
		closeOnConfirm: true,
		html: false,
	}, (confirmed) => {
		if (!confirmed) {
			return;
		}
		callback();
	});
};

const promptAppUninstall = (callback) => {
	modal.open({
		text: t('Apps_Marketplace_Uninstall_App_Prompt'),
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes'),
		cancelButtonText: t('No'),
		closeOnConfirm: true,
		html: false,
	}, (confirmed) => {
		if (!confirmed) {
			return;
		}
		callback();
	});
};

export const handleAPIError = (error) => {
	console.error(error);
	const message = (error.xhr && error.xhr.responseJSON && error.xhr.responseJSON.error) || error.message;
	toastr.error(message);
};

export const triggerAppPopoverMenu = (app, currentTarget, instance) => {
	if (!app) {
		return;
	}

	const handleDeactivate = () => promptAppDeactivation(async () => {
		try {
			await Apps.disableApp(app.id);
		} catch (error) {
			handleAPIError(error);
		}
	});

	const handleActivate = async () => {
		try {
			await Apps.enableApp(app.id);
		} catch (error) {
			handleAPIError(error);
		}
	};

	const handleUninstall = () => promptAppUninstall(async () => {
		try {
			await Apps.uninstallApp(app.id);
		} catch (error) {
			handleAPIError(error);
		}
	});

	const isAppEnabled = ['auto_enabled', 'manually_enabled'].includes(app.status);

	popover.open({
		currentTarget,
		instance,
		columns: [{
			groups: [
				{
					items: [
						isAppEnabled
							? {
								icon: 'ban',
								name: t('Deactivate'),
								modifier: 'alert',
								action: handleDeactivate,
							}
							: {
								icon: 'check',
								name: t('Activate'),
								action: handleActivate,
							},
						{
							icon: 'trash',
							name: t('Uninstall'),
							modifier: 'alert',
							action: handleUninstall,
						},
					],
				},
			],
		}],
	});
};
