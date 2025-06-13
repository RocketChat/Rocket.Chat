import { faker } from '@faker-js/faker';
import type { IOutboundProvider, IOutboundProviderMetadata } from '@rocket.chat/core-typings';

export const getProvidersMock = async (): Promise<IOutboundProvider[]> => {
	return [
		{
			providerId: faker.string.uuid(),
			providerName: 'Mock WhatsApp App',
			providerType: 'phone',
			supportsTemplates: true,
		},
	];
};

export const getProviderMetadataMock = (): IOutboundProviderMetadata => ({
	providerId: faker.string.uuid(),
	providerName: 'Mock WhatsApp App',
	providerType: 'phone',
	supportsTemplates: true,
	templates: {
		'47998461115': [
			{
				id: faker.string.uuid(),
				name: 'Dentist Appointment',
				language: 'en',
				type: 'whatsapp',
				category: 'MARKETING',
				status: 'APPROVED',
				quality_score: {
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
						text: '**Hi {{1}}** Your _appointment_ for {{2}} is scheduled for {{3}}',
					},
					{
						type: 'FOOTER',
						text: 'Need to reschedule? Tap below to reply',
					},
				],
				created_at: '', // ISO 8601 timestamp
				created_by: '',
				modified_at: '', // ISO 8601 timestamp
				modified_by: '',
				namespace: '',
				waba_account_id: '',
				// This is the phone number that will be used to send the message.
				phone_number: '47998461115',
				partner_id: '',
				external_id: '',
				updated_external: '', // ISO 8601 timestamp
				rejected_reason: null,
			},
		],
	},
});
