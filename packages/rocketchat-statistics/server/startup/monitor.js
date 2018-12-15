import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { SAUMonitor } from '../lib/SAUMonitor';

RocketChat.SAUMonitor = new SAUMonitor();

Meteor.startup(() => {
	RocketChat.SAUMonitor.start(InstanceStatus.id());
});
