/* globals _dbs */

Meteor.startup(() => {
	/*
	Trigger a bot to reply with the most relevant result one AI has retrieved results
	Do this only once in order to avoid user-frustration
	*/
	RocketChat.callbacks.add('afterExternalMessage', function(externalMessage) {

		const helpRequest = RocketChat.models.HelpRequests.findOneByRoomId(externalMessage.rid);
		if (!helpRequest || helpRequest.latestBotReply) {
			return;
		}

		let totalResults = [];

		if (externalMessage.result && externalMessage.result.queryTemplates) {
			externalMessage.result.queryTemplates.forEach((queryTemplate, templateIndex) => {
				queryTemplate.queries.forEach((query) => {
					if (query.inlineResultSupport) {
						const results = _dbs.getKnowledgeAdapter().getQueryResults(externalMessage.rid, templateIndex, query.creator);
						if (results) {
							totalResults = totalResults.concat(
								results.map((result)=> {
									return {
										overallScore: query.confidence * (result.score || 1),
										replySuggestion: result.replySuggestion
									};
								})
							);
						}
					}
				});
			});

			if (totalResults.length > 0) {
				// AI believes it can contribute to the conversation => create a bot-response
				const mostRelevantResult = totalResults.reduce((best, current) => current.overallScore > best.overallScore ? current : best,
					{
						overallScore: 0,
						replySuggestion: ''
					});
				const scoreThreshold = RocketChat.settings.get('Assistify_Bot_Automated_Response_Threshold');
				if (mostRelevantResult.replySuggestion && (mostRelevantResult.overallScore * 1000) >= scoreThreshold) { //multiply by 1000 to simplify configuration
					const botUsername = RocketChat.settings.get('Assistify_Bot_Username');
					const botUser = RocketChat.models.Users.findOneByUsername(botUsername);

					if (!botUser) {
						throw new Meteor.Error('Erroneous Bot-Configuration: Check username');
					}
					try {

						const botMessage = RocketChat.sendMessage({
							username: botUser.username,
							_id: botUser._id
						}, {msg: mostRelevantResult.replySuggestion}, {_id: externalMessage.rid});

						helpRequest.latestBotReply = botMessage;
						RocketChat.models.HelpRequests.registerBotResponse(helpRequest._id, botMessage);

					} catch (err) {
						console.error('Could not add bot help message', err);
						throw new Meteor.Error(err);
					}
				}
			}
		}
	}, RocketChat.callbacks.priority.LOW);
});
