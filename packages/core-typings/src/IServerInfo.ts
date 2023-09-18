export interface IServerInfo {
	info: IInfo;
	success: boolean;
	supportedVersions: SupportedVersions;
	minimumClientVersions?: {
		desktop: string;
		mobile: string;
	};
}

export type IInfo = {
	build: {
		arch: string;
		cpus: number;
		date: string;
		freeMemory: number;
		nodeVersion: string;
		osRelease: string;
		platform: string;
		totalMemory: number;
	};
	commit: {
		author?: string;
		branch?: string;
		date?: string;
		hash?: string;
		subject?: string;
		tag?: string;
	};
	marketplaceApiVersion: string;
	version: string;
	tag?: string;
	branch?: string;
};

type Dictionary = {
	[lng: string]: Record<string, string>;
};

export type Message = {
	remainingDays: number;
	title: 'message_token';
	subtitle: 'message_token';
	description: 'message_token';
	type: 'info' | 'alert' | 'error';
	params: Record<string, unknown> & {
		instance_ws_name: string;
		instance_username: string;
		instance_email: string;
		instance_domain: string;
		remaining_days: number;
	};
	link: string;
};

export type Version = {
	version: string;
	expiration: Date;
	messages?: Message[];
};

export type SupportedVersions = {
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
};
