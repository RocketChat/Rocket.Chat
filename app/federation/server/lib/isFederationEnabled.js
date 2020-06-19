import { settings } from '../../../settings/server';

export const isFederationEnabled = () => settings.get('FEDERATION_Enabled');
