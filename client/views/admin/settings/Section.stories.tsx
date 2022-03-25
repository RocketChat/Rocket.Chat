import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Section from './Section';

export default {
	title: 'Admin/Settings/Section',
	component: Section,
	subcomponents: {
		'Section.Skeleton': Section.Skeleton,
	},
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof Section>;

export const Default: ComponentStory<typeof Section> = (args) => <Section {...args} />;
Default.args = {
	groupId: 'General',
};

export const Skeleton: ComponentStory<typeof Section.Skeleton> = () => <Section.Skeleton />;
