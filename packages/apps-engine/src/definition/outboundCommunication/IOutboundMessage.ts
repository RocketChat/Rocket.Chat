/**
 * A message Rocket.Chat asks an outbound provider to deliver.
 *
 * Only templates can be sent: the messaging platforms behind these providers
 * require a pre-approved template to open a conversation.
 */
export interface IOutboundMessage {
	/** The recipient, as the provider's channel addresses them. */
	to: string;
	type: 'template';
	/** The sender to deliver from, which has to be one of the keys of `ProviderMetadata.templates`. */
	templateProviderPhoneNumber: string;
	/** The agent the resulting conversation is assigned to. */
	agentId?: string;
	/** The department the resulting conversation is routed to. */
	departmentId?: string;
	/** Which approved template to send, and the values to fill it with. */
	template: {
		/** The template's name, as the provider registered it. */
		name: string;
		language: {
			/** The template translation to send, as a language code. */
			code: string;
			/** Whether the provider may fall back to another translation. */
			policy?: 'deterministic' | 'fallback';
		};
		/**
		 * The values for the template's placeholders.
		 *
		 * A template with no placeholders needs none, so this is optional.
		 */
		components?: TemplateComponent[];
		/** The provider namespace the template belongs to. */
		namespace?: string;
	};
}

/** The values for one part of a template, in the order that part declares them. */
export type TemplateComponent = {
	/** Which part of the template these values fill. */
	type: 'header' | 'body' | 'footer' | 'button';
	/** The values, positional. */
	parameters: TemplateParameter[];
};

/**
 * One value substituted into a template placeholder.
 *
 * The typed variants carry a `fallbackValue` the provider shows when it cannot
 * format the value for the recipient's locale.
 */
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
			format: 'image' | 'document' | 'video';
	  }
	| {
			type: 'document';
			document: {
				link: string;
				filename: string;
			};
	  }
	| {
			type: 'video';
			video: {
				link: string;
			};
	  }
	| {
			type: 'image';
			image: {
				link: string;
			};
	  };
