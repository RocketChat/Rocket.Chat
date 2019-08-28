import mem from 'mem';

import { getWorkspaceAccessToken } from '../../cloud/server';
import { FederationKeys } from '../../models/server';
import { settings } from '../../settings/server';
import * as SettingsUpdater from './settingsUpdater';
import { logger } from './logger';

const defaultConfig = {
	hub: {
		active: null,
		url: null,
	},
	peer: {
		uniqueId: null,
		domain: null,
		url: null,
		public_key: null,
	},
	cloud: {
		token: null,
	},
};

const getConfigLocal = () => {
	const _enabled = settings.get('FEDERATION_Enabled');

	if (!_enabled) { return defaultConfig; }

	// If it is enabled, check if the settings are there
	const _uniqueId = settings.get('FEDERATION_Unique_Id');
	const _domain = settings.get('FEDERATION_Domain');
	const _discoveryMethod = settings.get('FEDERATION_Discovery_Method');
	const _hubUrl = settings.get('FEDERATION_Hub_URL');
	const _peerUrl = settings.get('Site_Url');

	if (!_domain || !_discoveryMethod || !_hubUrl || !_peerUrl) {
		SettingsUpdater.updateStatus('Could not enable, settings are not fully set');

		logger.setup.error('Could not enable Federation, settings are not fully set');

		return defaultConfig;
	}

	logger.setup.info('Updating settings...');

	// Normalize the config values
	return {
		hub: {
			active: _discoveryMethod === 'hub',
			url: _hubUrl.replace(/\/+$/, ''),
		},
		peer: {
			uniqueId: _uniqueId,
			domain: _domain.replace('@', '').trim(),
			url: _peerUrl.replace(/\/+$/, ''),
			public_key: FederationKeys.getPublicKeyString(),
		},
		cloud: {
			token: getWorkspaceAccessToken(),
		},
	};
};

export const getConfig = mem(getConfigLocal);

const updateValue = () => mem.clear(getConfig);

settings.get('FEDERATION_Enabled', updateValue);
settings.get('FEDERATION_Unique_Id', updateValue);
settings.get('FEDERATION_Domain', updateValue);
settings.get('FEDERATION_Status', updateValue);
settings.get('FEDERATION_Discovery_Method', updateValue);
settings.get('FEDERATION_Hub_URL', updateValue);
