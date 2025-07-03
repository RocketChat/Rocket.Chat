/* eslint-disable @typescript-eslint/naming-convention */
import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';

import PreviewStep from './PreviewStep';
import { createFakeOutboundTemplate } from '../../../../../../../tests/mocks/data/outbound-message';
import { WizardContext } from '../../../../../Wizard/WizardContext';
import { StepsLinkedList } from '../../../../../Wizard/lib/StepsLinkedList';

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
	register: () => undefined,
	goTo: () => undefined,
	resetNextSteps: () => undefined,
};

const meta = {
	title: 'Components/OutboundMessage/OutboundMessageWizard/Steps/PreviewStep',
	component: PreviewStep,
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
	decorators: (Story) => (
		<WizardContext.Provider value={mockWizardApi}>
			<Box maxWidth={600} margin='auto'>
				<Story />
			</Box>
		</WizardContext.Provider>
	),
} satisfies Meta<typeof PreviewStep>;

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
		lepetiOtarrio: 'olar',
		templateParameters: {
			HEADER: ['Dentist'],
			BODY: ['John Doe', 'tomorrow', '10:00 AM', '14:00 PM', 'slot', 'John Doe'],
		},
		template: createFakeOutboundTemplate(),
		onSend: () => Promise.resolve(),
	},
};
