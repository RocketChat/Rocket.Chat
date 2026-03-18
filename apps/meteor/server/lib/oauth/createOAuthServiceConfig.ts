import { capitalize } from '@rocket.chat/string-helpers';

import type { OAuthServiceInfo } from './getOAuthServices';
import type { CustomOAuthOptions, OAuthServiceConfig } from './passport';
import { builtInStrategyMap, type BuiltInProvider } from './strategiesMap';
import { type ICachedSettings } from '../../../app/settings/server/CachedSettings';

const providerScopeMap: Record<string, string[]> = {
	github: ['user:email'],
	facebook: ['email', 'public_profile'],
};

export const createOAuthServiceConfig = (settings: ICachedSettings, services: OAuthServiceInfo[]): OAuthServiceConfig[] => {
	return services.map((service): OAuthServiceConfig => {
		if (service.custom) {
			return createCustomOAuthServiceConfig(settings, service);
		}
		return createBuiltInOAuthServiceConfig(settings, service);
	});
};

const createBuiltInOAuthServiceConfig = (settings: ICachedSettings, service: OAuthServiceInfo): OAuthServiceConfig => {
	const capitalizedName = capitalize(service.name);
	return {
		provider: service.name,
		strategy: builtInStrategyMap[service.name as BuiltInProvider],
		clientId: settings.get<string>(`Accounts_OAuth_${capitalizedName}_id`),
		clientSecret: settings.get<string>(`Accounts_OAuth_${capitalizedName}_secret`),
		scope: providerScopeMap[service.name],
	};
};

const createCustomOAuthServiceConfig = (settings: ICachedSettings, service: OAuthServiceInfo): OAuthServiceConfig => {
	const key = service.settingsKey;

	const customOptions: CustomOAuthOptions = {
		serverURL: settings.get<string>(`${key}-url`) || '',
		tokenPath: settings.get<string>(`${key}-token_path`) || '/oauth/token',
		identityPath: settings.get<string>(`${key}-identity_path`) || '/me',
		authorizePath: settings.get<string>(`${key}-authorize_path`) || '/oauth/authorize',
		scope: settings.get<string>(`${key}-scope`) || 'openid',
		accessTokenParam: settings.get<string>(`${key}-access_token_param`) || 'access_token',
		tokenSentVia: settings.get<'header' | 'payload'>(`${key}-token_sent_via`) || 'payload',
		identityTokenSentVia: settings.get<'header' | 'payload' | 'default'>(`${key}-identity_token_sent_via`) || 'default',
		keyField: settings.get<'username' | 'email'>(`${key}-key_field`) || 'username',
		usernameField: settings.get<string>(`${key}-username_field`) || '',
		emailField: settings.get<string>(`${key}-email_field`) || '',
		nameField: settings.get<string>(`${key}-name_field`) || '',
		avatarField: settings.get<string>(`${key}-avatar_field`) || '',
		mergeUsers: settings.get<boolean>(`${key}-merge_users`) || false,
		mergeUsersDistinctServices: settings.get<boolean>(`${key}-merge_users_distinct_services`) || false,
		rolesClaim: settings.get<string>(`${key}-roles_claim`) || 'roles',
		groupsClaim: settings.get<string>(`${key}-groups_claim`) || 'groups',
		channelsAdmin: settings.get<string>(`${key}-channels_admin`) || 'rocket.cat',
		mapChannels: settings.get<boolean>(`${key}-map_channels`) || false,
		channelsMap: settings.get<string>(`${key}-groups_channel_map`) || '',
		mergeRoles: settings.get<boolean>(`${key}-merge_roles`) || false,
		rolesToSync: settings.get<string>(`${key}-roles_to_sync`) || '',
		showButton: settings.get<boolean>(`${key}-show_button`) ?? true,
		buttonLabelText: settings.get<string>(`${key}-button_label_text`) || '',
		buttonLabelColor: settings.get<string>(`${key}-button_label_color`) || '#FFFFFF',
		buttonColor: settings.get<string>(`${key}-button_color`) || '#1d74f5',
		loginStyle: settings.get<string>(`${key}-login_style`) || 'popup',
	};

	const CustomOAuthStrategy = require('./passport').CustomOAuthStrategy;

	return {
		provider: service.name,
		strategy: CustomOAuthStrategy,
		clientId: settings.get<string>(`${key}-id`) || '',
		clientSecret: settings.get<string>(`${key}-secret`) || '',
		custom: true,
		scope: customOptions.scope?.split(/[\s,]+/).filter(Boolean),
		customOptions,
	};
};
