/* globals _dbs, SystemLogger, RocketChat */

class SmartiAdapter {
	constructor(adapterProps) {

		this.properties = adapterProps;
		this.properties.url = this.properties.url.toLowerCase();

		this.options = {};
		this.options.headers = {};
		this.options.headers['content-Type'] = 'application/json; charset=utf-8';
		if (this.properties.token) {
			this.options.headers['authorization'] = `basic ${ this.properties.token }`;
		}
		if (this.properties.url.substring(0, 4) === 'https') {
			this.options.cert = `~/.nodeCaCerts/${ this.properties.url.replace('https', '') }`;
		}
	}

	onMessage(message) {

		//TODO is this always a new one, what about update

		const requestBody = {
			webhook_url: this.properties.webhookUrl,
			message_id: message._id,
			channel_id: message.rid,
			user_id: message.u._id,
			username: message.u.username,
			text: message.msg,
			timestamp: message.ts,
			origin: message.origin
		};

		try {
			const options = this.options;
			this.options.data = requestBody;

			SystemLogger.debug('Smarti - trigger analysis:', JSON.stringify(options, '', 2));

			const response = HTTP.post(`${ this.properties.url }rocket/${RocketChat.settings.get('DBS_AI_Redlink_Domain')}`, options);

			if (response.statusCode === 200) {
				SystemLogger.debug('Smarti - analysis triggered successfully:', JSON.stringify(response, '', 2));
			} else {
				SystemLogger.error('Smarti - analysis triggering failed:', JSON.stringify(response, '', 2));
			}
		} catch (e) {
			SystemLogger.error('Smarti response did not succeed: ', e);
		}
	}

	onClose(room) { //async
		//TODO add options here?
		//get conversation id
		const m = RocketChat.models.LivechatExternalMessage.findOneById(room._id);

		if(m) {
			const response = HTTP.post(`${ this.properties.url }conversation/${m.conversationId}/publish`);

			if (response.statusCode === 200) {
				SystemLogger.debug('Smarti - closed room successfully:', room._id, JSON.stringify(response, '', 2));
			} else {
				SystemLogger.error('Smarti - closing room failed:', room._id, JSON.stringify(response, '', 2));
			}
		} else {
			SystemLogger.error('Smarti - closing room failed: No conversation id for room ' + room._id);
		}
	}

}

class SmartiMock extends SmartiAdapter {
	constructor(adapterProps) {
		super(adapterProps);

		this.properties.url = 'http://localhost:8080';
		delete this.headers.authorization;
	}
}

class SmartiAdapterFactory {
	constructor() {
		this.singleton = undefined;

		/**
		 * Refreshes the adapter instances on change of the configuration
		 */
		//todo: validate it works
		const factory = this;
		this.settingsHandle = RocketChat.models.Settings.findByIds(['DBS_AI_Source', 'DBS_AI_Redlink_URL', 'DBS_AI_Redlink_Auth_Token', 'DBS_AI_Redlink_Hook_Token']).observeChanges({
			added() {
				factory.singleton = undefined;
			},
			changed() {
				factory.singleton = undefined;
			},
			removed() {
				factory.singleton = undefined;
			}
		});
	}

	static getInstance() {
		if (this.singleton) {
			return this.singleton;
		} else {
			const adapterProps = {
				url: '',
				token: '',
				language: ''
			};

			adapterProps.url = RocketChat.settings.get('DBS_AI_Redlink_URL');

			adapterProps.token = RocketChat.settings.get('DBS_AI_Redlink_Auth_Token');

			adapterProps.webhookUrl = RocketChat.settings.get('Site_Url') + 'api/v1/smarti.result/' + RocketChat.settings.get('DBS_AI_Redlink_Hook_Token');

			console.log(RocketChat.settings);
			console.log(Meteor.settings);

			if (_dbs.mockInterfaces()) { //use mock
				this.singleton = new SmartiMock(adapterProps);
			} else {
				this.singleton = new SmartiAdapter(adapterProps);
			}
			return this.singleton;
		}
	}
}

_dbs.SmartiAdapterFactory = SmartiAdapterFactory;

/**
 * add method to get conversation id via realtime api
 */
Meteor.methods({
	getLastSmartiResult:function(rid) {

		//Todo: check if the user is allowed to get this results!

		SystemLogger.debug('Smarti - last smarti result requested:', JSON.stringify(rid, '', 2));
		SystemLogger.debug('Smarti - last message:', JSON.stringify(RocketChat.models.LivechatExternalMessage.findOneById(rid), '', 2));
		return RocketChat.models.LivechatExternalMessage.findOneById(rid);
	}
});

/**
 * add incoming webhook
 */
RocketChat.API.v1.addRoute('smarti.result/:token', {authRequired: false}, {
	post() {

		check(this.bodyParams, Match.ObjectIncluding({
			conversationId: String,
			channelId: String
		}));

		//verify token
		if(this.urlParams.token && this.urlParams.token == RocketChat.settings.get('DBS_AI_Redlink_Hook_Token')) {

			SystemLogger.debug('Smarti - got conversation result:',JSON.stringify(this.bodyParams,null,2));

			RocketChat.models.LivechatExternalMessage.update({
					_id: this.bodyParams.channelId
				},
				{
					rid: this.bodyParams.channelId,
					knowledgeProvider: 'smarti',
					conversationId: this.bodyParams.conversationId,
					token: this.bodyParams.token,
					ts: new Date()
				},
				{
					upsert: true
				});

			const m = RocketChat.models.LivechatExternalMessage.findOneById(this.bodyParams.channelId);

			RocketChat.Notifications.notifyRoom(this.bodyParams.channelId, 'newConversationResult', m);

			return RocketChat.API.v1.success();

		} else {
			return RocketChat.API.v1.unauthorized({msg:'token not valid'});
		}
	}
});



