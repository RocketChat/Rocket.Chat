import { t } from '../../../utils';

export const getPopoverStatusConfig = (currentTarget, actionCallback) => ({
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
});
