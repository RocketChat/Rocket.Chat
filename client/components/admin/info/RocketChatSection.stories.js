import React from 'react';

import { dummyDate } from '../../../../.storybook/helpers';
import { RocketChatSection } from './RocketChatSection';

export default {
	title: 'admin/info/RocketChatSection',
	component: RocketChatSection,
};

const info = {
	marketplaceApiVersion: 'info.marketplaceApiVersion',
};

const statistics = {
	version: 'statistics.version',
	migration: {
		version: 'statistics.migration.version',
		lockedAt: dummyDate,
	},
	installedAt: dummyDate,
	process: {
		uptime: 10 * 24 * 60 * 60,
		pid: 'statistics.process.pid',
	},
	uniqueId: 'statistics.uniqueId',
	instanceCount: 1,
	oplogEnabled: true,
};

export const _default = () => <RocketChatSection info={info} statistics={statistics} />;

export const loading = () => <RocketChatSection info={{}} statistics={{}} isLoading />;
