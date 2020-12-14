import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings';
import { TabBar } from '../../../ui-utils';


Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.get('AutoTranslate_Enabled') && hasPermission('auto-translate');

		if (!isEnabled) {
			TabBar.removeButton('autotranslate');
			return;
		}

		TabBar.addButton({
			groups: ['channel', 'group', 'direct'],
			id: 'autotranslate',
			i18nTitle: 'Auto_Translate',
			icon: 'language',
			template: 'AutoTranslate',
			full: true,
			order: 20,
		});
	});
});
