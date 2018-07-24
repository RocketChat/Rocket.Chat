import { SAUMonitor } from './lib/SAUMonitor';

RocketChat.SAUMonitor = new SAUMonitor();

Meteor.startup(() => {
	RocketChat.SAUMonitor.setDebugMode(true);
	RocketChat.SAUMonitor.start();
});
