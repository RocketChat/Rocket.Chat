import { ISetting, ISettingColor, SettingValue } from '../../ISetting';
import { PaginatedResult } from '../helpers/PaginatedResult';

type SettingsUpdateProps = SettingsUpdatePropDefault | SettingsUpdatePropsActions | SettingsUpdatePropsColor;

type SettingsUpdatePropsActions = {
	execute: boolean;
};

export type OauthCustomConfiguration = {
	_id: string;
	clientId?: string;
	custom: boolean; // unknown
	service?: string;
	serverURL: string; // unknown
	tokenPath: string; // unknown
	identityPath: string; // unknown
	authorizePath: string; // unknown
	scope: string; // unknown
	loginStyle: 'popup' | 'redirect';
	tokenSentVia: string | boolean; // unknown
	identityTokenSentVia: string | boolean; // unknown
	keyField: string | boolean; // unknown
	usernameField: string | boolean; // unknown
	emailField: string | boolean; // unknown
	nameField: string | boolean; // unknown
	avatarField: string | boolean; // unknown
	rolesClaim: string; // unknown
	groupsClaim: string; // unknown
	mapChannels: string; // unknown
	channelsMap: string; // unknown
	channelsAdmin: string; // unknown
	mergeUsers: boolean; // unknown
	mergeRoles: boolean; // unknown
	accessTokenParam: string; // unknown
	showButton: boolean; // unknown

	appId: string; // unknown
	consumerKey?: string;

	clientConfig: { provider: SettingValue }; // unknown
	buttonLabelText: SettingValue; // unknown
	buttonLabelColor: SettingValue; // unknown
	buttonColor: SettingValue; // unknown
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
