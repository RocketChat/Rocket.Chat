import { SAUMonitor } from './SAUMonitor';

RocketChat.SAUMonitor = new SAUMonitor();

Meteor.startup(() => {
	RocketChat.SAUMonitor.setDebugMode(true);
	RocketChat.SAUMonitor.start();
});
