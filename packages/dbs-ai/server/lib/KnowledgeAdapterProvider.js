/* globals _dbs */

_dbs.getKnowledgeAdapter = function() {
	let knowledgeSource = '';

	const KNOWLEDGE_SRC_APIAI = '0';
	const KNOWLEDGE_SRC_REDLINK = '1';

	RocketChat.settings.get('DBS_AI_Source', function(key, value) {
		knowledgeSource = value;
	});

	const adapterProps = {
		url: '',
		token: '',
		language: ''
	};

	switch (knowledgeSource) {
		case KNOWLEDGE_SRC_APIAI:
			adapterProps.url = 'https://api.api.ai/api/query?v=20150910';

			RocketChat.settings.get('Assistify_AI_Apiai_Key', function(key, value) {
				adapterProps.token = value;
			});
			RocketChat.settings.get('Assistify_AI_Apiai_Language', function(key, value) {
				adapterProps.language = value;
			});

			if (!_dbs.apiaiAdapter) {
				_dbs.apiaiAdapter = new _dbs.ApiAiAdapterClass(adapterProps);
			}
			return _dbs.apiaiAdapter;
		case KNOWLEDGE_SRC_REDLINK:
			return _dbs.RedlinkAdapterFactory.getInstance(); // buffering done inside the factory method
	}
};

/**
 * Refreshes the adapter instances on change of the configuration - the redlink-adapter factory does that on its own
 */
//todo: this doesn't work serverside. Observe a raw cursor
// Meteor.autorun(()=> {
// 	RocketChat.settings.get('DBS_AI_Source', function(key) {
// 		_dbs.apiaiAdapter = undefined;
// 	});
//
// 	RocketChat.settings.get('Assistify_AI_Apiai_Key', function(key) {
// 		_dbs.apiaiAdapter = undefined;
// 	});
//
// 	RocketChat.settings.get('Assistify_AI_Apiai_Language', function(key) {
// 		_dbs.apiaiAdapter = undefined;
// 	});
// });
