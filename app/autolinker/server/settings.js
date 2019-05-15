import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(function() {
	const enableQuery = {
		_id: 'AutoLinker',
		value: true,
	};

	settings.add('AutoLinker', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, i18nLabel: 'Enabled' });

	settings.add('AutoLinker_StripPrefix', false, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, i18nDescription: 'AutoLinker_StripPrefix_Description', enableQuery });
	settings.add('AutoLinker_Urls_Scheme', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery });
	settings.add('AutoLinker_Urls_www', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery });
	settings.add('AutoLinker_Urls_TLD', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery });
	settings.add('AutoLinker_UrlsRegExp', '(://|www\\.).+', { type: 'string', group: 'Message', section: 'AutoLinker', public: true, enableQuery });
	settings.add('AutoLinker_Email', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery });
	settings.add('AutoLinker_Phone', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, i18nDescription: 'AutoLinker_Phone_Description', enableQuery });
});
