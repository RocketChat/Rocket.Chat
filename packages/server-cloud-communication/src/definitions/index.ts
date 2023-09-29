type Dictionary = { [lng: string]: Record<string, string> };

type Message = {
	remainingDays: number;
	title: 'message_token';
	subtitle: 'message_token';
	description: 'message_token';
	type: 'info' | 'alert' | 'error';
	params: Record<string, unknown> & {
		instance_ws_name: string;
		instance_domain: string;
		remaining_days: number;
	};
	link: string;
};

type Version = {
	version: string;
	expiration: Date;
	messages?: Message[];
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface SupportedVersions {
	timestamp: string;
	messages?: Message[];
	versions: Version[];
	exceptions?: {
		domain: string;
		uniqueId: string;
		messages?: Message[];
		versions: Version[];
	};
	i18n?: Dictionary;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface SignedSupportedVersions extends SupportedVersions {
	signed: string; // SerializedJWT<SupportedVersions>;
}
