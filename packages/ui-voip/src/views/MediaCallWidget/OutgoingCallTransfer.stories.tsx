import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import OutgoingCall from './OutgoingCall';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Transferred_call__from__to: '{{from}} transferred call to',
		Transferring_call: 'Transferring call',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

const meta = {
	component: OutgoingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallProvider transferredBy='Joy'>
				<Story />
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof OutgoingCall>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OutgoingCallTransferStory: Story = {};
