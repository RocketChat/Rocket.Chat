import React from 'react';

import { GroupSelector } from './GroupSelector';
import { SettingsState } from './SettingsState';

export default {
	title: 'admin/settings/GroupSelector',
	component: GroupSelector,
	decorators: [
		(storyFn) => <SettingsState>{storyFn()}</SettingsState>,
	],
};

export const _default = () => <GroupSelector />;
