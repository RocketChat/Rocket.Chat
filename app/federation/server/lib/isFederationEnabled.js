import { settings } from '../../../../server/settings';

export const isFederationEnabled = () => settings.get('FEDERATION_Enabled');
