import Ajv, { JSONSchemaType } from 'ajv';

import { ISetting, ISettingColor } from '../../ISetting';
import { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv();

type SettingsAddCustomOAuth = {
	name: string;
};

const SettingsAddCustomOAuthSchema: JSONSchemaType<SettingsAddCustomOAuth> = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isSettingsAddCustomOAuth = ajv.compile(SettingsAddCustomOAuthSchema);

type SettingsUpdateProps = SettingsUpdatePropDefault | SettingsUpdatePropsActions | SettingsUpdatePropsColor;

type SettingsUpdatePropsActions = {
	execute: boolean;
};

export type OauthCustomConfiguration = {
	_id: string;
	clientId?: string;
	custom: unknown;
	service?: string;
	serverURL: unknown;
	tokenPath: unknown;
	identityPath: unknown;
	authorizePath: unknown;
	scope: unknown;
	loginStyle: 'popup' | 'redirect';
	tokenSentVia: unknown;
	identityTokenSentVia: unknown;
	keyField: unknown;
	usernameField: unknown;
	emailField: unknown;
	nameField: unknown;
	avatarField: unknown;
	rolesClaim: unknown;
	groupsClaim: unknown;
	mapChannels: unknown;
	channelsMap: unknown;
	channelsAdmin: unknown;
	mergeUsers: unknown;
	mergeRoles: unknown;
	accessTokenParam: unknown;
	showButton: unknown;

	appId: unknown;
	consumerKey?: string;

	clientConfig: unknown;
	buttonLabelText: unknown;
	buttonLabelColor: unknown;
	buttonColor: unknown;
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
		POST: (params: SettingsAddCustomOAuth) => void;
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
