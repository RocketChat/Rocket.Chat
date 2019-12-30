import React from 'react';

import { Section } from './Section';
import { SettingsState } from './SettingsState';

export default {
	title: 'admin/settings/Section',
	component: Section,
	decorators: [
		(storyFn) => <SettingsState>{storyFn()}</SettingsState>,
	],
};

export const _default = () => <Section groupId='General' />;

export const skeleton = () => <Section.Skeleton />;
