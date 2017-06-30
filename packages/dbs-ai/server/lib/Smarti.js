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


	onResultModified() {
		SystemLogger.warn('result modfified should not happen');
	}

	onMessage(message) {

		//TODO is this always a new one, what about updat
		//TODO domain aus den config props
		//TODO callback url
		console.log(message);
		const requestBody = {
			message_id: message._id,
			channel_id: message.rid,
			user_id: message.u._id,
			username: message.u.username,
			text: message.msg,
			timestamp: message.ts
		};

		try {
			const options = this.options;
			this.options.data = requestBody;

			/*if (RocketChat.settings.get('DBS_AI_Redlink_Domain')) { TODO what is domain? the room domain?
				options.data.context.domain = RocketChat.settings.get('DBS_AI_Redlink_Domain');
			}*/

			SystemLogger.debug('Smarti - send request to smarti:', JSON.stringify(options, '', 2));

			const response = HTTP.post(`${ this.properties.url }rocket/${RocketChat.settings.get('uniqueID')}`, options); //TODO set url

			if (response.data && response.statusCode === 200) {

				SystemLogger.debug('Smarti - got response from smarti:', JSON.stringify(response, '', 2));

				RocketChat.models.LivechatExternalMessage.update({
						_id: message.rid
					},
					{
						rid: message.rid,
						knowledgeProvider: 'smarti',
						conversationId: response.data.conversationId,
						token: response.data.token,
						ts: new Date()
					},
					{
						upsert: true
					});

				const m = RocketChat.models.LivechatExternalMessage.findOneById(message.rid);

				RocketChat.Notifications.notifyRoom(message.rid, 'newConversationResult', m);
			}
		} catch (e) {
			SystemLogger.error('Smarti response did not succeed -> ', e);
		}
	}

	onClose(room) { //async

		const options = this.options;
		options.data = {
			roomId: room.id
		};

		try {
			SystemLogger.debug('Smarti - close room:', JSON.stringify(options, '', 2));
			const response = HTTP.post(`${ this.properties.url }/close/true`, options); //TODO set url
			if (response.statusCode === 200) {
				SystemLogger.debug('Smarti - room closed: ', JSON.stringify(response, '', 2));
				//TODO send a message?
			}
		} catch (err) {
			SystemLogger.error('Error on Store', err);
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
		this.settingsHandle = RocketChat.models.Settings.findByIds(['DBS_AI_Source', 'DBS_AI_Redlink_URL', 'DBS_AI_Redlink_Auth_Token']).observeChanges({
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

Meteor.methods({
	getLastSmartiResult:function(rid) {
		SystemLogger.debug('Smarti - last smarti result requested:', JSON.stringify(rid, '', 2));
		SystemLogger.debug('Smarti - last message:',JSON.stringify(RocketChat.models.LivechatExternalMessage.findOneById(rid), '', 2));
		return RocketChat.models.LivechatExternalMessage.findOneById(rid);
	}
});

