export interface IOutboundMessage {
	to: string;
	type: 'template';
	templateProviderPhoneNumber: string;
	template: {
		name: string;
		language: {
			code: string;
			policy?: 'deterministic' | 'fallback';
		};
		// Components is optional as some templates dont use any customizable string, they're just strings and can be sent with just the template name
		components?: TemplateComponent[];
		namespace?: string;
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
