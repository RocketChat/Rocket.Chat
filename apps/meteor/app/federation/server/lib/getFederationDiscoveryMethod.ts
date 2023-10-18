import { settings } from '../../../settings/server';

export const getFederationDiscoveryMethod = () => settings.get<string>('FEDERATION_Discovery_Method');
