import { faker } from '@faker-js/faker';
import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';

import type { ActivityItem } from './useActivityList';

export const mockActivityList: ActivityItem[] = [
	{
		id: '123',
		name: 'Haylie George',
		status: { id: 'sent', ts: new Date().toISOString() },
	},
	{
		id: '234',
		name: 'Haylie George',
		status: { id: 'delivered', ts: new Date().toISOString() },
	},
];

const mockTemplate: IOutboundProviderTemplate = {
	id: faker.string.uuid(),
	name: faker.lorem.words(3),
	language: 'en',
	type: 'whatsapp',
	category: 'MARKETING',
	status: 'APPROVED',
	qualityScore: {
		score: 'GREEN',
		reasons: null,
	},
	components: [
		{
			type: 'HEADER',
			format: 'TEXT',
			text: 'New {{1}} appointment',
		},
		{
			type: 'BODY',
			text: '**Hi {{1}}** Your _appointment_ for {{2}} is scheduled for {{3}} and can be rescheduled to {{4}} if {{5}} becomes available. {{6}} what do you choose?',
		},
		{
			type: 'FOOTER',
			text: 'Need to reschedule? Tap below to reply',
		},
	],
	createdAt: '', // ISO 8601 timestamp
	createdBy: '',
	modifiedAt: '', // ISO 8601 timestamp
	modifiedBy: '',
	namespace: '',
	wabaAccountId: '',
	// This is the phone number that will be used to send the message.
	phoneNumber: '+5547998461115',
	partnerId: '',
	externalId: '',
	updatedExternal: '', // ISO 8601 timestamp
	rejectedReason: null,
};

export const mockActivityTemplate = {
	template: mockTemplate,
	templateParameters: {
		HEADER: ['John Doe'],
		BODY: ['john.doe@email.com'],
	},
	contactName: 'John Doe',
	providerType: 'phone' as const,
	providerName: 'WhatsApp',
	departmentName: 'Achromatic Ablation',
	agentName: 'Jane Smith',
	username: 'janes.smith',
	sender: '+554766789954',
	recipient: '+554766789959',
};
