import type {
	IOutboundEmailMessageProvider,
	IOutboundPhoneMessageProvider,
} from '@rocket.chat/apps-engine/definition/outboundComunication';

export interface IOutboundProviderTemplate {
	id: string;
	name: string;
	language: string;
	type: 'whatsapp' | 'email' | string;
	category: 'authentication' | 'utility' | 'marketing' | string;
	// Note: by default, the app will filter all the templates that are not APPROVED
	status: 'approved' | 'rejected' | 'pending' | string;
	qualityScore: {
		score: 'green' | 'yellow' | 'red' | 'unknown' | string;
		reasons: string[] | null;
	};
	components: Component[];
	createdAt: string; // ISO 8601 timestamp
	createdBy: string;
	modifiedAt: string; // ISO 8601 timestamp
	modifiedBy: string;
	namespace: string;
	wabaAccountId: string;
	// This is the phone number that will be used to send the message.
	phoneNumber: string;
	partnerId: string;
	externalId: string;
	updatedExternal: string; // ISO 8601 timestamp
	rejectedReason: string | undefined;
}

type Component = IHeaderComponent | IBodyComponent | IFooterComponent;

// If we happen to have a different structure for this (since this could be a link or idk) we are gonna update this component type
interface IHeaderComponent {
	type: 'header';
	// For UI: if the format is other than TEXT, it should include a media link
	format?: 'text' | 'image' | 'video' | 'document';
	text?: string;
	example?: {
		headerText?: string[];
	};
}

interface IBodyComponent {
	type: 'body';
	text: string;
	example?: {
		bodyText: string[][];
	};
}

interface IFooterComponent {
	type: 'footer';
	text: string;
}

// Template from RC to App
export interface IOutboundMessage {
	to: string;
	type: 'template';
	templateProviderPhoneNumber: string;
	template: {
		name: string;
		language: {
			code: string;
			policy?: 'deterministic' | 'fallback'; // optional, only in some versions
		};
		// Components is optional as some templates dont use any customizable string, they're just strings and can be sent with just the template name
		components?: TemplateComponent[];
		namespace?: string; // optional
	};
}

export type TemplateComponent = {
	type: 'header' | 'body' | 'footer' | 'button';
	parameters: TemplateParameter[];
};

export type TemplateParameter =
	| {
			type: 'text';
			text: string;
	  }
	| {
			type: 'currency';
			currency: {
				fallbackValue: string;
				code: string;
				amount1000: number;
			};
	  }
	| {
			type: 'date_time';
			dateTime: {
				fallbackValue: string;
				timestamp?: number;
				dayOfWeek?: number;
				dayOfMonth?: number;
				year?: number;
				month?: number;
				hour?: number;
				minute?: number;
			};
	  }
	| {
			type: 'media';
			link: string;
	  };

export type IOutboundProvider = {
	providerId: string;
	providerName: string;
	supportsTemplates?: boolean;
	providerType: 'phone' | 'email';
};

export type IOutboundProviderMetadata = IOutboundProvider & {
	templates: Record<string, IOutboundProviderTemplate[]>;
};

export interface IOutboundMessageProvider {
	registerPhoneProvider(provider: IOutboundPhoneMessageProvider): void;
	registerEmailProvider(provider: IOutboundEmailMessageProvider): void;
	getOutboundMessageProviders(type?: ValidOutboundProvider): IOutboundProvider[];
	unregisterProvider(appId: string, providerType: string): void;
}

export const ValidOutboundProviderList = ['phone', 'email'] as const;

export type ValidOutboundProvider = (typeof ValidOutboundProviderList)[number];

export interface IOutboundMessageProviderService {
	outboundMessageProvider: IOutboundMessageProvider;
	listOutboundProviders(type?: string): IOutboundProvider[];
}
