import type { ISetting, ISettingColor, LoginServiceConfiguration } from '@rocket.chat/core-typings';

import type { PaginatedResult } from '../helpers/PaginatedResult';

type SettingsUpdateProps = SettingsUpdatePropDefault | SettingsUpdatePropsActions | SettingsUpdatePropsColor;

type SettingsUpdatePropsActions = {
	execute: boolean;
};

export const isSettingsUpdatePropsActions = (props: Partial<SettingsUpdateProps>): props is SettingsUpdatePropsActions =>
	'execute' in props;

type SettingsUpdatePropsColor = {
	editor: ISettingColor['editor'];
	value: ISetting['value'];
};

export const isSettingsUpdatePropsColor = (props: Partial<SettingsUpdateProps>): props is SettingsUpdatePropsColor =>
	'editor' in props && 'value' in props;

type SettingsUpdatePropDefault = {
	value: ISetting['value'];
};

export const isSettingsUpdatePropDefault = (props: Partial<SettingsUpdateProps>): props is SettingsUpdatePropDefault => 'value' in props;

export type SettingsEndpoints = {
	'/v1/settings.public': {
		GET: () => PaginatedResult & {
			settings: Array<ISetting>;
		};
	};

	'/v1/settings.oauth': {
		GET: () => {
			services: Partial<LoginServiceConfiguration>[];
		};
	};

	'/v1/settings.addCustomOAuth': {
		POST: (params: { name: string }) => void;
	};

	'/v1/settings': {
		GET: () => {
			settings: ISetting[];
		};
	};

	'/v1/settings/:_id': {
		GET: () => Pick<ISetting, '_id' | 'value'>;
		POST: (params: SettingsUpdateProps) => void;
	};

	'/v1/service.configurations': {
		GET: () => {
			configurations: Array<{
				appId: string;
				secret: string;
			}>;
		};
	};
};
