import {searchProviderService} from 'meteor/rocketchat:search';
import {SearchProvider} from 'meteor/rocketchat:search';
import Index from './index';
import ChatpalLogger from '../utils/logger';

/**
 * The chatpal search provider enables chatpal search. An appropriate backedn has to be specified by settings.
 */
class ChatpalProvider extends SearchProvider {

	/**
	 * Create chatpal provider with some settings for backend and ui
	 */
	constructor() {
		super('chatpalProvider');

		this.chatpalBaseUrl = 'https://beta.chatpal.io/v1';

		this._settings.add('Backend', 'select', 'cloud', {
			values:[
				{key: 'cloud', i18nLabel: 'Cloud Service'},
				{key: 'onsite', i18nLabel: 'On-Site'}
			],
			i18nLabel: 'Chatpal_Backend',
			i18nDescription: 'Chatpal_Backend_Description'
		});
		this._settings.add('API_Key', 'string', '', {
			enableQuery:[{
				_id: 'Search.chatpalProvider.Backend',
				value: 'cloud'
			}],
			i18nLabel: 'Chatpal_API_Key',
			i18nDescription: 'Chatpal_API_Key_Description'
		});
		this._settings.add('Base_URL', 'string', '', {
			enableQuery:[{
				_id: 'Search.chatpalProvider.Backend',
				value: 'onsite'
			}],
			i18nLabel: 'Chatpal_Base_URL',
			i18nDescription: 'Chatpal_Base_URL_Description'
		});
		this._settings.add('HTTP_Headers', 'string', '', {
			enableQuery:[{
				_id: 'Search.chatpalProvider.Backend',
				value: 'onsite'
			}],
			multiline: true,
			i18nLabel: 'Chatpal_HTTP_Headers',
			i18nDescription: 'Chatpal_HTTP_Headers_Description'
		});
		this._settings.add('Main_Language', 'select', 'en', {
			values: [
				{key: 'en', i18nLabel: 'English'},
				{key: 'none', i18nLabel: 'Language_Not_set'},
				{key: 'cs', i18nLabel: 'Czech'},
				{key: 'de', i18nLabel: 'Deutsch'},
				{key: 'el', i18nLabel: 'Greek'},
				{key: 'es', i18nLabel: 'Spanish'},
				{key: 'fi', i18nLabel: 'Finish'},
				{key: 'fr', i18nLabel: 'French'},
				{key: 'hu', i18nLabel: 'Hungarian'},
				{key: 'it', i18nLabel: 'Italian'},
				{key: 'nl', i18nLabel: 'Dutsch'},
				{key: 'pl', i18nLabel: 'Polish'},
				{key: 'pt', i18nLabel: 'Portuguese'},
				{key: 'pt_BR', i18nLabel: 'Brasilian'},
				{key: 'ro', i18nLabel: 'Romanian'},
				{key: 'ru', i18nLabel: 'Russian'},
				{key: 'sv', i18nLabel: 'Swedisch'},
				{key: 'tr', i18nLabel: 'Turkish'},
				{key: 'uk', i18nLabel: 'Ukrainian'}
			],
			i18nLabel: 'Chatpal_Main_Language',
			i18nDescription: 'Chatpal_Main_Language_Description'
		});
		this._settings.add('DefaultResultType', 'select', 'All', {
			values: [
				{key: 'All', i18nLabel: 'All'},
				{key: 'Messages', i18nLabel: 'Messages'}
			],
			i18nLabel: 'Default_Result_Type',
			i18nDescription: 'Default_Result_Type_Description'
		});
		this._settings.add('PageSize', 'int', 15, {
			i18nLabel: 'Search_Page_Size'
		});
		this._settings.add('SuggestionEnabled', 'boolean', true, {
			i18nLabel: 'Chatpal_Suggestion_Enabled',
			alert: 'This feature is currently in beta and will ne extended in the future'
		});
		this._settings.add('BatchSize', 'int', 100, {
			i18nLabel: 'Chatpal_Batch_Size',
			i18nDescription: 'Chatpal_Batch_Size_Description'
		});
		this._settings.add('TimeoutSize', 'int', 5000, {
			i18nLabel: 'Chatpal_Timeout_Size',
			i18nDescription: 'Chatpal_Timeout_Size_Description'
		});
		this._settings.add('WindowSize', 'int', 48, {
			i18nLabel: 'Chatpal_Window_Size',
			i18nDescription: 'Chatpal_Window_Size_Description'
		});
	}

	get i18nLabel() {
		return 'Chatpal Provider';
	}

	get iconName() {
		return 'chatpal-logo-icon-darkblue';
	}

	get resultTemplate() {
		return 'ChatpalSearchResultTemplate';
	}

	get suggestionItemTemplate() {
		return 'ChatpalSuggestionItemTemplate';
	}

	get supportsSuggestions() {
		return this._settings.get('SuggestionEnabled');
	}

	/**
	 * indexing for messages, rooms and users
	 * @inheritDoc
	 */
	on(name, value, payload) {

		if (!this.index) {
			this.indexFail = true;
			return false;
		}

		switch (name) {
			case 'message.save': return this.index.indexDoc('message', payload);
			case 'user.save': return this.index.indexDoc('user', payload);
			case 'room.save': return this.index.indexDoc('room', payload);
			case 'message.delete': return this.index.removeDoc('message', value);
			case 'user.delete': return this.index.removeDoc('user', value);
			case 'room.delete': return this.index.removeDoc('room', value);
		}

		return true;
	}

	/**
	 * Check if the index has to be deleted and completely new reindexed
	 * @param reason the reason for the provider start
	 * @returns {boolean}
	 * @private
	 */
	_checkForClear(reason) {

		if (reason === 'startup') { return false; }

		if (reason === 'switch') { return true; }

		return this._indexConfig.backendtype !== this._settings.get('Backend') ||
			(this._indexConfig.backendtype === 'onsite' && this._indexConfig.baseurl !== (this._settings.get('Base_URL').endsWith('/') ? this._settings.get('Base_URL').slice(0, -1) : this._settings.get('Base_URL'))) ||
			(this._indexConfig.backendtype === 'cloud' && this._indexConfig.httpOptions.headers['X-Api-Key'] !== this._settings.get('API_Key')) ||
			this._indexConfig.language !== this._settings.get('Main_Language');
	}

	/**
	 * parse string to object that can be used as header for HTTP calls
	 * @returns {{}}
	 * @private
	 */
	_parseHeaders() {
		const headers = {};
		const sh = this._settings.get('HTTP_Headers').split('\n');
		sh.forEach(function(d) {
			const ds = d.split(':');
			if (ds.length === 2 && ds[0].trim() !== '') {
				headers[ds[0]] = ds[1];
			}
		});
		return headers;
	}

	/**
	 * ping if configuration has been set correctly
	 * @param config
	 * @param resolve if ping was successfull
	 * @param reject if some error occurs
	 * @param timeout until ping is repeated
	 * @private
	 */
	_ping(config, resolve, reject, timeout = 5000) {

		const maxTimeout = 200000;

		const stats = Index.ping(config);

		if (stats) {
			ChatpalLogger.debug('ping was successfull');
			resolve({config, stats});
		} else {

			ChatpalLogger.warn(`ping failed, retry in ${ timeout } ms`);

			this._pingTimeout = Meteor.setTimeout(() => {
				this._ping(config, resolve, reject, Math.min(maxTimeout, 2*timeout));
			}, timeout);
		}

	}

	/**
	 * Get index config based on settings
	 * @param callback
	 * @private
	 */
	_getIndexConfig() {

		return new Promise((resolve, reject) => {
			const config = {
				backendtype: this._settings.get('Backend')
			};

			if (this._settings.get('Backend') === 'cloud') {
				config.baseurl = this.chatpalBaseUrl;
				config.language = this._settings.get('Main_Language');
				config.searchpath = '/search/search';
				config.updatepath = '/search/update';
				config.pingpath = '/search/ping';
				config.clearpath = '/search/clear';
				config.suggestionpath = '/search/suggest';
				config.httpOptions = {
					headers: {
						'X-Api-Key': this._settings.get('API_Key')
					}
				};
			} else {
				config.baseurl = this._settings.get('Base_URL').endsWith('/') ? this._settings.get('Base_URL').slice(0, -1) : this._settings.get('Base_URL');
				config.language = this._settings.get('Main_Language');
				config.searchpath = '/chatpal/search';
				config.updatepath = '/chatpal/update';
				config.pingpath = '/chatpal/ping';
				config.clearpath = '/chatpal/clear';
				config.suggestionpath = '/chatpal/suggest';
				config.httpOptions = {
					headers: this._parseHeaders()
				};
			}

			config.batchSize = this._settings.get('BatchSize');
			config.timeout = this._settings.get('TimeoutSize');
			config.windowSize = this._settings.get('WindowSize');

			this._ping(config, resolve, reject);
		});

	}

	/**
	 * @inheritDoc
	 * @param callback
	 */
	stop(resolve) {
		ChatpalLogger.info('Provider stopped');
		Meteor.clearTimeout(this._pingTimeout);
		this.indexFail = false;
		this.index && this.index.stop();
		resolve();
	}

	/**
	 * @inheritDoc
	 * @param reason
	 * @param resolve
	 * @param reject
	 */
	start(reason, resolve, reject) {

		const clear = this._checkForClear(reason);

		ChatpalLogger.debug(`clear = ${ clear } with reason '${ reason }'`);

		this._getIndexConfig().then((server) => {
			this._indexConfig = server.config;

			this._stats = server.stats;

			ChatpalLogger.debug('config:', JSON.stringify(this._indexConfig, null, 2));
			ChatpalLogger.debug('stats:', JSON.stringify(this._stats, null, 2));

			this.index = new Index(this._indexConfig, this.indexFail || clear, this._stats.message.oldest || new Date().valueOf());

			resolve();
		}, reject);
	}

	/**
	 * returns a list of rooms that are allowed to see by current user
	 * @param context
	 * @private
	 */
	_getAcl(context) {
		return RocketChat.models.Subscriptions.find({'u._id': context.uid}).fetch().map(room => room.rid);
	}

	/**
	 * @inheritDoc
	 * @returns {*}
	 */
	search(text, context, payload, callback) {

		if (!this.index) { return callback({msg:'Chatpal_currently_not_active'}); }

		const type = payload.resultType === 'All' ? ['message', 'user', 'room'] : ['message'];

		this.index.query(
			text,
			this._settings.get('Main_Language'),
			this._getAcl(context),
			type,
			payload.start || 0,
			payload.rows || this._settings.get('PageSize'),
			callback
		);

	}

	/**
	 * @inheritDoc
	 */
	suggest(text, context, payload, callback) {
		this.index.suggest(
			text,
			this._settings.get('Main_Language'),
			this._getAcl(context),
			callback
		);
	}
}

searchProviderService.register(new ChatpalProvider());
