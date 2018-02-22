Meteor.startup(function() {
	const enableQuery = {
		_id: 'AutoLinker',
		value: true
	};
	const enableQueryTruncate = [{
		_id: 'AutoLinker',
		value: true
	}, {
		_id: 'AutoLinker_Truncate',
		value: true
	}];

	RocketChat.settings.add('AutoLinker', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, i18nLabel: 'Enabled'});

	RocketChat.settings.add('AutoLinker_NewWindow', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery});
	RocketChat.settings.add('AutoLinker_Urls_Scheme', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery});
	RocketChat.settings.add('AutoLinker_Urls_www', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery});
	RocketChat.settings.add('AutoLinker_Urls_TLD', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery});
	RocketChat.settings.add('AutoLinker_Email', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery});
	RocketChat.settings.add('AutoLinker_Phone', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, i18nDescription: 'AutoLinker_Phone_Description', enableQuery});
	RocketChat.settings.add('AutoLinker_StripPrefix', false, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, i18nDescription: 'AutoLinker_StripPrefix_Description', enableQuery});
	RocketChat.settings.add('AutoLinker_StripTrailingSlash', false, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery});
	RocketChat.settings.add('AutoLinker_Truncate', false, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery});
	RocketChat.settings.add('AutoLinker_Truncate_Length', 32, {type: 'int', group: 'Message', section: 'AutoLinker', public: true, enableQuery: enableQueryTruncate});
	RocketChat.settings.add('AutoLinker_Truncate_Location', 'end', {type: 'select', values: [ { key: 'end', i18nLabel: 'End' }, { key: 'middle', i18nLabel: 'Middle' }, { key: 'smart', i18nLabel: 'Smart' } ], group: 'Message', section: 'AutoLinker', public: true, enableQuery: enableQueryTruncate});
	RocketChat.settings.add('AutoLinker_DecodePercentEncoding', true, {type: 'boolean', group: 'Message', section: 'AutoLinker', public: true, enableQuery});
});
