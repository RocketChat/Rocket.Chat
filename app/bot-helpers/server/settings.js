import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(function() {
	settings.addGroup('Bots', function() {
		this.add('BotHelpers_userFields', '_id, name, username, emails, language, utcOffset', {
			type: 'string',
			section: 'Helpers',
			i18nLabel: 'BotHelpers_userFields',
			i18nDescription: 'BotHelpers_userFields_Description',
		});
		this.add('Bot_Direct_Message_Char_Limit_Allow', false, {
			type: 'boolean',
			public: true,
			section: 'Bot Direct Message Input Limit',
		});
		this.add('Bot_Direct_Message_Char_Limit_MaxAllowedSize', 125, {
			type: 'int',
			public: true,
			section: 'Bot Direct Message Input Limit',
			enableQuery: {
				_id: 'Bot_Direct_Message_Char_Limit_Allow',
				value: true,
			},
		});
	});
});
