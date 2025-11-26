import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import IncomingCallTransfer from './IncomingCallTransfer';
import { MockedMediaCallProvider } from '../../context';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Transferring_call_incoming: 'Incoming call transfer',
		Transferring_call_incoming__from_: 'From {{from}}',
		Reject: 'Reject',
		Accept: 'Accept',
	})
	.buildStoryDecorator();

export default {
	title: 'V2/Views/IncomingCallTransfer',
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

export const IncomingCallTransferStory: StoryFn<typeof IncomingCallTransfer> = () => {
	return <IncomingCallTransfer />;
};
