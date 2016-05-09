class SlackBridge {
	constructor() {
		this.slackClient = Npm.require('slack-client');
		this.apiToken = RocketChat.settings.get('SlackBridge_APIToken');
	}

	setApiToken(apiToken) {
		this.apiToken = apiToken;
	}

	connect() {
		var RtmClient = this.slackClient.RtmClient;
		var rtm = new RtmClient(this.APIToken, {logLevel: 'debug'});
		rtm.start();

		var CLIENT_EVENTS = this.slackClient.CLIENT_EVENTS;
		rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
			console.log('Connected to Slack', rtmStartData);
		});
	}
}

RocketChat.SlackBridge = new SlackBridge;
