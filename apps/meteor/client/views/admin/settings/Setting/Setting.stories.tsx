import { FieldGroup } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import MemoizedSetting from './MemoizedSetting';
import Setting from './Setting';
import SettingSkeleton from './SettingSkeleton';

export default {
	title: 'Admin/Settings/Setting',
	component: Setting,
	parameters: {
		layout: 'centered',
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} satisfies Meta<typeof Setting>;

export const Default: StoryFn<typeof MemoizedSetting> = (args) => <MemoizedSetting {...args} />;
Default.args = {
	_id: 'setting-id',
	label: 'Label',
	hint: 'Hint',
	type: 'string',
};

export const WithCallout: StoryFn<typeof MemoizedSetting> = (args) => <MemoizedSetting {...args} />;
WithCallout.args = {
	_id: 'setting-id',
	label: 'Label',
	hint: 'Hint',
	callout: 'Callout text',
	type: 'string',
};

export const types = () => (
	<FieldGroup>
		<MemoizedSetting packageValue _id='setting-id-1' label='Label' type='action' actionText='Action text' />
		<MemoizedSetting packageValue='' _id='setting-id-2' label='Label' type='asset' />
		<MemoizedSetting packageValue _id='setting-id-3' label='Label' type='boolean' />
		<MemoizedSetting packageValue='' _id='setting-id-4' label='Label' type='code' />
		<MemoizedSetting packageValue='' _id='setting-id-5' label='Label' type='font' />
		<MemoizedSetting packageValue={1} _id='setting-id-6' label='Label' type='int' />
		<MemoizedSetting packageValue='' _id='setting-id-7' label='Label' type='language' />
		<MemoizedSetting packageValue='' _id='setting-id-8' label='Label' type='password' />
		<MemoizedSetting packageValue='' _id='setting-id-9' label='Label' type='relativeUrl' />
		<MemoizedSetting packageValue='' _id='setting-id-10' label='Label' type='select' />
		<MemoizedSetting packageValue='' _id='setting-id-11' label='Label' type='string' />
	</FieldGroup>
);

export const Skeleton = () => <SettingSkeleton />;
