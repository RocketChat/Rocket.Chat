import { settings } from '../../../../app/settings';
import { TabBar } from '../../../../app/ui-utils';
import { hasLicense } from '../../license/client';

hasLicense('canned-responses').then((enabled) => {
	if (enabled) {
		TabBar.addButton({
			groups: ['live'],
			id: 'canned-responses',
			i18nTitle: 'Canned Responses',
			icon: 'canned-response',
			template: 'cannedResponses',
			order: 0,
			condition: () => settings.get('Canned_Responses_Enable'),
		});

		TabBar.addButton({
			groups: ['livechat-department-new', 'livechat-department-edit'],
			id: 'department-canned-responses',
			i18nTitle: 'Canned Responses',
			icon: 'canned-response',
			template: 'departmentCannedResponses',
			label: 'Canned Responses',
			order: 0,
			condition: () => settings.get('Canned_Responses_Enable'),
		});
	}
});
