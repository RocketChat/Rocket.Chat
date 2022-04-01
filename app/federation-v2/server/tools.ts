import { settings } from '../../settings/server';

export const isFederationV2Enabled = () => settings.get('FederationV2_enabled');
