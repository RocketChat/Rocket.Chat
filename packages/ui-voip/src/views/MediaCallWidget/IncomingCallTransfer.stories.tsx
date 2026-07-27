import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import IncomingCallTransfer from './IncomingCallTransfer';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Transferring_call_incoming: 'Incoming call transfer',
		Transferring_call_incoming__from_: 'From {{from}}',
		Reject: 'Reject',
		Accept: 'Accept',
	})
	.buildStoryDecorator();

export default {
	component: IncomingCallTransfer,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallProvider transferredBy='Jason'>
				<Story />
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof IncomingCallTransfer>;

export const IncomingCallTransferStory: StoryObj<typeof IncomingCallTransfer> = {};
