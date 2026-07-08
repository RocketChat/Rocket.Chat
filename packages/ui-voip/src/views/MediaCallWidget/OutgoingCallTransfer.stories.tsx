import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import OutgoingCallTransfer from './OutgoingCallTransfer';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Transferred_call__from__to: '{{from}} transferred call to',
		Transferring_call: 'Transferring call',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

export default {
	component: OutgoingCallTransfer,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallProvider transferredBy='Joy'>
				<Story />
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof OutgoingCallTransfer>;

export const OutgoingCallTransferStory: StoryObj<typeof OutgoingCallTransfer> = {};
