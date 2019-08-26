import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { SAUMonitorClass } from '../lib/SAUMonitor';

const SAUMonitor = new SAUMonitorClass();

Meteor.startup(() => {
	SAUMonitor.start(InstanceStatus.id());
});
