import React from 'react';

import { Setting } from './Setting';
import { SettingsState } from './SettingsState';

export default {
	title: 'admin/settings/Setting',
	component: Setting,
	decorators: [
		(storyFn) => <SettingsState>{storyFn()}</SettingsState>,
	],
};

export const skeleton = () =>
	<Setting.Skeleton />;
