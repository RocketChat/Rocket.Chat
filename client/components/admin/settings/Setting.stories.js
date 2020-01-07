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

export const _default = () =>
	<Setting.Memoized
		_id='setting-id'
		label='Label'
		hint='Hint'
	/>;

export const withCallout = () =>
	<Setting.Memoized
		_id='setting-id'
		label='Label'
		hint='Hint'
		callout='Callout text'
	/>;

export const skeleton = () =>
	<Setting.Skeleton />;
