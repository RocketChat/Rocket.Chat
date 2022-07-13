import type { IRocketChatAssetConstraint } from './IRocketChatAssets';

export type SettingId = string;
export type GroupId = SettingId;
export type TabId = SettingId;
export type SectionName = string;

export enum SettingEditor {
	COLOR = 'color',
	EXPRESSION = 'expression',
}
type AssetValue = { defaultUrl?: string };
export type SettingValueMultiSelect = (string | number)[];
export type SettingValueRoomPick = Array<{ _id: string; name: string }> | string;
export type SettingValue = string | boolean | number | SettingValueMultiSelect | Date | AssetValue | undefined;

export interface ISettingSelectOption {
	key: string | number;
	i18nLabel: string;
}

export type ISetting = ISettingBase | ISettingEnterprise | ISettingColor | ISettingCode | ISettingAction | ISettingAsset;

type EnableQuery = string | { _id: string; value: any } | { _id: string; value: any }[];

export interface ISettingBase {
	_id: SettingId;
	type:
		| 'boolean'
		| 'timezone'
		| 'string'
		| 'relativeUrl'
		| 'password'
		| 'int'
		| 'select'
		| 'multiSelect'
		| 'language'
		| 'color'
		| 'font'
		| 'code'
		| 'action'
		| 'asset'
		| 'roomPick'
		| 'group'
		| 'date'
		| 'lookup';
	public: boolean;
	env: boolean;
	group?: GroupId;
	section?: SectionName;
	tab?: TabId;
	i18nLabel: string;
	value: SettingValue;
	packageValue: SettingValue;
	blocked: boolean;
	enableQuery?: EnableQuery;
	displayQuery?: EnableQuery;
	sorter: number;
	properties?: unknown;
	enterprise?: boolean;
	requiredOnWizard?: boolean;
	hidden?: boolean;
	modules?: Array<string>;
	invalidValue?: SettingValue;
	valueSource?: string;
	secret?: boolean;
	i18nDescription?: string;
	autocomplete?: boolean;
	processEnvValue?: SettingValue;
	meteorSettingsValue?: SettingValue;
	ts: Date;
	createdAt: Date;
	_updatedAt?: Date;
	multiline?: boolean;
	values?: Array<ISettingSelectOption>;
	placeholder?: string;
	lookupEndpoint?: string;
	wizard?: {
		step: number;
		order: number;
	} | null;
	persistent?: boolean; // todo: remove
	readonly?: boolean; // todo: remove
	alert?: string; // todo: check if this is still used
	private?: boolean; // todo: remove
}

export interface ISettingGroup {
	_id: string;
	hidden: boolean;
	blocked: boolean;
	ts?: Date;
	sorter: number;
	i18nLabel: string;
	displayQuery?: EnableQuery;
	i18nDescription: string;
	value?: undefined;
	type: 'group';

	alert?: string; // todo: check if this is needed
}

export interface ISettingEnterprise extends ISettingBase {
	enterprise: true;
	invalidValue: SettingValue;
}

export interface ISettingColor extends ISettingBase {
	type: 'color';
	editor: SettingEditor;
	packageEditor?: SettingEditor;
}
export interface ISettingCode extends ISettingBase {
	type: 'code';
	code?: string;
}

export interface ISettingAction extends ISettingBase {
	type: 'action';
	value: string;
	actionText?: string;
}
export interface ISettingAsset extends ISettingBase {
	type: 'asset';
	value: AssetValue;
	fileConstraints: IRocketChatAssetConstraint;
	asset: string;
}

export interface ISettingDate extends ISettingBase {
	type: 'date';
	value: Date;
}

export const isDateSetting = (setting: ISetting): setting is ISettingDate => setting.type === 'date';

export const isSettingEnterprise = (setting: ISettingBase): setting is ISettingEnterprise => setting.enterprise === true;

export const isSettingColor = (setting: ISettingBase): setting is ISettingColor => setting.type === 'color';

export const isSettingCode = (setting: ISettingBase): setting is ISettingCode => setting.type === 'code';

export const isSettingAction = (setting: ISettingBase): setting is ISettingAction => setting.type === 'action';

export const isSettingAsset = (setting: ISettingBase): setting is ISettingAsset => setting.type === 'asset';

export interface ISettingStatistics {
	account2fa?: boolean;
	cannedResponsesEnabled?: boolean;
	e2e?: boolean;
	e2eDefaultDirectRoom?: boolean;
	e2eDefaultPrivateRoom?: boolean;
	smtpHost?: string;
	smtpPort?: string;
	fromEmail?: string;
	fileUploadEnable?: boolean;
	frameworkDevMode?: boolean;
	frameworkEnable?: boolean;
	surveyEnabled?: boolean;
	updateChecker?: boolean;
	liveStream?: boolean;
	broadcasting?: boolean;
	allowEditing?: boolean;
	allowDeleting?: boolean;
	allowUnrecognizedSlashCommand?: boolean;
	allowBadWordsFilter?: boolean;
	readReceiptEnabled?: boolean;
	readReceiptStoreUsers?: boolean;
	otrEnable?: boolean;
	pushEnable?: boolean;
	globalSearchEnabled?: boolean;
	threadsEnabled?: boolean;
	webRTCEnableChannel?: boolean;
	webRTCEnablePrivate?: boolean;
	webRTCEnableDirect?: boolean;
}

export interface ISettingStatisticsObject {
	accounts?: {
		account2fa?: boolean;
	};
	cannedResponses?: {
		cannedResponsesEnabled?: boolean;
	};
	e2ee?: {
		e2e?: boolean;
		e2eDefaultDirectRoom?: boolean;
		e2eDefaultPrivateRoom?: boolean;
	};
	email?: {
		smtp?: {
			smtpHost?: string;
			smtpPort?: string;
			fromEmail?: string;
		};
	};
	fileUpload?: {
		fileUploadEnable?: boolean;
	};
	general?: {
		apps?: {
			frameworkDevMode?: boolean;
			frameworkEnable?: boolean;
		};
		nps?: {
			surveyEnabled?: boolean;
		};
		update?: {
			updateChecker?: boolean;
		};
	};
	liveStreamAndBroadcasting?: {
		liveStream?: boolean;
		broadcasting?: boolean;
	};
	message?: {
		allowEditing?: boolean;
		allowDeleting?: boolean;
		allowUnrecognizedSlashCommand?: boolean;
		allowBadWordsFilter?: boolean;
		readReceiptEnabled?: boolean;
		readReceiptStoreUsers?: boolean;
	};
	otr?: {
		otrEnable?: boolean;
	};
	push?: {
		pushEnable?: boolean;
	};
	search?: {
		defaultProvider?: {
			globalSearchEnabled?: boolean;
		};
	};
	threads?: {
		threadsEnabled?: boolean;
	};
	videoConference?: {
		bigBlueButton?: boolean;
		jitsiEnabled?: boolean;
	};
	webRTC?: {
		webRTCEnableChannel?: boolean;
		webRTCEnablePrivate?: boolean;
		webRTCEnableDirect?: boolean;
	};
}
