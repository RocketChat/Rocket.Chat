import { t } from '../../../utils';
import { settings } from '../../../settings/server';

export const getPopoverStatusConfig = (currentTarget, actionCallback) => {
	const popoverStatusConfig = {
		popoverClass: 'edit-status-type',
		columns: [
			{
				groups: [
					{
						items: [
							{
								icon: 'circle',
								name: t('Online'),
								modifier: 'online',
								action: () => {
									(typeof actionCallback === 'function') && actionCallback('online');
									$('input[name=statusType]').val('online');
									$(currentTarget).prop('class', 'rc-input__icon js-status-type edit-status-type-icon--online');
								},
							},
							{
								icon: 'circle',
								name: t('Away'),
								modifier: 'away',
								action: () => {
									(typeof actionCallback === 'function') && actionCallback('away');
									$('input[name=statusType]').val('away');
									$(currentTarget).prop('class', 'rc-input__icon js-status-type edit-status-type-icon--away');
								},
							},
							{
								icon: 'circle',
								name: t('Busy'),
								modifier: 'busy',
								action: () => {
									(typeof actionCallback === 'function') && actionCallback('busy');
									$('input[name=statusType]').val('busy');
									$(currentTarget).prop('class', 'rc-input__icon js-status-type edit-status-type-icon--busy');
								},
							},
							{
								icon: 'circle',
								name: t('Invisible'),
								modifier: 'offline',
								action: () => {
									(typeof actionCallback === 'function') && actionCallback('offline');
									$('input[name=statusType]').val('offline');
									$(currentTarget).prop('class', 'rc-input__icon js-status-type edit-status-type-icon--offline');
								},
							},
						],
					},
				],
			},
		],
		currentTarget,
		offsetVertical: currentTarget.clientHeight,
	};

	if (!settings.get('Accounts_AllowInvisibleStatusOption')) {
		popoverStatusConfig.columns[0].groups[0].items.splice(3, 1);
	}

	return popoverStatusConfig;
};
