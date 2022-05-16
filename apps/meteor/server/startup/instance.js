import os from 'os';

import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { startStreamBroadcast } from '../stream/streamBroadcast';

Meteor.startup(function () {
	const instance = {
		host: process.env.INSTANCE_IP ? String(process.env.INSTANCE_IP).trim() : 'localhost',
		port: String(process.env.PORT).trim(),
		os: {
			type: os.type(),
			platform: os.platform(),
			arch: os.arch(),
			release: os.release(),
			uptime: os.uptime(),
			loadavg: os.loadavg(),
			totalmem: os.totalmem(),
			freemem: os.freemem(),
			cpus: os.cpus().length,
		},
		nodeVersion: process.version,
	};

	InstanceStatus.registerInstance('rocket.chat', instance);

	return startStreamBroadcast();
});
