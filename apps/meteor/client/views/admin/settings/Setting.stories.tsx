import { FieldGroup } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Setting from './Setting';

export default {
	title: 'Admin/Settings/Setting',
	component: Setting,
	subcomponents: {
		'Setting.Memoized': Setting.Memoized,
	},
	parameters: {
		layout: 'centered',
		actions: {
			argTypesRegex: '^on.*',
		},
	},
	decorators: [
		(fn) => (
			<div className='rc-old'>
				<div className='page-settings'>{fn()}</div>
			</div>
		),
	],
} as ComponentMeta<typeof Setting>;

export const Default: ComponentStory<typeof Setting.Memoized> = (args) => <Setting.Memoized {...args} />;
Default.args = {
	_id: 'setting-id',
	label: 'Label',
	hint: 'Hint',
};

export const WithCallout: ComponentStory<typeof Setting.Memoized> = (args) => <Setting.Memoized {...args} />;
WithCallout.args = {
	_id: 'setting-id',
	label: 'Label',
	hint: 'Hint',
	callout: 'Callout text',
};

export const types = () => (
	<FieldGroup>
		<Setting.Memoized _id='setting-id-1' label='Label' type='action' actionText='Action text' />
		<Setting.Memoized _id='setting-id-2' label='Label' type='asset' />
		<Setting.Memoized _id='setting-id-3' label='Label' type='boolean' />
		<Setting.Memoized _id='setting-id-4' label='Label' type='code' />
		<Setting.Memoized _id='setting-id-5' label='Label' type='font' />
		<Setting.Memoized _id='setting-id-6' label='Label' type='int' />
		<Setting.Memoized _id='setting-id-7' label='Label' type='language' />
		<Setting.Memoized _id='setting-id-8' label='Label' type='password' />
		<Setting.Memoized _id='setting-id-9' label='Label' type='relativeUrl' />
		<Setting.Memoized _id='setting-id-10' label='Label' type='select' />
		<Setting.Memoized _id='setting-id-11' label='Label' type='string' />
	</FieldGroup>
);

export const skeleton = () => <Setting.Skeleton />;
