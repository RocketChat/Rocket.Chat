import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import { OutgoingCallTransfer } from '../../../views';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Transferred_call__from__to: '{{from}} transferred call to',
		Transferring_call: 'Transferring call',
		Cancel: 'Cancel',
	})
	.buildStoryDecorator();

export default {
	title: 'Experimental/AppActionButtons/Views/OutgoingCallTransfer',
	component: OutgoingCallTransfer,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallAppActionsProvider>
				<MockedMediaCallProvider state='calling' transferredBy='Joy'>
					<Story />
				</MockedMediaCallProvider>
			</MockedMediaCallAppActionsProvider>
		),
	],
} satisfies Meta<typeof OutgoingCallTransfer>;

export const OutgoingCallTransferStory: StoryFn<typeof OutgoingCallTransfer> = () => {
	return <OutgoingCallTransfer />;
};
