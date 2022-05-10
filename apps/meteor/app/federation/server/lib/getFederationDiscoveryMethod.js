import { settings } from '../../../settings/server';

export const getFederationDiscoveryMethod = () => settings.get('FEDERATION_Discovery_Method');
