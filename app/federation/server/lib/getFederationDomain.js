import { settings } from '../../../../server/settings';

export const getFederationDomain = () => settings.get('FEDERATION_Domain').replace('@', '');
