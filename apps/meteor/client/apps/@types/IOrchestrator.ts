import type { ISetting } from '@rocket.chat/apps-engine/definition/settings/ISetting';

interface ILanguageInfo {
	Params: string;
	Description: string;
	Setting_Name: string;
	Setting_Description: string;
}

interface ILanguages {
	[key: string]: ILanguageInfo;
}

export interface IAppLanguage {
	id: string;
	languages: ILanguages;
}

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
