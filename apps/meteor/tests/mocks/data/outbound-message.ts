import { faker } from '@faker-js/faker';
import type { IOutboundProvider, IOutboundProviderMetadata, IOutboundProviderTemplate } from '@rocket.chat/core-typings';
import { capitalize } from '@rocket.chat/string-helpers';

export const createFakeProvider = (overrides: Partial<IOutboundProvider> = {}): IOutboundProvider => ({
	providerId: faker.string.uuid(),
	providerName: faker.company.name(),
	providerType: 'phone',
	supportsTemplates: true,
	...overrides,
});

export const createFakeProviderMetadata = (overrides: Partial<IOutboundProviderMetadata> = {}): IOutboundProviderMetadata => {
	const { templates, ...providerOverrides } = overrides;
	const provider = createFakeProvider(providerOverrides);
	const phoneNumber = faker.phone.number();
	return {
		...provider,
		templates: templates || {
			[phoneNumber]: [createFakeOutboundTemplate({ phoneNumber })],
		},
	};
};

export const createFakeOutboundTemplate = (overrides: Partial<IOutboundProviderTemplate> = {}): IOutboundProviderTemplate => ({
	id: faker.string.uuid(),
	name: `${capitalize(faker.company.catchPhraseAdjective())} ${faker.company.buzzNoun()} Template`,
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
			format: 'VIDEO',
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
	rejectedReason: '',
	...overrides,
});
