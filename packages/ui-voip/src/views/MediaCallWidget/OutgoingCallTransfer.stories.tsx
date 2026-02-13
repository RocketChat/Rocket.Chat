import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import OutgoingCallTransfer from './OutgoingCallTransfer';
import { MockedMediaCallProvider } from '../../context';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Transferred_call__from__to: '{{from}} transferred call to',
		Transferring_call: 'Transferring call',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

export default {
	title: 'V2/Views/OutgoingCallTransfer',
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

export const OutgoingCallTransferStory: StoryFn<typeof OutgoingCallTransfer> = () => {
	return <OutgoingCallTransfer />;
};
