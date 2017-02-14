_dbs.getKnowledgeAdapter = function () {
	var knowledgeSource = '';

	const KNOWLEDGE_SRC_APIAI = "0";
	const KNOWLEDGE_SRC_REDLINK = "1";

	RocketChat.settings.get('Livechat_Knowledge_Source', function (key, value) {
		knowledgeSource = value;
	});

	let adapterProps = {
		url: '',
		token: '',
		language: ''
	};

	switch (knowledgeSource) {
	case KNOWLEDGE_SRC_APIAI:
		adapterProps.url = 'https://api.api.ai/api/query?v=20150910';

		RocketChat.settings.get('Livechat_Knowledge_Apiai_Key', function (key, value) {
			adapterProps.token = value;
		});
		RocketChat.settings.get('Livechat_Knowledge_Apiai_Language', function (key, value) {
			adapterProps.language = value;
		});

		if (!_dbs.apiaiAdapter) {
			_dbs.apiaiAdapter = new _dbs.ApiAiAdapterClass(adapterProps);
		}
		return _dbs.apiaiAdapter;
		break;
	case KNOWLEDGE_SRC_REDLINK:
		return _dbs.RedlinkAdapterFactory.getInstance(); // buffering done inside the factory method
		break;
	}
};

/**
 * Refreshes the adapter instances on change of the configuration - the redlink-adapter factory does that on its own
 */
Meteor.autorun(()=> {
	RocketChat.settings.get('Livechat_Knowledge_Source', function (key, value) {
		_dbs.apiaiAdapter = undefined;
	});

	RocketChat.settings.get('Livechat_Knowledge_Apiai_Key', function (key, value) {
		_dbs.apiaiAdapter = undefined;
	});

	RocketChat.settings.get('Livechat_Knowledge_Apiai_Language', function (key, value) {
		_dbs.apiaiAdapter = undefined;
	});
});
