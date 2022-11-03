import type { ISetting } from '@rocket.chat/apps-engine/definition/settings/ISetting';
import type { App } from '@rocket.chat/core-typings';

export interface IDetailedDescription {
	raw: string;
	rendered: string;
}

export interface IDetailedChangelog {
	raw: string;
	rendered: string;
}

export interface IAuthor {
	name: string;
	support: string;
	homepage: string;
}

export interface ILicense {
	license: string;
	version: number;
	expireDate: Date;
}

export interface ISubscriptionInfo {
	typeOf: string;
	status: string;
	statusFromBilling: boolean;
	isSeatBased: boolean;
	seats: number;
	maxSeats: number;
	license: ILicense;
	startDate: Date;
	periodEnd: Date;
	endDate: Date;
	externallyManaged: boolean;
	isSubscribedViaBundle: boolean;
}

export interface IPermission {
	name: string;
	scopes: string[];
}

export interface ILatest {
	internalId: string;
	id: string;
	name: string;
	nameSlug: string;
	version: string;
	categories: string[];
	description: string;
	detailedDescription: IDetailedDescription;
	detailedChangelog: IDetailedChangelog;
	requiredApiVersion: string;
	author: IAuthor;
	classFile: string;
	iconFile: string;
	iconFileData: string;
	status: string;
	isVisible: boolean;
	createdDate: Date;
	modifiedDate: Date;
	isPurchased: boolean;
	isSubscribed: boolean;
	subscriptionInfo: ISubscriptionInfo;
	compiled: boolean;
	compileJobId: string;
	changesNote: string;
	languages: string[];
	privacyPolicySummary: string;
	internalChangesNote: string;
	permissions: IPermission[];
}

export interface IBundledIn {
	bundleId: string;
	bundleName: string;
	addonTierId: string;
}

export interface IILicense {
	license: string;
	version: number;
	expireDate: Date;
}

export interface ITier {
	perUnit: boolean;
	minimum: number;
	maximum: number;
	price: number;
	refId: string;
}

export interface IPricingPlan {
	id: string;
	enabled: boolean;
	price: number;
	trialDays: number;
	strategy: string;
	isPerSeat: boolean;
	tiers: ITier[];
}

export enum EAppPurchaseType {
	PurchaseTypeEmpty = '',
	PurchaseTypeBuy = 'buy',
	PurchaseTypeSubscription = 'subscription',
}

export interface ILanguageInfo {
	Params: string;
	Description: string;
	Setting_Name: string;
	Setting_Description: string;
}

export interface ILanguages {
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
	id: string;
	modifiedDate: Date;
	title: string;
}

// export interface IDeletedInstalledApp {
// 	app: IAppInfo;
// 	success: boolean;
// }

export interface IAppSynced {
	app: App;
	success: boolean;
}

export interface IScreenshot {
	id: string;
	appId: string;
	fileName: string;
	altText: string;
	accessUrl: string;
	thumbnailUrl: string;
	createdAt: Date;
	modifiedAt: Date;
}

export interface IAppScreenshots {
	screenshots: IScreenshot[];
	success: boolean;
}

export interface ISettings {
	[key: string]: ISetting;
}

export interface ISettingsReturn {
	settings: ISettings;
	success: boolean;
}
