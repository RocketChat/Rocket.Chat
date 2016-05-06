class SlackBridge {
	constructor() {
		this.slackClient = Npm.require('slack-client');
		this.APIToken = RocketChat.settings.get('SlackBridge_APIToken'); //xoxb-40888909941-BEK8FIePuAvYkcTj5iIKXGw7
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
