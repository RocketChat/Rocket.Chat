import type { PexipLayout } from './PexipLayout';

export type PexipSettings = {
	enabled: boolean;
	baseUrl: string;
	meetingUrl: string;
	escalationParams: string;
	api: {
		username: string;
		password: string;
	};
	pins: {
		host: string;
		guest: string;
	};
	customization: {
		themeName: string;
		locked: boolean;
		overlayText: boolean;
		meetingLayout: PexipLayout;
	};
	workspace: {
		siteUrl: string;
		discussionsEnabled: boolean;
		persistentChatEnabled: boolean;
	};
	sip: {
		addAlias: boolean;
		host: string;
		port: number;
	};
};
