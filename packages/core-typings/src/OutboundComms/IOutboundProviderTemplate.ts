export interface IOutboundProviderTemplate {
	id: string;
	name: string;
	language: string;
	type: 'whatsapp' | 'email' | string;
	category: 'AUTHENTICATION' | 'UTILITY' | 'MARKETING' | string;
	status: 'APPROVED' | 'REJECTED' | 'PENDING' | string; // NOTE: by 'default', the app will filter all the templates that are not APPROVED
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
	phone_number: string; // This is the phone number that will be used to send the message
	partner_id: string;
	external_id: string;
	updated_external: string; // ISO 8601 timestamp
	rejected_reason: string | null;
}

type Component = IHeaderComponent | IBodyComponent | IFooterComponent;

interface IHeaderComponent {
	type: 'HEADER';
	format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
	example?: {
		header_text?: string[];
	};
}

interface IBodyComponent {
	type: 'BODY';
	text: string;
	example?: {
		body_text?: string[];
	};
}

interface IFooterComponent {
	type: 'FOOTER';
	text: string;
}
