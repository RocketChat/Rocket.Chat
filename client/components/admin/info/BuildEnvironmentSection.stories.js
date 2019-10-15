import React from 'react';

import { dummyDate } from '../../../../.storybook/helpers';
import { BuildEnvironmentSection } from './BuildEnvironmentSection';

export default {
	title: 'admin/info/BuildEnvironmentSection',
	component: BuildEnvironmentSection,
};

const info = {
	compile: {
		platform: 'info.compile.platform',
		arch: 'info.compile.arch',
		osRelease: 'info.compile.osRelease',
		nodeVersion: 'info.compile.nodeVersion',
		date: dummyDate,
	},
};

export const _default = () => <BuildEnvironmentSection info={info} />;
