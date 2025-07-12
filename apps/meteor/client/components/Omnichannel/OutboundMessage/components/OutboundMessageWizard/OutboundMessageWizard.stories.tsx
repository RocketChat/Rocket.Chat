/* eslint-disable @typescript-eslint/naming-convention */
import { faker } from '@faker-js/faker/locale/af_ZA';
import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import OutboundMessageWizard from './OutboundMessageWizard';
import { MessageStep, ReviewStep, RecipientStep, RepliesStep } from './steps';
import {
	createFakeAgent,
	createFakeContact,
	createFakeContactWithManagerData,
	createFakeDepartment,
} from '../../../../../../tests/mocks/data';
import { createFakeOutboundTemplate, createFakeProviderMetadata } from '../../../../../../tests/mocks/data/outbound-message';

const mockDepartment = createFakeDepartment({ name: `${faker.commerce.department()} Department` });

const contactWithManagerMock = createFakeContactWithManagerData({
	_id: 'contact-1',
	name: 'John Doe',
	phones: [{ phoneNumber: '+12125554567' }],
});

const { contactManager: _, ...contactNormal } = contactWithManagerMock;
const contactMock = createFakeContact(contactNormal);

const providerMock = createFakeProviderMetadata({
	providerId: 'provider-1',
	providerName: 'WhatsApp',
	templates: {
		'+12127774567': [createFakeOutboundTemplate({ phoneNumber: '+12127774567' })],
	},
});

const mockAgent = createFakeAgent();
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
	.withEndpoint('GET', '/v1/omnichannel/outbound/providers', () => [providerMock])
	.withEndpoint('GET', '/v1/omnichannel/outbound/providers/:id/metadata', () => providerMock)
	.withEndpoint('GET', '/v1/omnichannel/contacts.get', () => ({ contact: contactMock }))
	.withEndpoint('GET', '/v1/omnichannel/contacts.search', () => ({ contacts: [contactWithManagerMock], count: 1, offset: 0, total: 1 }))
	.build();

const meta = {
	title: 'Components/OutboundMessage/OutboundMessageWizard',
	component: OutboundMessageWizard,
	subcomponents: {
		RecipientStep,
		MessageStep,
		RepliesStep,
		ReviewStep,
	},
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
	decorators: (Story) => (
		<AppRoot>
			<Box maxWidth={600} margin='auto'>
				<Story />
			</Box>
		</AppRoot>
	),
} satisfies Meta<typeof OutboundMessageWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		defaultValues: {},
	},
};

export const WithDefaultValues: Story = {
	args: {
		defaultValues: {
			contactId: contactMock._id,
			providerId: providerMock.providerId,
		},
	},
};
