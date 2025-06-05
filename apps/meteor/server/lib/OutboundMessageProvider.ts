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

export type ProviderMetadata = {
	appId: string;
	appName: string;
	providerType: 'phone' | 'email';
	usesTemplates: boolean;
	templates: Record<string, IOutboundMessageTemplate[]>;
};

export interface IOutboundMessagePhoneProvider {
	type: 'phone';
	name: string;
	sendOutboundMessage(message: IOutboundMessage): Promise<void>;
	getProviderMetadata(): Promise<ProviderMetadata>;
}

/*
 * @ignore - Not implemented yet
 */
export interface IOutboundMessageEmailProvider {
	type: 'email';
	name: string;
	sendOutboundMessage(message: IOutboundMessage): Promise<boolean>;
}

export interface IOutboundMessageProvider {
	registerProvider(provider: any): void;
	unregisterProvider(provider: any): void;
	// providePhoneNumber(provider: IOutboundPhoneMessagePrpvoder): void;
	// provideEmail(provider: IOutboudEmailMessageProvider): void;
	// getOutboundMessageProviders(): IOutboundMessageProvider[];
}

export class OutboundMessageProvider implements IOutboundMessageProvider {
	private readonly outboundMessageProviders: Map<'phone' | 'email', (IOutboundMessagePhoneProvider | IOutboundMessageEmailProvider)[]>;

	public registerProvider(provider: any): void {
		this.outboundMessageProviders.set('phone', [...(this.outboundMessageProviders.get('phone') || []), provider]);
	}

	public unregisterProvider(provider: any): void {
		const index = this.outboundMessageProviders.get(provider);
		if (!index) {
			return;
		}

		this.outboundMessageProviders.delete(provider);
	}
}
