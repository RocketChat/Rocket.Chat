// Template from App to RC
export interface IOutboundProviderTemplate {
	id: string;
	name: string;
	language: string;
	type: 'whatsapp' | 'email' | string;
	category: 'AUTHENTICATION' | 'UTILITY' | 'MARKETING' | string;
	// Note: by default, the app will filter all the templates that are not APPROVED
	status: 'APPROVED' | 'REJECTED' | 'PENDING' | string;
	quality_score: {
		score: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN' | string;
		reasons: string[] | null;
	};
	components: Component[];
	created_at: string; // ISO 8601 timestamp
	created_by: string;
	modified_at: string; // ISO 8601 timestamp
	modified_by: string;
	namespace: string;
	waba_account_id: string;
	// This is the phone number that will be used to send the message.
	phone_number: string;
	partner_id: string;
	external_id: string;
	updated_external: string; // ISO 8601 timestamp
	rejected_reason: string | null;
}

type Component = IHeaderComponent | IBodyComponent | IFooterComponent;

// If we happen to have a different structure for this (since this could be a link or idk) we are gonna update this component type
interface IHeaderComponent {
	type: 'HEADER';
	// For UI: if the format is other than TEXT, it should include a media link
	format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
	text?: string;
	example?: {
		header_text?: string[];
	};
}

interface IBodyComponent {
	type: 'BODY';
	text: string;
	example?: {
		body_text: string[][];
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
				fallback_value: string;
				code: string;
				amount_1000: number;
			};
	  }
	| {
			type: 'date_time';
			date_time: {
				fallback_value: string;
				timestamp?: number;
				day_of_week?: number;
				day_of_month?: number;
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
