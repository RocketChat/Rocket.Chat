/* globals logger:true */
/* exported logger */

logger = new Logger('SlackBridge', {
	sections: {
		connection: 'Connection',
		events: 'Events',
		class: 'Class',
		slack: 'Slack',
		rocket: 'Rocket'
	}
});
