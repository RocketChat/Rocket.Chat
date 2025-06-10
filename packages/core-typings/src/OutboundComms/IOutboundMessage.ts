import type { IOutboundProviderTemplate } from './IOutboundProviderTemplate';

interface IOutboundMessageProviderBase {
	type: 'phone' | 'email';
	appId: string;
	name: string;
	sendOutboundMessage(message: IOutboundMessage): Promise<void | boolean>;
}

export interface IOutboundMessagePhoneProvider extends IOutboundMessageProviderBase {
	type: 'phone';
	getProviderMetadata(): Promise<ProviderMetadata>;
}

/*
 * Not implemented yet
 */
export interface IOutboundMessageEmailProvider extends IOutboundMessageProviderBase {
	type: 'email';
}

export type IOutboundProviders = IOutboundMessagePhoneProvider | IOutboundMessageEmailProvider;

export type ProviderMetadata = {
	appId: string;
	appName: string;
	providerType: 'phone' | 'email';
	usesTemplates: boolean;
	templates: Record<string, IOutboundProviderTemplate[]>;
};

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
		components?: TemplateComponent[];
		namespace?: string;
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
