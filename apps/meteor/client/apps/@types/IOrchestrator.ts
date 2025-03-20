import type { ISetting } from '@rocket.chat/apps-engine/definition/settings/ISetting';

export interface IAppExternalURL {
	url: string;
}

export interface ICategory {
	createdDate: Date;
	description: string;
	hidden: boolean;
	id: string;
	modifiedDate: Date;
	title: string;
}

export interface ISettings {
	[key: string]: ISetting;
}
