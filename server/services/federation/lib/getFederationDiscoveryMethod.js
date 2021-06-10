import { settings } from '../../../settings';

export const getFederationDiscoveryMethod = () => settings.get('FEDERATION_Discovery_Method');
