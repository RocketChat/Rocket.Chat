import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';

Meteor.startup(() => {
	settings.add('Livechat_enable_office_hours', false, {
		type: 'boolean',
		group: 'Omnichannel',
		public: true,
		i18nLabel: 'Office_hours_enabled',
	});

	settings.add('Livechat_allow_online_agents_outside_office_hours', true, {
		type: 'boolean',
		group: 'Omnichannel',
		public: true,
		i18nLabel: 'Allow_Online_Agents_Outside_Office_Hours',
		enableQuery: { _id: 'Livechat_enable_office_hours', value: true },
	});
});
