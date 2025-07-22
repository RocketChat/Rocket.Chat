import { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IOutboundMessage } from './IOutboundMessage';
import type { IOutboundProviderTemplate } from './IOutboundProviderTemplate';

export type ProviderMetadata = {
	providerId: string;
	providerName: string;
	providerType: 'phone' | 'email';
	supportsTemplates: boolean; // Indicates if the provider uses templates or not
	templates: Record<string, IOutboundProviderTemplate[]>; // Format: { '+1121221212': [{ template }] }
};

interface IOutboundMessageProviderBase {
	appId: string;
	name: string;
	documentationUrl?: string;
	supportsTemplates?: boolean;
	sendOutboundMessage(message: IOutboundMessage, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<void>;
}

export interface IOutboundPhoneMessageProvider extends IOutboundMessageProviderBase {
	type: 'phone';
	getProviderMetadata(read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<ProviderMetadata>;
}

/*
 * @ignore - not implemented yet
 */
export interface IOutboundEmailMessageProvider extends IOutboundMessageProviderBase {
	type: 'email';
}

export type IOutboundMessageProviders = IOutboundPhoneMessageProvider | IOutboundEmailMessageProvider;

export const ValidOutboundProviderList = ['phone', 'email'] as const;

export type ValidOutboundProvider = (typeof ValidOutboundProviderList)[number];
