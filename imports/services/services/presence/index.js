// import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { applyMeteorMixin } from '../../utils';

import {
	newConnection,
	removeConnection,
} from './services';

import {
	afterAll,
} from './hooks';

export default {
	version: 1,
	settings: {
		$noVersionPrefix: true,
	},
	name: 'presence',
	mixins: [applyMeteorMixin()], // TODO remove
	hooks: {
		after: {
			'*': afterAll,
		},
	},
	actions: {
		newConnection,
		removeConnection,
	},
};
