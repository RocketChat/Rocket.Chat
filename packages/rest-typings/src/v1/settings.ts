import type { ISetting, ISettingColor } from '@rocket.chat/core-typings';

import type { PaginatedResult } from '../helpers/PaginatedResult';

type SettingsUpdateProps = SettingsUpdatePropDefault | SettingsUpdatePropsActions | SettingsUpdatePropsColor;

type SettingsUpdatePropsActions = {
	execute: boolean;
};

export type OauthCustomConfiguration = {
	_id: string;
	clientId?: string;
	custom: boolean;
	service?: string;
	serverURL: string;
	tokenPath: string;
	identityPath: string;
	authorizePath: string;
	scope: string;
	loginStyle: 'popup' | 'redirect';
	tokenSentVia: 'header' | 'payload';
	identityTokenSentVia: 'default' | 'header' | 'payload';
	keyField: 'username' | 'email';
	usernameField: string;
	emailField: string;
	nameField: string;
	avatarField: string;
	rolesClaim: string;
	groupsClaim: string;
	mapChannels: string;
	channelsMap: string;
	channelsAdmin: string;
	mergeUsers: boolean;
	mergeRoles: boolean;
	accessTokenParam: string;
	showButton: boolean;

	appId: string;
	consumerKey?: string;

	clientConfig: unknown;
	buttonLabelText: string;
	buttonLabelColor: string;
	buttonColor: string;
};

export const isOauthCustomConfiguration = (config: any): config is OauthCustomConfiguration => Boolean(config);

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
	'settings.public': {
		GET: () => PaginatedResult & {
			settings: Array<ISetting>;
		};
	};

	'settings.oauth': {
		GET: () => {
			services: Partial<OauthCustomConfiguration>[];
		};
	};

	'settings.addCustomOAuth': {
		POST: (params: { name: string }) => void;
	};

	'settings': {
		GET: () => {
			settings: ISetting[];
		};
	};

	'settings/:_id': {
		GET: () => Pick<ISetting, '_id' | 'value'>;
		POST: (params: SettingsUpdateProps) => void;
	};

	'service.configurations': {
		GET: () => {
			configurations: Array<{
				appId: string;
				secret: string;
			}>;
		};
	};
};
