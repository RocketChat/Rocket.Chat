import { Meteor } from 'meteor/meteor';

import { settingsRegister } from '../../settings/server';

Meteor.startup(function() {
	const enableQuery = {
		_id: 'AutoLinker',
		value: true,
	};

	settingsRegister.add('AutoLinker', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, i18nLabel: 'Enabled' });

	settingsRegister.add('AutoLinker_StripPrefix', false, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, i18nDescription: 'AutoLinker_StripPrefix_Description', enableQuery });
	settingsRegister.add('AutoLinker_Urls_Scheme', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery });
	settingsRegister.add('AutoLinker_Urls_www', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery });
	settingsRegister.add('AutoLinker_Urls_TLD', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery });
	settingsRegister.add('AutoLinker_UrlsRegExp', '(://|www\\.).+', { type: 'string', group: 'Message', section: 'AutoLinker', public: true, enableQuery });
	settingsRegister.add('AutoLinker_Email', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery });
	settingsRegister.add('AutoLinker_Phone', true, { type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, i18nDescription: 'AutoLinker_Phone_Description', enableQuery });
});
