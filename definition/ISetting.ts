export type SettingId = string;
export type GroupId = SettingId;
export type SectionName = string;

export enum SettingType {
	BOOLEAN = 'boolean',
	STRING = 'string',
	RELATIVE_URL = 'relativeUrl',
	PASSWORD = 'password',
	INT = 'int',
	SELECT = 'select',
	MULTI_SELECT = 'multiSelect',
	LANGUAGE = 'language',
	COLOR = 'color',
	FONT = 'font',
	CODE = 'code',
	ACTION = 'action',
	ASSET = 'asset',
	ROOM_PICK = 'roomPick',
	GROUP = 'group',
}

export enum SettingEditor {
	COLOR = 'color',
	EXPRESSION = 'expression'
}

export interface ISetting {
	_id: SettingId;
	type: SettingType;
	public: boolean;
	group?: GroupId;
	section?: SectionName;
	i18nLabel: string;
	value: unknown;
	packageValue: unknown;
	editor?: SettingEditor;
	packageEditor?: SettingEditor;
	blocked: boolean;
	enableQuery?: string | Mongo.ObjectID | Mongo.Query<any> | Mongo.QueryWithModifiers<any>;
	sorter?: number;
}
