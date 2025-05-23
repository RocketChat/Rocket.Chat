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
				timestamp: '2025-05-23T19:56:58.597Z',
				caller: 'method',
				args: ['arg1', 'arg2'],
			},
			{
				severity: 'error',
				timestamp: '2025-03-23T12:16:58.597Z',
				caller: 'method',
				args: ['arg1', 'arg2'],
			},
			{
				severity: 'warn',
				timestamp: '2025-07-23T19:54:58.597Z',
				caller: 'method',
				args: ['arg1', 'arg2'],
			},
			{
				severity: 'debug',
				timestamp: '2025-05-23T19:56:58.597Z',
				caller: 'method',
				args: ['arg1', 'arg2'],
			},
			{
				severity: 'success',
				timestamp: '2025-05-23T19:56:58.597Z',
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
