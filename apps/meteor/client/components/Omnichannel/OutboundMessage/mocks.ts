import type { IOutboundProvider, IOutboundProviderMetadata } from '@rocket.chat/core-typings';

export const getProvidersMock = async (): Promise<IOutboundProvider[]> => {
	return [
		{
			providerId: 'providerramdonlygeneratedid',
			providerName: 'Mock WhatsApp App',
			providerType: 'phone',
			supportsTemplates: true,
		},
	];
};

export const getProviderMetadataMock = (): IOutboundProviderMetadata => ({
	providerId: 'providerramdonlygeneratedid',
	providerName: 'Mock WhatsApp App',
	providerType: 'phone',
	supportsTemplates: true,
	templates: {
		'+5547998461115': [
			{
				id: 'phonenumberramdomlygenerateid',
				name: 'Dentist Appointment',
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
			},
			{
				id: 'phonenumberramdomlygenerateid2',
				name: `Doctor's Appointment`,
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
						text: '**Hi {{1}}** Your _appointment_ for {{2}} is scheduled for {{3}}',
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
			},
		],
	},
});
