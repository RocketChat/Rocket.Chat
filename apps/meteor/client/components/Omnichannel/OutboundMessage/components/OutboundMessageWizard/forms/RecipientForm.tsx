import type { IOutboundProviderMetadata, Serialized, ILivechatContact } from '@rocket.chat/core-typings';

export type RecipientFormSubmitPayload = {
	contactId: string;
	contact: Serialized<ILivechatContact>;
	providerId: string;
	provider: IOutboundProviderMetadata;
	recipient: string;
	sender: string;
};
