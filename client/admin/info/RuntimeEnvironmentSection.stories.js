import React from 'react';

import { RuntimeEnvironmentSection } from './RuntimeEnvironmentSection';

export default {
	title: 'admin/info/RuntimeEnvironmentSection',
	component: RuntimeEnvironmentSection,
	decorators: [
		(fn) => <div className='rc-old'>{fn()}</div>,
	],
};

const statistics = {
	os: {
		type: 'statistics.os.type',
		platform: 'statistics.os.platform',
		arch: 'statistics.os.arch',
		release: 'statistics.os.release',
		uptime: 10 * 24 * 60 * 60,
		loadavg: [1.1, 1.5, 1.15],
		totalmem: 1024,
		freemem: 1024,
		cpus: [{}],
	},
	process: {
		nodeVersion: 'statistics.process.nodeVersion',
	},
	mongoVersion: 'statistics.mongoVersion',
	mongoStorageEngine: 'statistics.mongoStorageEngine',
};

export const _default = () => <RuntimeEnvironmentSection statistics={statistics} />;

export const loading = () => <RuntimeEnvironmentSection statistics={{}} isLoading />;
