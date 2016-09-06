Meteor.startup ->
	RocketChat.settings.add 'AutoLinker_StripPrefix', false, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, i18nDescription: 'AutoLinker_StripPrefix_Description'}
	RocketChat.settings.add 'AutoLinker_Urls_Scheme', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true}
	RocketChat.settings.add 'AutoLinker_Urls_www', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true}
	RocketChat.settings.add 'AutoLinker_Urls_TLD', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true}
	RocketChat.settings.add 'AutoLinker_UrlsRegExp', '(://|www\\.).+', {type: 'string', group: 'Message', section: 'AutoLinker', public: true}
	RocketChat.settings.add 'AutoLinker_Email', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true}
	RocketChat.settings.add 'AutoLinker_Phone', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, i18nDescription: 'AutoLinker_Phone_Description'}
