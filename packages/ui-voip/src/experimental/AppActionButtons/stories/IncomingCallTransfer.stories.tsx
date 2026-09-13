import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import MockedMediaCallProvider from '../../../providers/MockedMediaCallProvider';
import { IncomingCallTransfer } from '../../../views';
import MockedMediaCallAppActionsProvider from '../providers/MockedMediaCallAppActionsProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Transferring_call_incoming: 'Incoming call transfer',
		Transferring_call_incoming__from_: 'From {{from}}',
		Reject: 'Reject',
		Accept: 'Accept',
	})
	.buildStoryDecorator();

export default {
	title: 'Experimental/AppActionButtons/Views/IncomingCallTransfer',
	component: IncomingCallTransfer,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallAppActionsProvider>
				<MockedMediaCallProvider state='ringing' transferredBy='Jason'>
					<Story />
				</MockedMediaCallProvider>
			</MockedMediaCallAppActionsProvider>
		),
	],
} satisfies Meta<typeof IncomingCallTransfer>;

export const IncomingCallTransferStory: StoryFn<typeof IncomingCallTransfer> = () => {
	return <IncomingCallTransfer />;
};
