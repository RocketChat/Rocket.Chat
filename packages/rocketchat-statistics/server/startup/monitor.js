/* globals InstanceStatus */
import { SAUMonitor } from '../lib/SAUMonitor';

RocketChat.SAUMonitor = new SAUMonitor();

Meteor.startup(() => {
	RocketChat.SAUMonitor.start(InstanceStatus.id());
});
