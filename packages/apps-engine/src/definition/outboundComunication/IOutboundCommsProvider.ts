import type { IOutboundMessage } from './IOutboundMessage';
import type { IOutboundProviderTemplate } from './IOutboundProviderTemplate';

export type ProviderType = 'phone' | 'email';

type ProviderMetadata = {
	appId: string;
	appName: string;
	providerType: ProviderType;
	supportsTemplates: boolean; // Indicates if the provider uses templates or not
	templates: Record<string, IOutboundProviderTemplate[]>; // Format: { '+1121221212': [{ template }] }
};

interface IOutboundMessageProviderBase {
	appId: string;
	name: string;
	documentationUrl?: string;
	sendOutboundMessage(message: IOutboundMessage): Promise<void>;
}

export interface IOutboundPhoneMessageProvider extends IOutboundMessageProviderBase {
	type: 'phone';
	getProviderMetadata(): Promise<ProviderMetadata>;
}

/*
 * @ignore - not implemented yet
 */
export interface IOutboundEmailMessageProvider extends IOutboundMessageProviderBase {
	type: 'email';
}

export type IOutboundMessageProviders = IOutboundPhoneMessageProvider | IOutboundEmailMessageProvider;
