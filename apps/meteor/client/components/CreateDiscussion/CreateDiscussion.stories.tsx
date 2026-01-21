import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import CreateDiscussion from './CreateDiscussion';

const meta = {
	component: CreateDiscussion,
	parameters: {
		layout: 'centered',
	},
	args: {
		onClose: action('onClose'),
	},
	decorators: [
		mockAppRoot()
			.withEndpoint('POST', '/v1/rooms.createDiscussion', () => ({
				success: true,
				discussion: {
					_id: 'discussion-id',
					t: 'p' as const,
					name: 'discussion-name',
					fname: 'Discussion Name',
					prid: 'parent-room-id',
				} as any,
			}))
			.withEndpoint('GET', '/v1/rooms.info', () => ({
				room: {
					_id: 'parent-room-id',
					t: 'c' as const,
					name: 'general',
					fname: 'General',
					prid: undefined,
					encrypted: false,
				} as any,
			}))
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof CreateDiscussion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
