import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import AppLogsItem from './AppLogsItem';

export default {
	title: 'Components/AppLogsItem',
	component: AppLogsItem,
	args: {
		entries: [
			{
				severity: 'info',
				timestamp: new Date().toISOString(),
				caller: 'method',
				args: ['arg1', 'arg2'],
			},
			{
				severity: 'error',
				timestamp: new Date().toISOString(),
				caller: 'method',
				args: ['arg1', 'arg2'],
			},
			{
				severity: 'warn',
				timestamp: new Date().toISOString(),
				caller: 'method',
				args: ['arg1', 'arg2'],
			},
			{
				severity: 'debug',
				timestamp: new Date().toISOString(),
				caller: 'method',
				args: ['arg1', 'arg2'],
			},
			{
				severity: 'success',
				timestamp: new Date().toISOString(),
				caller: 'method',
				args: ['arg1', 'arg2'],
			},
		],
		instanceId: '',
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<ComponentProps<typeof AppLogsItem>>;

export const Simple: StoryFn<ComponentProps<typeof AppLogsItem>> = (args) => <AppLogsItem {...args} />;
