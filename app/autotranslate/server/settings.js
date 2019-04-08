import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';

Meteor.startup(function() {
	settings.add('AutoTranslate_Enabled', false, { type: 'boolean', group: 'Message', section: 'AutoTranslate', public: true });
	settings.add('AutoTranslate_GoogleAPIKey', '', { type: 'string', group: 'Message', section: 'AutoTranslate', enableQuery: { _id: 'AutoTranslate_Enabled', value: true } });
});
