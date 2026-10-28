import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import IncomingCall from './IncomingCall';
import MockedMediaCallProvider from '../../providers/MockedMediaCallProvider';

const mockedContexts = mockAppRoot()
	.withTranslations('en', 'core', {
		Incoming_call: 'Incoming call',
		Reject: 'Reject',
		Accept: 'Accept',
	})
	.buildStoryDecorator();

export default {
	component: IncomingCall,
	decorators: [
		mockedContexts,
		(Story) => (
			<MockedMediaCallProvider>
				<Story />
			</MockedMediaCallProvider>
		),
	],
} satisfies Meta<typeof IncomingCall>;

export const IncomingCallStory: StoryObj<typeof IncomingCall> = {};
