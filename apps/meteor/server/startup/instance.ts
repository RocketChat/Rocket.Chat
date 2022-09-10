import os from 'os';

import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { InstanceStatus as InstanceStatusRaw } from '@rocket.chat/models';

import { startStreamBroadcast } from '../stream/streamBroadcast';
import { Logger } from '../lib/logger/Logger';

const logger = new Logger('InstanceStartup');

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

	if (Promise.await(InstanceStatusRaw.getActiveInstanceCount()) > 1) {
		logger.warn(TAPi18n.__('Multiple_monolith_instances_alert'));
	}

	return startStreamBroadcast();
});
