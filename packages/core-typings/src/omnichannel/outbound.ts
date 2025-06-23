export interface IOutboundProviderTemplate {
	id: string;
	name: string;
	language: string;
	type: 'whatsapp' | 'email' | string;
	category: 'AUTHENTICATION' | 'UTILITY' | 'MARKETING' | string;
	// Note: by default, the app will filter all the templates that are not APPROVED
	status: 'APPROVED' | 'REJECTED' | 'PENDING' | string;
	qualityScore: {
		score: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN' | string;
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
	rejectedReason: string | null;
}

type Component = IHeaderComponent | IBodyComponent | IFooterComponent;

// If we happen to have a different structure for this (since this could be a link or idk) we are gonna update this component type
interface IHeaderComponent {
	type: 'HEADER';
	// For UI: if the format is other than TEXT, it should include a media link
	format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
	text?: string;
	example?: {
		headerText?: string[];
	};
}

interface IBodyComponent {
	type: 'BODY';
	text: string;
	example?: {
		bodyText: string[][];
	};
}

interface IFooterComponent {
	type: 'FOOTER';
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

type TemplateComponent = {
	type: 'header' | 'body' | 'footer' | 'button';
	parameters: TemplateParameter[];
};

type TemplateParameter =
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
	supportsTemplates: boolean;
	providerType: 'phone' | 'email';
};

export type IOutboundProviderMetadata = IOutboundProvider & {
	templates: Record<string, IOutboundProviderTemplate[]>;
};
