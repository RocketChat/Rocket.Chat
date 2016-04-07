Meteor.startup ->
	RocketChat.settings.add 'AutoLinker_StripPrefix', false, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true}
	RocketChat.settings.add 'AutoLinker_Urls', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true}
	RocketChat.settings.add 'AutoLinker_UrlsRegExp', '(://|www\\.).+', {type: 'string', group: 'Message', section: 'AutoLinker', public: true}
	RocketChat.settings.add 'AutoLinker_Email', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true}
	RocketChat.settings.add 'AutoLinker_Phone', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true}
