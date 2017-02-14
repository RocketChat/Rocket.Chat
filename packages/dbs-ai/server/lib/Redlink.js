class RedlinkAdapter {
	constructor(adapterProps) {
		this.properties = adapterProps;
		this.headers = {};
		this.headers['content-Type'] = 'application/json; charset=utf-8';
		if (this.properties.token) {
			this.headers['authorization'] = 'basic ' + this.properties.token;
		}
	}

	createRedlinkStub(rid, latestKnowledgeProviderResult) {
		const latestRedlinkResult = (latestKnowledgeProviderResult && latestKnowledgeProviderResult.knowledgeProvider === 'redlink')
			? latestKnowledgeProviderResult.result
			: {};
		return {
			id: latestRedlinkResult.id ? latestRedlinkResult.id : rid,
			meta: latestRedlinkResult.meta ? latestRedlinkResult.meta : {},
			user: latestRedlinkResult.user ? latestRedlinkResult.user : {},
			messages: latestRedlinkResult.messages ? latestRedlinkResult.messages : [],
			tokens: latestRedlinkResult.tokens ? latestRedlinkResult.tokens : [],
			queryTemplates: latestRedlinkResult.queryTemplates ? latestRedlinkResult.queryTemplates : []
		}
	}

	getConversation(rid, latestKnowledgeProviderResult) {

		let analyzedUntil = 0;
		let conversation = [];

		if (latestKnowledgeProviderResult && latestKnowledgeProviderResult.knowledgeProvider === 'redlink') {
			//there might have been another provider configures, e. g. if API.ai was entered earlier
			// therefore we need to validate we're operating with a Redlink-result

			analyzedUntil = latestKnowledgeProviderResult.originMessage ? latestKnowledgeProviderResult.originMessage.ts : 0;
			conversation = latestKnowledgeProviderResult.result.messages ? latestKnowledgeProviderResult.result.messages : [];
		}

		const room = RocketChat.models.Rooms.findOneById(rid);
		RocketChat.models.Messages.find({
			rid: rid,
			_hidden: {$ne: true},
			ts: {$gt: new Date(analyzedUntil)}
		}).forEach(visibleMessage => {
			conversation.push({
				content: visibleMessage.msg,
				time: visibleMessage.ts,
				origin: (room.v._id === visibleMessage.u._id) ? 'User' : 'Agent' //in livechat, the owner of the room is the user
			});
		});
		return conversation;
	}

	onResultModified(modifiedRedlinkResult) {
		try {
			SystemLogger.debug("sending update to redlinkk with: " + JSON.stringify(modifiedRedlinkResult));
			const responseRedlinkQuery = HTTP.post(this.properties.url + '/query', {
				data: modifiedRedlinkResult.result,
				headers: this.headers
			});
			SystemLogger.debug("recieved update to redlinkk with: " + JSON.stringify(responseRedlinkQuery));
			RocketChat.models.LivechatExternalMessage.update(
				{
					_id: modifiedRedlinkResult._id
				},
				{
					$set: {
						result: responseRedlinkQuery.data
					},
					$unset: {
						inlineResults: ""
					}
				});

		} catch (err) {
			console.error('Updating redlink results (via QUERY) did not succeed -> ', JSON.stringify(err));
		}
	}

	onMessage(message, context = {}) {
		const knowledgeProviderResultCursor = this.getKnowledgeProviderCursor(message.rid);
		const latestKnowledgeProviderResult = knowledgeProviderResultCursor.fetch()[0];

		const requestBody = this.createRedlinkStub(message.rid, latestKnowledgeProviderResult);
		requestBody.messages = this.getConversation(message.rid, latestKnowledgeProviderResult);

		requestBody.context = context;

		try {

			const responseRedlinkPrepare = HTTP.post(this.properties.url + '/prepare', {
				data: requestBody,
				headers: this.headers
			});

			if (responseRedlinkPrepare.data && responseRedlinkPrepare.statusCode === 200) {

				this.purgePreviousResults(knowledgeProviderResultCursor);

				const externalMessageId = RocketChat.models.LivechatExternalMessage.insert({
					rid: message.rid,
					knowledgeProvider: "redlink",
					originMessage: {_id: message._id, ts: message.ts},
					result: responseRedlinkPrepare.data,
					ts: new Date()
				});

				const externalMessage = RocketChat.models.LivechatExternalMessage.findOneById(externalMessageId);

				Meteor.defer(() => RocketChat.callbacks.run('afterExternalMessage', externalMessage));
			}
		} catch (e) {
			console.error('Redlink-Prepare/Query with results from prepare did not succeed -> ', e);
		}
	}

	getQueryResults(roomId, templateIndex, creator) {
		// ---------------- private methods
		const _getKeyForBuffer = function (templateIndex, creator) {
			return templateIndex + '-' + creator.replace(/\./g, '_');
		};

		const _getBufferedResults = function (latestKnowledgeProviderResult, templateIndex, creator) {
			if (latestKnowledgeProviderResult && latestKnowledgeProviderResult.knowledgeProvider === 'redlink' && latestKnowledgeProviderResult.inlineResults) {
				return latestKnowledgeProviderResult.inlineResults[_getKeyForBuffer(templateIndex, creator)];
			}
		};
		// ---------------- private methods

		var results = [];

		const latestKnowledgeProviderResult = this.getKnowledgeProviderCursor(roomId).fetch()[0];

		if (latestKnowledgeProviderResult) {
			results = _getBufferedResults(latestKnowledgeProviderResult, templateIndex, creator);
		} else {
			return []; // If there was no knowledge-provider-result, there cannot be any results either
		}

		if (!results) {
			try {
				const request = {
					data: {
						messages: latestKnowledgeProviderResult.result.messages,
						tokens: latestKnowledgeProviderResult.result.tokens,
						queryTemplates: latestKnowledgeProviderResult.result.queryTemplates,
						context: latestKnowledgeProviderResult.result.context
					},
					headers: this.headers
				};

				const responseRedlinkResult = HTTP.post(this.properties.url + '/result/' + creator + '/?templateIdx=' + templateIndex, request);
				if (responseRedlinkResult.data && responseRedlinkResult.statusCode === 200) {
					results = responseRedlinkResult.data;

					if (creator === 'conversation') {
						results.forEach(function (result)						{
							// Some dirty string operations to convert the snippet to javascript objects
							let transformedSnippet = JSON.stringify(result.snippet);
							transformedSnippet = transformedSnippet.slice(1, transformedSnippet.length - 1); //remove quotes in the beginning and at the end

							if (transformedSnippet) {
								transformedSnippet = '[' + transformedSnippet;
								transformedSnippet = transformedSnippet.replace(/\\n/g, '');
								transformedSnippet = transformedSnippet.replace(/<div class=\\"message seeker\\">/g, '{"origin": "seeker", "text": "');
								transformedSnippet = transformedSnippet.replace(/<div class=\\"message provider\\">/g, '{"origin": "provider", "text": "');
								transformedSnippet = transformedSnippet.replace(/<\/div>/g, '"},');
								transformedSnippet = transformedSnippet.trim();
								if (transformedSnippet.endsWith(',')) {
									transformedSnippet = transformedSnippet.slice(0, transformedSnippet.length - 1);
								}
								transformedSnippet = transformedSnippet + ']';
							}
							try {
								const messages = JSON.parse(transformedSnippet);
								result.messages = messages;
							} catch(err){
								console.error('Error parsing conversation',err)
								}
						});
						results.reduce((result)=>!!result.messages);
					}

					//buffer the results
					let inlineResultsMap = latestKnowledgeProviderResult.inlineResults || {};
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
					console.error("Couldn't  read result from Redlink");
				}
			} catch (err) {
				console.error('Retrieving Query-resuls from Redlink did not succeed -> ', err);
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

	onClose(room) { //async

		const knowledgeProviderResultCursor = this.getKnowledgeProviderCursor(room._id);
		let latestKnowledgeProviderResult = knowledgeProviderResultCursor.fetch()[0];
		if (latestKnowledgeProviderResult) {
			latestKnowledgeProviderResult.helpful = room.rbInfo.knowledgeProviderUsage;

			HTTP.post(this.properties.url + '/store', {
				data: {
					latestKnowledgeProviderResult
				},
				headers: this.headers
			});
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
		Meteor.autorun(()=> {
			RocketChat.settings.get('Livechat_Knowledge_Source', function (key, value) {
				this.singleton = undefined;
			});

			RocketChat.settings.get('Livechat_Knowledge_Redlink_URL', function (key, value) {
				this.singleton = undefined;
			});

			RocketChat.settings.get('Livechat_Knowledge_Redlink_Auth_Token', function (key, value) {
				this.singleton = undefined;
			});
		});
	};

	static getInstance() {
		if (this.singleton) {
			return this.singleton
		} else {
			var adapterProps = {
				url: '',
				token: '',
				language: ''
			};

			adapterProps.url = RocketChat.settings.get('Livechat_Knowledge_Redlink_URL');

			adapterProps.token = RocketChat.settings.get('Livechat_Knowledge_Redlink_Auth_Token');

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
