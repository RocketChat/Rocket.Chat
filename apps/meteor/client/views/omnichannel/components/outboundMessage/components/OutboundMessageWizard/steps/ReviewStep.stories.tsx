import { Box } from '@rocket.chat/fuselage';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';

import ReviewStep from './ReviewStep';
import { createFakeOutboundTemplate } from '../../../../../../../../tests/mocks/data/outbound-message';

const steps = new StepsLinkedList([
	{ id: 'test-step-1', title: 'Test Step 1' },
	{ id: 'test-step-2', title: 'Test Step 2' },
	{ id: 'test-step-3', title: 'Test Step 3' },
]);

const mockWizardApi = {
	steps,
	currentStep: steps.head?.next ?? null,
	next: () => undefined,
	previous: () => undefined,
	register: () => () => undefined,
	goTo: () => undefined,
	resetNextSteps: () => undefined,
};

const meta = {
	component: ReviewStep,
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
	decorators: [
		(Story) => (
			<WizardContext.Provider value={mockWizardApi}>
				<Box maxWidth={600} margin='auto'>
					<Story />
				</Box>
			</WizardContext.Provider>
		),
	],
} satisfies Meta<typeof ReviewStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		agentName: 'John Doe',
		contactName: 'Jane Smith',
		agentUsername: 'johndoe',
		departmentName: 'Support',
		providerName: 'Rocket.Chat',
		providerType: 'phone',
		sender: '+1234567890',
		recipient: '+0987654321',
		templateParameters: {
			header: [{ type: 'text', format: 'text', value: 'Dentist' }],
			body: [
				{ type: 'text', format: 'text', value: 'John Doe' },
				{ type: 'text', format: 'text', value: 'tomorrow' },
				{ type: 'text', format: 'text', value: '10:00 AM' },
				{ type: 'text', format: 'text', value: '14:00 PM' },
				{ type: 'text', format: 'text', value: 'slot' },
				{ type: 'text', format: 'text', value: 'John Doe' },
			],
		},
		template: createFakeOutboundTemplate(),
		onSend: () => Promise.resolve(),
	},
};
