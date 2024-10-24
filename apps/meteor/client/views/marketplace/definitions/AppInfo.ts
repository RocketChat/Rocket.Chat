import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { ISettingSelectValue, SettingType } from '@rocket.chat/apps-engine/definition/settings';
import type { AppScreenshot } from '@rocket.chat/core-typings';

import type { App } from '../types';

export type AppSetting = {
	id: string;
	type: SettingType;
	packageValue: any;
	value?: unknown;
	required: boolean;
	public: boolean;
	hidden?: boolean;
	values?: Array<ISettingSelectValue>;
	multiline?: boolean;
	section?: string;
	i18nLabel: string;
	i18nDescription?: string;
	i18nAlert?: string;
	i18nPlaceholder?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type AppInfo = App & {
	settings?: AppSetting[];
	apis: Array<IApiEndpointMetadata>;
	screenshots: Array<AppScreenshot>;
};
