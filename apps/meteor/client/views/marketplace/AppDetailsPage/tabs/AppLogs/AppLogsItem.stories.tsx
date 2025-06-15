import type { Meta, StoryFn } from '@storybook/react';
import type { ComponentProps } from 'react';

import AppLogsItem from './AppLogsItem';
import { CollapsiblePanel } from './Components/CollapsiblePanel';

export default {
	title: 'Components/AppLogsItem',
	component: AppLogsItem,
	decorators: [(fn) => <CollapsiblePanel style={{ padding: 24 }}>{fn()}</CollapsiblePanel>],
	args: {
		_id: '683da1e32025cfca7b3d8238',
		appId: 'ce0e318b-ffc0-4ce4-832b-f1b464beb22a',
		method: 'app:checkPostMessageSent',
		entries: [
			{
				caller: 'anonymous OR constructor -> handleApp',
				severity: 'debug',
				method: 'app:checkPostMessageSent',
				timestamp: '2025-06-02T13:06:43.772Z',
				args: ["'checkPostMessageSent' is being called..."],
			},
			{
				caller: 'anonymous OR constructor',
				severity: 'debug',
				method: 'app:checkPostMessageSent',
				timestamp: '2025-06-02T13:06:43.777Z',
				args: ["'checkPostMessageSent' was successfully called! The result is:", 'false'],
			},
		],
		startTime: '2025-06-02T13:06:43.771Z',
		endTime: '2025-06-02T13:06:43.777Z',
		totalTime: 6,
		_createdAt: '2025-06-02T13:06:43.777Z',
		instanceId: 'b97ce445-b9ff-4513-8206-966afd799cd6',
		_updatedAt: '2025-06-02T13:06:43.778Z',
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<ComponentProps<typeof AppLogsItem>>;

export const Simple: StoryFn<ComponentProps<typeof AppLogsItem>> = (args) => <AppLogsItem {...args} />;
