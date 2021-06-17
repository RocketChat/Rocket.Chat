import { settings } from '../../../settings';

export const isFederationEnabled = () => settings.get('FEDERATION_Enabled');
