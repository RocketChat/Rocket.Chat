import { settings } from '../../../settings/server';

export const getFederationDomain = () => settings.get('FEDERATION_Domain').replace('@', '');
