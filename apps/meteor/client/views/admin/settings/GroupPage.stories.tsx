import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import GroupPage from './GroupPage';

export default {
	title: 'Admin/Settings/GroupPage',
	component: GroupPage,
	subcomponents: {
		'GroupPage.Skeleton': GroupPage.Skeleton,
	},
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof GroupPage>;

export const Default: ComponentStory<typeof GroupPage> = (args) => <GroupPage {...args} />;

export const WithGroup: ComponentStory<typeof GroupPage> = (args) => <GroupPage {...args} />;
WithGroup.args = {
	_id: 'General',
	i18nLabel: 'General',
};

export const Skeleton: ComponentStory<typeof GroupPage.Skeleton> = () => <GroupPage.Skeleton />;
