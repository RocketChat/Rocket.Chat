import React from 'react';

import { GroupPage } from './GroupPage';
import { SettingsState } from './SettingsState';

export default {
	title: 'admin/settings/GroupPage',
	component: GroupPage,
	decorators: [
		(storyFn) => <SettingsState>
			{storyFn()}
		</SettingsState>,
	],
};

export const _default = () =>
	<GroupPage />;

export const withGroup = () =>
	<GroupPage
		_id='General'
		i18nLabel='General'
	/>;

export const skeleton = () =>
	<GroupPage.Skeleton />;
