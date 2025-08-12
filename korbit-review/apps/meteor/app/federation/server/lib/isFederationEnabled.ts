import { settings } from '../../../settings/server';

export const isFederationEnabled = () => settings.get<boolean>('FEDERATION_Enabled');
