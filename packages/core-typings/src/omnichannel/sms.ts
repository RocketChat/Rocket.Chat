type ServiceMedia = {
	url: string;
	contentType: string;
};
export type ServiceData = {
	from: string;
	to: string;
	body: string;
	media?: ServiceMedia[];
	extra?: Record<string, string | undefined>;
};

export type SMSProviderResult = {
	isSuccess: boolean;
	resultMsg?: string;
	response?: unknown;
};

export type SMSProviderResponse = {
	headers: { [key: string]: string };
	body: string | { success: boolean; error?: string };
};

export interface ISMSProviderConstructor {
	new (accountSid?: string | null, authToken?: string | null, fromNumber?: string | null): ISMSProvider;
}

export interface ISMSProvider {
	parse(data: unknown): ServiceData;
	validateRequest(request: Request): Promise<boolean>;

	sendBatch?(from: string, to: string[], message: string): Promise<SMSProviderResult>;
	response(): SMSProviderResponse;
	send(
		fromNumber: string,
		toNumber: string,
		message: string,
		extraData?: {
			fileUpload?: { size: number; type: string; publicFilePath: string };
			location?: { coordinates: [number, number] };
			rid?: string;
			userId?: string;
		},
	): Promise<SMSProviderResult | void>;
	error(error: Error & { reason?: string }): SMSProviderResponse;
}

export const isServiceData = (data: unknown): data is ServiceData => {
	if (typeof data !== 'object' || data === null) {
		return false;
	}

	const { from, to, body } = data as Record<string, unknown>;

	return typeof from === 'string' && typeof to === 'string' && typeof body === 'string';
};

export type SMSWorker = {
	services: Record<string, ISMSProviderConstructor>;
	accountSid: string | null;
	authToken: string | null;
	fromNumber: string | null;

	registerService(name: string, service: ISMSProviderConstructor): void;
	getService(name: string): ISMSProvider;
	isConfiguredService(name: string): boolean;
};
