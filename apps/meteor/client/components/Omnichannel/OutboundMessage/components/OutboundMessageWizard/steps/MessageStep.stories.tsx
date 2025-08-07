/* eslint-disable @typescript-eslint/naming-convention */
import { Box } from '@rocket.chat/fuselage';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import MessageStep from './MessageStep';
import { createFakeContact } from '../../../../../../../tests/mocks/data';
import { createFakeOutboundTemplate } from '../../../../../../../tests/mocks/data/outbound-message';

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
	title: 'Components/OutboundMessage/OutboundMessageWizard/Steps/MessageStep',
	component: MessageStep,
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
} satisfies Meta<typeof MessageStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		defaultValues: {},
		templates: [createFakeOutboundTemplate({ id: 'template-1' })],
		contact: createFakeContact(),
		onSubmit: action('onSubmit'),
	},
};

export const WithDefaultValues: Story = {
	args: {
		onSubmit: action('onSubmit'),
		contact: createFakeContact(),
		templates: [createFakeOutboundTemplate({ id: 'template-1' })],
		defaultValues: {
			templateId: 'template-1',
			templateParameters: {
				HEADER: ['Dentist'],
				BODY: ['John Doe', 'tomorrow', '10:00 AM', '14:00 PM', 'slot', 'John Doe'],
			},
		},
	},
};
