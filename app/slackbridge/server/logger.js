import { Logger } from '../../logger';

export const logger = new Logger('SlackBridge', {
	sections: {
		connection: 'Connection',
		events: 'Events',
		class: 'Class',
		slack: 'Slack',
		rocket: 'Rocket',
	},
});
