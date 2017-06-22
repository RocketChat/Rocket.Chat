/* globals _dbs, SystemLogger, RocketChat */

class RedlinkAdapter {
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

	static createRedlinkStub(rid, latestKnowledgeProviderResult) {
		const latestRedlinkResult = (latestKnowledgeProviderResult && latestKnowledgeProviderResult.knowledgeProvider === 'redlink')
			? latestKnowledgeProviderResult.prepareResult
			: {};
		return {
			id: latestRedlinkResult.id ? latestRedlinkResult.id : rid,
			meta: latestRedlinkResult.meta ? latestRedlinkResult.meta : {},
			user: latestRedlinkResult.user ? latestRedlinkResult.user : {},
			messages: latestRedlinkResult.messages ? latestRedlinkResult.messages : [],
			tokens: latestRedlinkResult.tokens ? latestRedlinkResult.tokens : [],
			queryTemplates: latestRedlinkResult.queryTemplates ? latestRedlinkResult.queryTemplates : []
		};
	}

	getConversation(rid, latestKnowledgeProviderResult) {

		let analyzedUntil = 0;
		let conversation = [];

		if (latestKnowledgeProviderResult && latestKnowledgeProviderResult.knowledgeProvider === 'redlink') {
			//there might have been another provider configures, e. g. if API.ai was entered earlier
			// therefore we need to validate we're operating with a Redlink-result

			analyzedUntil = latestKnowledgeProviderResult.originMessage ? latestKnowledgeProviderResult.originMessage.ts : 0;
			conversation = latestKnowledgeProviderResult.prepareResult.messages ? latestKnowledgeProviderResult.prepareResult.messages : [];
		}

		const room = RocketChat.models.Rooms.findOneById(rid);
		const owner = room.v || room.u; //livechat or regular room
		RocketChat.models.Messages.find({
			rid,
			_hidden: {$ne: true},
			t: {$exists: false}, //commands and other automated messages have got a type
			ts: {$gt: new Date(analyzedUntil)}
		}).forEach(visibleMessage => {
			conversation.push({
				content: visibleMessage.msg,
				time: visibleMessage.ts,
				origin: (owner._id === visibleMessage.u._id) ? 'User' : 'Agent' //in livechat, the owner of the room is the user
			});
		});
		return conversation;
	}

	onResultModified(modifiedRedlinkResult) {
		try {
			SystemLogger.debug(`sending update to redlinkk with: ${ JSON.stringify(modifiedRedlinkResult) }`);
			const options = this.options;
			options.data = modifiedRedlinkResult.prepareResult;
			const responseRedlinkQuery = HTTP.post(`${ this.properties.url }/query`, options);
			SystemLogger.debug(`received update to redlinkk with: ${ JSON.stringify(responseRedlinkQuery) }`);
			RocketChat.models.LivechatExternalMessage.update(
				{
					_id: modifiedRedlinkResult._id
				},
				{
					$set: {
						result: responseRedlinkQuery.data
					},
					$unset: {
						inlineResults: ''
					}
				});

		} catch (err) {
			SystemLogger.error('Updating redlink results (via QUERY) did not succeed -> ', JSON.stringify(err));
		}
	}

	onMessage(message, context = {}) { //todo: add additionalKeywords from expertise room configuration

		//private methods
		/** This method adapts the service response.
		 * It is intended to make it easier for the consumer to digest the results provided by the AI
		 * @param prepareResponse
		 * @returns prepareResponse
		 * @private
		 */
		const _postprocessPrepare = function(prepareResponse) {
			return prepareResponse;
		};

		const knowledgeProviderResultCursor = this.getKnowledgeProviderCursor(message.rid);
		const latestKnowledgeProviderResult = knowledgeProviderResultCursor.fetch()[0];

		const requestBody = RedlinkAdapter.createRedlinkStub(message.rid, latestKnowledgeProviderResult);
		requestBody.messages = this.getConversation(message.rid, latestKnowledgeProviderResult);

		requestBody.context = context;
		/*
		In future it is likely for expertises to define keywords which are implicitly being used as keyword tokens
		As this is currently not used, commented below. Either delete (with separate commit) or uncomment in future
		 */
		// const _getAdditionalTokens = function (additionalKeywords) {
		// 	let tokens = [];
		//
		// 	additionalKeywords.forEach((keyword) => {
		// 		tokens.push({
		// 			"confidence": 1,
		// 			"messageIdx": -1,
		// 			"start": -1,
		// 			"end": -1,
		// 			"origin": "Agent",
		// 			"state": "Suggested",
		// 			"type": "Keyword",
		// 			"value": keyword
		// 		})
		// 	})
		// };
		// requestBody.tokens = requestBody.tokens.concat(_getAdditionalTokens(additionalKeywords));
		// requestBody.tokens = _dbs.unique(requestBody.tokens);

		try {
			const options = this.options;
			this.options.data = requestBody;

			if (RocketChat.settings.get('DBS_AI_Redlink_Domain')) {
				options.data.context.domain = RocketChat.settings.get('DBS_AI_Redlink_Domain');
			}
			SystemLogger.debug('PREPARE', JSON.stringify(options, '', 2));
			const responseRedlinkPrepare = HTTP.post(`${ this.properties.url }/prepare`, options);

			if (responseRedlinkPrepare.data && responseRedlinkPrepare.statusCode === 200) {
				SystemLogger.debug('PREPARE RESULT', JSON.stringify(responseRedlinkPrepare, '', 2));
				this.purgePreviousResults(knowledgeProviderResultCursor);

				const updateId = latestKnowledgeProviderResult ? latestKnowledgeProviderResult._id : Random.id();
				RocketChat.models.LivechatExternalMessage.update({
					_id: updateId
				},
					{
						rid: message.rid,
						knowledgeProvider: 'redlink',
						originMessage: {_id: message._id, ts: message.ts},
						prepareResult: _postprocessPrepare(responseRedlinkPrepare.data),
						ts: new Date()
					},
					{
						upsert: true
					});

				const externalMessage = RocketChat.models.LivechatExternalMessage.findOneById(updateId);

				Meteor.defer(() => RocketChat.callbacks.run('afterExternalMessage', externalMessage));
			}
		} catch (e) {
			SystemLogger.error('Redlink-Prepare/Query with results from prepare did not succeed -> ', e);
		}
	}

	getQueryResults(roomId, templateIndex, creator) {
		// ---------------- private methods
		const _getKeyForBuffer = function(templateIndex, creator) {
			return `${ templateIndex }-${ creator.replace(/\./g, '_') }`;
		};

		const _getBufferedResults = function(latestKnowledgeProviderResult, templateIndex, creator) {

			if (latestKnowledgeProviderResult && latestKnowledgeProviderResult.knowledgeProvider === 'redlink' && latestKnowledgeProviderResult.inlineResults) {
				return latestKnowledgeProviderResult.inlineResults[_getKeyForBuffer(templateIndex, creator)];
			}
		};

		/**
		 * We might have modified a prepare resonse earlier.
		 * If we want to revert this adaptation
		 * @param queryTemplates
		 * @private
		 */
		const _preprocessTemplates = function(queryTemplates) {
			return queryTemplates;
		};

		const _postprocessResultResponse = function(results) {
			return results;
		};
		// ---------------- private methods

		let results = [];

		const latestKnowledgeProviderResult = this.getKnowledgeProviderCursor(roomId).fetch()[0];

		if (latestKnowledgeProviderResult) {
			results = _getBufferedResults(latestKnowledgeProviderResult, templateIndex, creator);
		} else {
			return []; // If there was no knowledge-provider-result, there cannot be any results either
		}

		if (!results) {
			try {

				const options = this.options;
				this.options.data = this.options;

				options.data = {
					id: latestKnowledgeProviderResult.id,
					meta: latestKnowledgeProviderResult.meta,
					user: latestKnowledgeProviderResult.user,
					messages: latestKnowledgeProviderResult.prepareResult.messages,
					tokens: latestKnowledgeProviderResult.prepareResult.tokens,
					queryTemplates: _preprocessTemplates(latestKnowledgeProviderResult.prepareResult.queryTemplates),
					context: latestKnowledgeProviderResult.prepareResult.context
				};


				if (RocketChat.settings.get('DBS_AI_Redlink_Domain')) {
					options.data.context.domain = RocketChat.settings.get('DBS_AI_Redlink_Domain');
				}
				SystemLogger.debug('RESULTS requested for', creator, ': ', JSON.stringify(options, '', 2));
				const responseRedlinkResult = HTTP.post(`${ this.properties.url }/result/${ creator }/?templateIdx=${ templateIndex }`, options);
				if (responseRedlinkResult.data && responseRedlinkResult.statusCode === 200) {
					SystemLogger.debug('RESULTS RETRIEVED for', creator, ': ', JSON.stringify(responseRedlinkResult, '', 2));
					results = responseRedlinkResult.data;

					results = _postprocessResultResponse(results);

					//buffer the results
					const inlineResultsMap = latestKnowledgeProviderResult.inlineResults || {};
					inlineResultsMap[_getKeyForBuffer(templateIndex, creator)] = results;

					RocketChat.models.LivechatExternalMessage.update(
						{
							_id: latestKnowledgeProviderResult._id
						},
						{
							$set: {
								inlineResults: inlineResultsMap
							}
						});

				} else {
					SystemLogger.error('Couldn\'t  read result from Redlink');
				}
			} catch (err) {
				SystemLogger.error('Retrieving Query-resuls from Redlink did not succeed -> ', err);
			}
		}
		return results;
	}

	purgePreviousResults(knowledgeProviderResultCursor) {
		//delete suggestions proposed so far - Redlink will always analyze the complete conversation
		knowledgeProviderResultCursor.forEach((oldSuggestion) => {
			RocketChat.models.LivechatExternalMessage.remove(oldSuggestion._id);
		});
	}

	getKnowledgeProviderCursor(roomId) {
		return RocketChat.models.LivechatExternalMessage.findByRoomId(roomId, {ts: -1});
	}

	getStoredConversation(conversationId) {
		const options = this.options;

		const response = HTTP.get(`${ this.properties.url }/store/${ conversationId }`, options);
		if (response.statusCode === 200) {
			return response.data;
		}
	}

	onClose(room) { //async

		const knowledgeProviderResultCursor = this.getKnowledgeProviderCursor(room._id);
		const latestKnowledgeProviderResult = knowledgeProviderResultCursor.fetch()[0];
		if (latestKnowledgeProviderResult) {
			// latestKnowledgeProviderResult.helpful = room.rbInfo.knowledgeProviderUsage;

			const options = this.options;
			options.data = latestKnowledgeProviderResult.prepareResult;

			//mark result as closed. This is necessary in order to make it searchable
			options.data.meta.status = 'Complete';

			if (RocketChat.settings.get('DBS_AI_Redlink_Domain')) {
				if (!options.data.context) {
					options.data.context = {};
				}
				options.data.context.domain = RocketChat.settings.get('DBS_AI_Redlink_Domain');
			}
			try {
				SystemLogger.debug('STORE:', JSON.stringify(options, '', 2));
				const responseStore = HTTP.post(`${ this.properties.url }/store`, options);
				if (responseStore.statusCode === 200) {
					SystemLogger.debug('STORED as', JSON.stringify(responseStore, '', 2));
					RocketChat.models.LivechatExternalMessage.update(
						{
							_id: latestKnowledgeProviderResult._id
						},
						{
							$set: {
								prepareResult: responseStore.data
							}
						});
					return latestKnowledgeProviderResult._id;
				}
			} catch (err) {
				SystemLogger.error('Error on Store', err);
			}
		}
	}
}

class RedlinkMock extends RedlinkAdapter {
	constructor(adapterProps) {
		super(adapterProps);

		this.properties.url = 'http://localhost:8080';
		delete this.headers.authorization;
	}
}

class RedlinkAdapterFactory {
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
				this.singleton = new RedlinkMock(adapterProps);
			} else {
				this.singleton = new RedlinkAdapter(adapterProps);
			}
			return this.singleton;
		}
	}
}

_dbs.RedlinkAdapterFactory = RedlinkAdapterFactory;
