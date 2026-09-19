/**
 * A message template as the App reports it to Rocket.Chat.
 *
 * The messaging platform owns these: the App mirrors what the platform
 * approved, and Rocket.Chat offers the agent the ones it can send.
 */
export interface IOutboundProviderTemplate {
	/** The template's identifier. */
	id: string;
	/** The template's name, which `IOutboundMessage` refers to it by. */
	name: string;
	/** The language of this translation of the template. */
	language: string;
	/** The channel the template is for. */
	type: 'whatsapp' | 'email' | string;
	/** What the platform classified the template as, which governs how it may be used. */
	category: 'authentication' | 'utility' | 'marketing' | string;
	/**
	 * Where the template stands in the platform's review.
	 *
	 * Apps leave out anything but `approved` by default.
	 */
	status: 'approved' | 'rejected' | 'pending' | string;
	/** How the platform rates recipients' reactions to the template. */
	qualityScore: {
		/** The rating itself. */
		score: 'green' | 'yellow' | 'red' | 'unknown' | string;
		/** What drove the rating down, when the platform says. */
		reasons: string[] | null;
	};
	/** The template's parts, which say how many values a message has to supply. */
	components: Component[];
	/** When the template was created, as an ISO 8601 timestamp. */
	createdAt: string;
	/** Who created the template. */
	createdBy: string;
	/** When the template last changed, as an ISO 8601 timestamp. */
	modifiedAt: string;
	/** Who last changed the template. */
	modifiedBy: string;
	/** The provider namespace the template belongs to. */
	namespace: string;
	/** The WhatsApp Business account the template is registered under. */
	wabaAccountId: string;
	/** The number messages using this template are sent from. */
	phoneNumber: string;
	/** The platform partner the account belongs to. */
	partnerId: string;
	/** The template's id on the messaging platform. */
	externalId: string;
	/** When the platform last changed the template, as an ISO 8601 timestamp. */
	updatedExternal: string;
	/** Why the platform rejected the template, when it did. */
	rejectedReason: string | undefined;
}

/** One part of a template, narrowed by its `type`. */
type Component = IHeaderComponent | IBodyComponent | IFooterComponent;

/** The template's header. */
interface IHeaderComponent {
	type: 'header';
	/** What the header holds. Anything other than `text` needs a media link in the message. */
	format?: 'text' | 'image' | 'video' | 'document';
	/** The header's text, with its placeholders unfilled. */
	text?: string;
	/** Sample values, so a preview can show the header filled in. */
	example?: {
		headerText?: string[];
	};
}

/** The template's body. */
interface IBodyComponent {
	type: 'body';
	/** The body's text, with its placeholders unfilled. */
	text: string;
	/** Sample values, so a preview can show the body filled in. */
	example?: {
		bodyText: string[][];
	};
}

/** The template's footer, which takes no placeholders. */
interface IFooterComponent {
	type: 'footer';
	/** The footer's text. */
	text: string;
}
