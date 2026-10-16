import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IOutboundMessage } from './IOutboundMessage';
import type { IOutboundProviderTemplate } from './IOutboundProviderTemplate';

/** What a provider reports about itself, including the templates it can send right now. */
export type ProviderMetadata = {
	/** The provider's identifier. */
	providerId: string;
	/** The provider's name, shown to administrators. */
	providerName: string;
	/** The channel the provider reaches people over. */
	providerType: 'phone' | 'email';
	/** Whether the provider sends templates rather than free-form messages. */
	supportsTemplates: boolean;
	/**
	 * The templates available per sender, keyed by the sender's phone number:
	 * ```js
	 * { '+1121221212': [template] }
	 * ```
	 */
	templates: Record<string, IOutboundProviderTemplate[]>;
};

/** What every outbound provider supplies, whatever channel it reaches people over. */
interface IOutboundMessageProviderBase {
	/** The App that provides it. */
	appId: string;
	/** The provider's name, shown to administrators. */
	name: string;
	/** Where an administrator reads about configuring this provider. */
	documentationUrl?: string;
	/** Whether the provider sends templates rather than free-form messages. */
	supportsTemplates?: boolean;
	/**
	 * Hands the message to the external service.
	 *
	 * Throw to report a failure: the caller distinguishes a rejected message from
	 * a delivered one by whether this settles.
	 */
	sendOutboundMessage(message: IOutboundMessage, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<void>;
}

/**
 * A provider that reaches a person over a phone number, WhatsApp for instance.
 *
 * Register one from `IOutboundCommunicationProviderExtend.registerPhoneProvider`; it
 * needs the `outbound-communication.provide` permission.
 */
export interface IOutboundPhoneMessageProvider extends IOutboundMessageProviderBase {
	type: 'phone';
	/**
	 * Reports what the provider can send at this moment.
	 *
	 * Rocket.Chat calls this whenever it needs the template list, so query the
	 * external service rather than returning a list captured at registration.
	 */
	getProviderMetadata(read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<ProviderMetadata>;
}

/**
 * A provider that reaches a person over email.
 *
 * Declared for the shape to come; Rocket.Chat does not dispatch to it yet.
 */
export interface IOutboundEmailMessageProvider extends IOutboundMessageProviderBase {
	type: 'email';
}

/** Any outbound provider, narrowed by its `type`. */
export type IOutboundMessageProviders = IOutboundPhoneMessageProvider | IOutboundEmailMessageProvider;

/** The channels an outbound provider may declare. */
export const ValidOutboundProviderList = ['phone', 'email'] as const;

/** One of {@link ValidOutboundProviderList}. */
export type ValidOutboundProvider = (typeof ValidOutboundProviderList)[number];
