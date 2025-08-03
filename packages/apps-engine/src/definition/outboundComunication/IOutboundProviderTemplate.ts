// Template from App to RC
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
	rejectedReason: string | undefined;
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
