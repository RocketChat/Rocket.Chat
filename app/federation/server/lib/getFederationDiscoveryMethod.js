import { settings } from '../../../../server/settings';

export const getFederationDiscoveryMethod = () => settings.get('FEDERATION_Discovery_Method');
