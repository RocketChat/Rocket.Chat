import type { IOutboundMessage } from './IOutboundMessage';
import type { IOutboundProviderTemplate } from './IOutboundProviderTemplate';

type ProviderMetadata = {
    appId: string;
    appName: string;
    providerType: 'phone' | 'email';
    // Indicates if the provider uses templates or not
    supportsTemplates: boolean;
    // Format: { '+1121221212': [{ template }] }
    templates: Record<string, IOutboundProviderTemplate[]>;
};

export interface IOutboundPhoneMessageProvider {
    type: 'phone';
    name: string;
    sendOutboundMessage(message: IOutboundMessage): Promise<void>;
    getProviderMetadata(): Promise<ProviderMetadata>;
}

/*
 * @ignore - not implemented yet
 */
export interface IOutboundEmailMessageProvider {
    type: 'email';
    name: string;
    sendOutboundMessage(message: IOutboundMessage): Promise<boolean>;
}
