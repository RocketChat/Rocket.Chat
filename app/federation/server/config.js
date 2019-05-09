import { getWorkspaceAccessToken } from '../../cloud/server';
import { settings } from '../../settings';
import { FederationKeys } from '../../models';

let config = null;

// Generate keys

// Create unique id if needed
if (!FederationKeys.getUniqueId()) {
	FederationKeys.generateUniqueId();
}

// Create key pair if needed
if (!FederationKeys.getPublicKey()) {
	FederationKeys.generateKeys();
}

export function getConfig() {
	if (config) { return config; }

	// If it is enabled, check if the settings are there
	const _uniqueId = settings.get('FEDERATION_Unique_Id');
	const _domain = settings.get('FEDERATION_Domain');
	const _discoveryMethod = settings.get('FEDERATION_Discovery_Method');
	const _hubUrl = settings.get('FEDERATION_Hub_URL');
	const _peerUrl = settings.get('Site_Url');

	// Normalize the config values
	config = {
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

	return config;
}
