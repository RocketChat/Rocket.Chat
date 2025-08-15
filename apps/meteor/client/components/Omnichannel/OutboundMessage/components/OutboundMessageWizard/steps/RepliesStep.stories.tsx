/* eslint-disable @typescript-eslint/naming-convention */
import { faker } from '@faker-js/faker';
import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import RepliesStep from './RepliesStep';
import { createFakeAgent, createFakeDepartment } from '../../../../../../../tests/mocks/data';

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

const mockDepartment = createFakeDepartment({ name: `${faker.commerce.department()} Department` });

const mockAgent = createFakeAgent({ _id: 'agent-1' });
const mockDepartmentAgent = {
	...mockAgent,
	username: mockAgent.username || '',
	agentId: mockAgent._id,
	departmentId: mockDepartment._id,
	departmentEnabled: true,
	count: 0,
	order: 0,
};

const AppRoot = mockAppRoot()
	.withEndpoint('GET', '/v1/livechat/department', () => ({ departments: [mockDepartment], count: 1, offset: 0, total: 1 }))
	.withEndpoint('GET', '/v1/livechat/users/agent', () => ({ users: [{ ...mockAgent, departments: [] }], count: 1, offset: 0, total: 1 }))
	.withEndpoint('GET', '/v1/livechat/department/:_id', () => ({ department: mockDepartment, agents: [mockDepartmentAgent] }))
	.withEndpoint('GET', '/v1/livechat/users/agent/:_id', () => ({ user: mockAgent }))
	.build();

const meta = {
	title: 'Components/OutboundMessage/OutboundMessageWizard/Steps/RepliesStep',
	component: RepliesStep,
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
	decorators: (Story) => (
		<AppRoot>
			<WizardContext.Provider value={mockWizardApi}>
				<Box maxWidth={600} margin='auto'>
					<Story />
				</Box>
			</WizardContext.Provider>
		</AppRoot>
	),
} satisfies Meta<typeof RepliesStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		defaultValues: {},
		onSubmit: action('onSubmit'),
	},
};

export const WithDefaultValues: Story = {
	args: {
		onSubmit: action('onSubmit'),
		defaultValues: {
			departmentId: mockDepartment._id,
			agentId: mockAgent._id,
		},
	},
};
