import { settings } from '../../../settings/server';

export const getFederationDomain = () => settings.get<string>('FEDERATION_Domain').replace('@', '');
