/* eslint-disable @typescript-eslint/naming-convention */
import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import RecipientStep from './RecipientStep';
import { createFakeContact, createFakeContactChannel, createFakeContactWithManagerData } from '../../../../../../../../tests/mocks/data';
import { createFakeOutboundTemplate, createFakeProviderMetadata } from '../../../../../../../../tests/mocks/data/outbound-message';

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

const recipientPhone = { raw: '+12127774567', formatted: '+1 212-777-4567' };
const senderPhone = { raw: '+12125554567', formatted: '+1 212-555-4567' };
const contactWithManagerMock = createFakeContactWithManagerData({
	_id: 'contact-1',
	name: 'John Doe',
	phones: [{ phoneNumber: recipientPhone.raw }],
	channels: [
		createFakeContactChannel({
			name: 'provider-1',
			lastChat: { _id: '', ts: new Date().toISOString() },
		}),
	],
});

const { contactManager: _, ...contactNormal } = contactWithManagerMock;
const contactMock = createFakeContact(contactNormal);

const providerMock = createFakeProviderMetadata({
	providerId: 'provider-1',
	providerName: 'WhatsApp',
	templates: {
		[senderPhone.raw]: [createFakeOutboundTemplate({ phoneNumber: senderPhone.raw })],
	},
});

const AppRoot = mockAppRoot()
	.withEndpoint('GET', '/v1/omnichannel/outbound/providers', () => ({ providers: [providerMock] }))
	.withEndpoint('GET', '/v1/omnichannel/outbound/providers/:id/metadata', () => ({ metadata: providerMock }))
	.withEndpoint('GET', '/v1/omnichannel/contacts.get', () => ({ contact: contactMock }))
	.withEndpoint('GET', '/v1/omnichannel/contacts.search', () => ({ contacts: [contactWithManagerMock], count: 1, offset: 0, total: 1 }))
	.build();

const meta = {
	component: RecipientStep,
	parameters: {
		controls: { hideNoControlsWarning: true },
	},
	decorators: [
		(Story) => (
			<AppRoot>
				<WizardContext.Provider value={mockWizardApi}>
					<Box maxWidth={600} margin='auto'>
						<Story />
					</Box>
				</WizardContext.Provider>
			</AppRoot>
		),
	],
} satisfies Meta<typeof RecipientStep>;

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
			contactId: contactWithManagerMock._id,
			providerId: providerMock.providerId,
			recipient: recipientPhone.raw,
			sender: senderPhone.raw,
		},
	},
};
