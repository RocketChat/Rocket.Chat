import { settings } from '../../../settings';

export const getFederationDomain = () => settings.get('FEDERATION_Domain').replace('@', '');
